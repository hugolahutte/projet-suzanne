import time
import pytest
from sqlalchemy import select
from suzanne.db import SessionLocal
from suzanne.models import Session, User, LearningProfile, GuardianLink
from suzanne.main import digest

@pytest.mark.parametrize('path', ['/me', '/households/atelier/dashboard', '/households/atelier/children'])
def test_anonymous_denied(client, path):
    assert client.get(path).status_code == 401

def test_bad_credentials_and_unknown_account_are_identical(client):
    responses = [client.post('/auth/login', json={'email': email, 'password': 'incorrect'}) for email in ['camille@example.test', 'unknown@example.test']]
    assert responses[0].status_code == responses[1].status_code == 401
    assert responses[0].json() == responses[1].json()

@pytest.mark.parametrize('user,own,other', [('camille','atelier','horizon'), ('rose','horizon','atelier'), ('noe','atelier','horizon'), ('sami','horizon','atelier')])
def test_households_are_isolated(client, login, user, own, other):
    login(user)
    assert client.get(f'/households/{own}/dashboard').status_code == 200
    assert client.get(f'/households/{other}/dashboard').status_code == 404
    assert client.get(f'/households/{other}/children').status_code == 404
    assert client.post(f'/households/{other}/goals', json={'title':'Intrusion'}).status_code == 404
    assert [h['id'] for h in client.get('/me').json()['households']] == [own]

@pytest.mark.parametrize('user', ['noe','lila','gabriel'])
def test_child_and_ordinary_adult_cannot_supervise(client, login, user):
    login(user)
    assert client.get('/households/atelier/children').status_code == 403

def test_guardian_sees_only_linked_children_and_minimal_fields(client, login):
    login()
    children = client.get('/households/atelier/children').json()
    assert {c['id'] for c in children} == {'noe','lila'}
    assert all(set(c) == {'id','name','level','minutes','topic','simulated'} for c in children)
    with SessionLocal() as db:
        link = db.get(GuardianLink, ('atelier', 'camille', 'lila'))
        db.delete(link); db.commit()
    assert [c['id'] for c in client.get('/households/atelier/children').json()] == ['noe']
    with SessionLocal() as db:
        db.add(GuardianLink(household_id='atelier',guardian_id='camille',child_id='lila')); db.commit()

def test_goal_owner_and_tenant_both_checked(client, login):
    login('noe')
    goal = client.post('/households/atelier/goals', json={'title':'Lire dix minutes'}).json()
    assert client.patch(f"/households/atelier/goals/{goal['id']}", json={'done':True}).json()['done']
    login('camille')
    assert client.patch(f"/households/atelier/goals/{goal['id']}", json={'done':False}).status_code == 404
    login('rose')
    assert client.patch(f"/households/horizon/goals/{goal['id']}", json={'done':False}).status_code == 404

def test_profile_write_cannot_target_other_user_or_elevate_role(client, login):
    login('noe')
    assert client.patch('/me/profile', json={'nickname':'Test','large_text':False,'user_id':'camille'}).status_code == 422
    assert client.patch('/me/profile', json={'nickname':'Test','large_text':False,'role':'guardian'}).status_code == 422
    response = client.patch('/me/profile', json={'nickname':'Suzie test','large_text':True})
    assert response.status_code == 200
    assert client.get('/me').json()['profile']['nickname'] == 'Suzie test'
    with SessionLocal() as db:
        assert db.get(LearningProfile,'camille').nickname == 'Suzanne'
        p = db.get(LearningProfile,'noe'); p.nickname = 'Suzie'; p.large_text = False; db.commit()

def test_cookie_logout_rotation_and_expiry(client, login):
    response = login()
    assert 'HttpOnly' in response.headers['set-cookie'] and 'SameSite=strict' in response.headers['set-cookie']
    token = client.cookies.get('suzanne_session')
    with SessionLocal() as db:
        record = db.get(Session,digest(token))
        assert record.token_hash != token
        assert db.get(User,'camille').password_hash.startswith('$argon2')
    login('noe')
    with SessionLocal() as db:
        assert db.get(Session,digest(token)) is None
    token = client.cookies.get('suzanne_session')
    client.post('/auth/logout')
    client.cookies.set('suzanne_session',token)
    assert client.get('/me').status_code == 401
    client.cookies.clear()
    login()
    with SessionLocal() as db:
        record = db.get(Session,digest(client.cookies.get('suzanne_session')))
        record.expires_at = int(time.time()) - 1; db.commit()
    assert client.get('/me').status_code == 401

@pytest.mark.parametrize('origin',['https://evil.example','null',''])
def test_csrf_origin_is_required(client, login, origin):
    login()
    assert client.patch('/me/profile', headers={'origin':origin}, json={'nickname':'Attack','large_text':False}).status_code == 403

def test_rate_limit(client):
    for _ in range(20):
        client.post('/auth/login',json={'email':'missing@example.test','password':'wrong'})
    assert client.post('/auth/login',json={'email':'camille@example.test','password':'Suzanne-demo-2026!'}).status_code == 429

def test_no_cache_and_openapi(client, login):
    login()
    assert client.get('/me').headers['cache-control'] == 'no-store'
    schema = client.get('/openapi.json').json()
    assert '/households/{hid}/goals/{gid}' in schema['paths']

def test_empty_and_oversized_input_rejected(client, login):
    login()
    for title in ['   ', 'x' * 121]:
        assert client.post('/households/atelier/goals', json={'title':title}).status_code == 422
