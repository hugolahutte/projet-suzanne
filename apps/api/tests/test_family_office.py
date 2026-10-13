from uuid import uuid4
import pytest
from sqlalchemy import select
from suzanne.db import SessionLocal
from suzanne.models import ProfileDetails, User, LearningProfile


def test_profile_access_and_persistence(client, login):
    login()
    rows = client.get('/households/atelier/members').json()
    assert {r['id'] for r in rows} == {'camille', 'noe', 'lila'}
    original = next(r for r in rows if r['id'] == 'noe')
    keys = ('name', 'age', 'level', 'interest', 'school', 'school_year', 'languages', 'options', 'learning_notes')
    payload = {k: original[k] for k in keys}
    try:
        response = client.patch('/households/atelier/members/noe', json={**payload, 'languages':'Anglais', 'options':'Latin', 'school_year':'2026–2027'})
        assert response.status_code == 200
        assert response.json()['options'] == 'Latin'
        assert next(r for r in client.get('/households/atelier/members').json() if r['id']=='noe')['languages'] == 'Anglais'
        assert client.patch('/households/atelier/members/gabriel', json=payload).status_code == 404
        assert client.patch('/households/horizon/members/sami', json=payload).status_code == 404
        assert client.patch('/households/atelier/members/noe', json={**payload,'role':'guardian'}).status_code == 422
        login('noe')
        assert [r['id'] for r in client.get('/households/atelier/members').json()] == ['noe']
        assert client.patch('/households/atelier/members/noe', json=payload).status_code == 403
    finally:
        login()
        client.patch('/households/atelier/members/noe', json=payload)


def upload(client, owner='noe', **overrides):
    params = dict(owner=owner, title='Bulletin fictif', filename='test.pdf', kind='report', school_year='2025–2026')
    params.update(overrides)
    return client.post('/households/atelier/documents', params=params, content=b'%PDF-1.4\n%%EOF', headers={'Content-Type':'application/pdf'})


def test_document_acl_recovery_and_download(client, login):
    login()
    r = upload(client)
    assert r.status_code == 201
    did = r.json()['id']
    file = f'/households/atelier/documents/{did}/file'
    response = client.get(file)
    assert response.content.startswith(b'%PDF-')
    assert response.headers['content-disposition'].startswith('attachment;')
    assert response.headers['cache-control'] == 'no-store'
    assert 'sandbox' in response.headers['content-security-policy']
    login('lila')
    assert client.get(file).status_code == 404
    assert client.patch(f'/households/atelier/documents/{did}', json={'deleted':True}).status_code == 404
    assert upload(client, owner='noe').status_code == 404
    login('rose')
    assert client.get(file).status_code == 404
    login('noe')
    assert client.get(file).status_code == 200
    assert client.patch(f'/households/atelier/documents/{did}', json={'deleted':True}).status_code == 200
    assert client.get(file).status_code == 404
    assert did in [d['id'] for d in client.get('/households/atelier/documents?trash=true').json()]
    login()
    assert client.patch(f'/households/atelier/documents/{did}', json={'deleted':False}).status_code == 200
    assert client.get(file).status_code == 200


def test_document_validation_limits_and_auth(client, login, monkeypatch):
    assert upload(client).status_code == 401
    login()
    assert upload(client,filename='../test.pdf').status_code == 422
    assert upload(client,title=' ').status_code == 422
    assert upload(client,filename='test.png').status_code == 415
    assert client.post('/households/atelier/documents',params={'owner':'noe','title':'x','filename':'a.pdf'},content=b'<script>alert(1)</script>').status_code==415
    import suzanne.family as module
    monkeypatch.setattr(module, 'MAX_FILE', 8)
    assert upload(client).status_code == 413
    assert client.post('/households/atelier/documents',params={'owner':'noe','title':'x','filename':'a.pdf'},content=b'%PDF-abcmore', headers={'origin':'https://evil.test'}).status_code==403


def test_budget_permissions_validation_and_no_provider(client, login):
    login()
    old = client.get('/households/atelier/budget').json()
    try:
        assert client.patch('/households/atelier/budget', json={'monthly_cap_cents':1500,'video_cap_cents':500}).status_code==200
        b = client.get('/households/atelier/budget').json()
        assert b == {'monthly_cap_cents':1500,'video_cap_cents':500,'spent_cents':0,'provider_ready':False}
        assert client.patch('/households/atelier/budget',json={'monthly_cap_cents':500,'video_cap_cents':1000}).status_code==422
        assert client.patch('/households/atelier/budget',json={'monthly_cap_cents':-1,'video_cap_cents':0}).status_code==422
        assert client.patch('/households/atelier/budget',json={'monthly_cap_cents':True,'video_cap_cents':0}).status_code==422
        for name in ('noe','gabriel'):
            login(name)
            assert client.get('/households/atelier/budget').status_code==403
            assert client.patch('/households/atelier/budget',json={'monthly_cap_cents':1,'video_cap_cents':0}).status_code==403
    finally:
        login()
        client.patch('/households/atelier/budget',json={k:old[k] for k in ('monthly_cap_cents','video_cap_cents')})


def test_game_history_ownership_and_idempotency(client, login):
    login('noe')
    body={'id':str(uuid4()),'kind':'capitales','players':[{'name':'Joueur fictif','score':4}]}
    endpoint='/households/atelier/games'
    assert client.post(endpoint,json=body).status_code==201
    assert client.post(endpoint,json=body).status_code==201
    assert sum(r['id']==body['id'] for r in client.get(endpoint).json())==1
    assert client.post(endpoint,json={**body,'players':[{'name':'Test','score':6}]}).status_code==422
    assert client.post(endpoint,json={**body,'players':[{'name':'Test','score':1}]}).status_code==409
    login('lila')
    assert body['id'] not in [r['id'] for r in client.get(endpoint).json()]
    assert client.post(endpoint,json=body).status_code==409
    login()
    assert body['id'] in [r['id'] for r in client.get(endpoint).json()]
    login('rose')
    assert client.get(endpoint).status_code==404


def test_questions_shared_within_household_but_editable_only_by_guardian(client, login):
    body={'prompt':'Combien de côtés a un triangle ?', 'answer':'3', 'explanation':'Un triangle a trois côtés.', 'active':True}
    login('noe')
    assert client.post('/households/atelier/questions',json=body).status_code==403
    login()
    created=client.post('/households/atelier/questions',json=body)
    assert created.status_code==201
    qid=created.json()['id']
    login('rose')
    assert client.get('/households/atelier/questions').status_code==404
    assert client.patch(f'/households/horizon/questions/{qid}',json=body).status_code==404
    login('noe')
    assert qid in [q['id'] for q in client.get('/households/atelier/questions').json()]
    assert client.patch(f'/households/atelier/questions/{qid}',json=body).status_code==403
    login()
    assert client.patch(f'/households/atelier/questions/{qid}',json={**body,'active':False}).status_code==200
    login('noe')
    assert qid not in [q['id'] for q in client.get('/households/atelier/questions').json()]
    assert client.get('/households/atelier/questions?archived=true').status_code==403
    login()
    assert qid in [q['id'] for q in client.get('/households/atelier/questions?archived=true').json()]
    assert client.post('/households/atelier/games',json={'id':str(uuid4()),'kind':'quiz','players':[{'name':'Test','score':5}]}).status_code==201
