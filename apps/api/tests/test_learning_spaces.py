from uuid import uuid4
import pytest


def test_notebook_persistence_and_isolation(client, login):
    login('noe')
    body = {'kind': 'grade', 'title': 'Fractions fictives', 'subject': 'Mathématiques', 'details': '14/20 — revoir les dénominateurs'}
    response = client.post('/households/atelier/notebook', json=body)
    assert response.status_code == 201
    entry = response.json()
    assert entry['id'] in [e['id'] for e in client.get('/households/atelier/notebook').json()]
    assert client.get('/households/horizon/notebook').status_code == 404
    assert client.post('/households/horizon/notebook', json=body).status_code == 404
    login('camille')
    assert entry['id'] not in [e['id'] for e in client.get('/households/atelier/notebook').json()]
    assert client.delete(f"/households/atelier/notebook/{entry['id']}").status_code == 404
    login('noe')
    assert client.delete(f"/households/horizon/notebook/{entry['id']}").status_code == 404
    assert client.delete(f"/households/atelier/notebook/{entry['id']}").status_code == 204
    assert entry['id'] not in [e['id'] for e in client.get('/households/atelier/notebook').json()]


@pytest.mark.parametrize('body', [{'kind':'scan','title':'x'}, {'kind':'book','title':' '}, {'kind':'book','title':'x','user_id':'lila'}, {'kind':'book','title':'x','details':'x'*2001}])
def test_notebook_rejects_invalid_data(client, login, body):
    login()
    assert client.post('/households/atelier/notebook', json=body).status_code == 422


def test_live_authorization_does_not_activate_provider(client, login):
    login('camille')
    assert client.patch('/households/atelier/live-settings', json={'live_allowed':True}).status_code == 200
    settings = client.get('/households/atelier/live-settings').json()
    assert settings['live_allowed'] is True
    assert settings['available'] is False
    assert settings['provider_ready'] is False
    assert client.get('/households/horizon/live-settings').status_code == 404
    for account in ['noe', 'gabriel']:
        login(account)
        assert client.get('/households/atelier/live-settings').json()['can_manage'] is False
        assert client.patch('/households/atelier/live-settings', json={'live_allowed':False}).status_code == 403
    login('camille')
    assert client.patch('/households/horizon/live-settings', json={'live_allowed':True}).status_code == 404
    assert client.patch('/households/atelier/live-settings', json={'live_allowed':False}).json()['live_allowed'] is False


def test_new_routes_require_login_and_origin(client, login):
    assert client.get('/households/atelier/notebook').status_code == 401
    assert client.get('/households/atelier/live-settings').status_code == 401
    login()
    assert client.post('/households/atelier/notebook', json={'kind':'book','title':'x'}, headers={'origin':'https://evil.example'}).status_code == 403
    assert client.delete(f'/households/atelier/notebook/{uuid4()}', headers={'origin':'https://evil.example'}).status_code == 403
    assert client.patch('/households/atelier/live-settings', json={'live_allowed':True}, headers={'origin':'https://evil.example'}).status_code == 403
