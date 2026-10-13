from concurrent.futures import ThreadPoolExecutor
from threading import Event
from uuid import uuid4
import httpx
import pytest
from sqlalchemy import delete, select
from suzanne import ai
from suzanne.db import SessionLocal
from suzanne.models import AIRequest, AISettings, FamilyBudget, User

ROOT = '/households/atelier/ai'
TRANSPORT = ai.send_provider

@pytest.fixture(autouse=True)
def isolated_ai(monkeypatch):
    for k, v in {'OPENROUTER_ENABLED': 'true', 'OPENROUTER_API_KEY': 'test-only-secret',
                 'OPENROUTER_MODEL': 'test/model', 'OPENROUTER_PROVIDER': 'test-provider',
                 'OPENROUTER_ACCOUNT_CAP_CONFIRMED': 'true'}.items():
        monkeypatch.setenv(k, v)
    with SessionLocal() as db:
        old = db.get(FamilyBudget, 'atelier')
        caps = (old.monthly_cap_cents, old.video_cap_cents) if old else None
        db.merge(FamilyBudget(household_id='atelier', monthly_cap_cents=100, video_cap_cents=0))
        db.merge(AISettings(household_id='atelier', enabled=True))
        db.commit()
    # Unexpected outbound calls fail immediately, never reach the network.
    monkeypatch.setattr(ai, 'send_provider', lambda *_: pytest.fail('Unexpected paid request'))
    yield
    with SessionLocal() as db:
        db.execute(delete(AIRequest)); db.execute(delete(AISettings))
        if caps:
            b = db.get(FamilyBudget, 'atelier')
            b.monthly_cap_cents, b.video_cap_cents = caps
        else:
            db.execute(delete(FamilyBudget).where(FamilyBudget.household_id == 'atelier'))
        db.commit()

def question(text='Explique une fraction.'):
    return {'id': str(uuid4()), 'text': text}

def good():
    return {'choices': [{'message': {'content': 'Imagine une pizza partagée en quatre.'}}], 'usage': {'cost': 0.0001}}

def test_disabled_auth_and_permission(client, login, monkeypatch):
    assert client.post(ROOT + '/questions', json=question()).status_code == 401
    login('noe')
    assert client.patch(ROOT, json={'enabled': False}).status_code == 403
    assert client.get('/households/horizon/ai').status_code == 404
    monkeypatch.setenv('OPENROUTER_ENABLED', 'false')
    assert client.get(ROOT).json()['provider_ready'] is False
    assert client.post(ROOT + '/questions', json=question()).status_code == 503
    login()
    assert client.patch(ROOT, json={'enabled': True}).status_code == 409
    assert client.patch(ROOT, json={'enabled': False}).status_code == 200
    monkeypatch.setenv('OPENROUTER_ENABLED', 'true')
    assert client.post(ROOT + '/questions', json=question()).status_code == 409
    assert client.patch(ROOT, json={'enabled': 'yes'}).status_code == 422

def test_minimization_replay_and_monthly_cap(client, login, monkeypatch):
    calls = []
    def fake(key, payload):
        calls.append(payload)
        return good()
    monkeypatch.setattr(ai, 'send_provider', fake)
    login('noe')
    body = question()
    response = client.post(ROOT + '/questions', json=body)
    assert response.status_code == 200
    assert client.post(ROOT + '/questions', json=body).json() == response.json()
    assert len(calls) == 1
    p = calls[0]
    assert p['messages'][1]['content'] == body['text']
    assert 'Noé' not in str(p) and 'example.test' not in str(p)
    assert p['provider']['only'] == ['test-provider']
    assert p['provider']['zdr'] and p['provider']['data_collection'] == 'deny'
    assert p['provider']['max_price']['request'] == 0
    assert not p['provider']['allow_fallbacks'] and 'tools' not in p
    assert client.post(ROOT + '/questions', json={**body, 'text': 'Différent'}).status_code == 409
    login('lila')
    assert client.post(ROOT + '/questions', json=body).status_code == 409
    login()
    used = client.get(ROOT).json()['reserved_cents']
    client.patch('/households/atelier/budget', json={'monthly_cap_cents': used, 'video_cap_cents': 0})
    assert client.post(ROOT + '/questions', json=question()).status_code == 409
    assert len(calls) == 1
    monkeypatch.setattr(ai, 'month', lambda: '2099-01')
    assert client.get(ROOT).json()['reserved_cents'] == 0

@pytest.mark.parametrize('result', [None, {}, {'choices': []}, {**good(), 'usage': {'cost': True}}, {**good(), 'usage': {'cost': float('nan')}}, {**good(), 'usage': {'cost': 3}}])
def test_uncertain_cost_keeps_reservation_blocks_restart_and_new_month(client, login, monkeypatch, result):
    calls = []
    def fake(*_):
        calls.append(1)
        if result is None:
            raise httpx.ReadTimeout('secret-provider-detail')
        return result
    monkeypatch.setattr(ai, 'send_provider', fake)
    login()
    body = question()
    response = client.post(ROOT + '/questions', json=body)
    assert response.status_code == 502 and 'secret-provider-detail' not in response.text
    assert client.get(ROOT).json()['reserved_cents'] > 0
    # Separate DB session and changed month emulate persisted state after restart.
    with SessionLocal() as db:
        assert db.get(AIRequest, body['id']).state == 'uncertain'
    monkeypatch.setattr(ai, 'month', lambda: '2099-01')
    assert not client.get(ROOT).json()['available']
    assert client.post(ROOT + '/questions', json=body).status_code == 409
    assert client.post(ROOT + '/questions', json=question()).status_code == 409
    assert len(calls) == 1

def test_concurrent_admission_reserves_before_network(client, login, monkeypatch):
    started, release = Event(), Event()
    calls = []
    def fake(*_):
        calls.append(1); started.set()
        assert release.wait(5)
        return good()
    monkeypatch.setattr(ai, 'send_provider', fake)
    def run(body):
        with SessionLocal() as db:
            return ai.ask('atelier', ai.Question(**body), db.get(User, 'camille'), db)
    with ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(run, question())
        try:
            assert started.wait(5)
            with pytest.raises(ai.HTTPException) as error:
                pool.submit(run, question()).result(timeout=5)
            assert error.value.status_code == 409
            with SessionLocal() as db:
                assert len(list(db.scalars(select(AIRequest)))) == 1
        finally:
            release.set()
        assert first.result(timeout=5)['answer']
    assert len(calls) == 1

def test_transport_fixed_url_timeout_no_retry(monkeypatch):
    seen = []
    def fake(request):
        seen.append(request)
        assert str(request.url) == ai.CHAT_URL
        assert request.headers['authorization'] == 'Bearer test-only-secret'
        assert request.extensions['timeout']['read'] == 30
        return httpx.Response(302, headers={'location': 'https://example.test/steal'})
    original = httpx.Client
    monkeypatch.setattr(ai.httpx, 'Client', lambda **kw: original(transport=httpx.MockTransport(fake), **kw))
    with pytest.raises(httpx.HTTPStatusError):
        TRANSPORT('test-only-secret', {})
    assert len(seen) == 1
