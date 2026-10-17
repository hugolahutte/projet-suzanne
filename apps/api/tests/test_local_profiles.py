import json
import pytest
from pydantic import ValidationError
from sqlalchemy import delete
from suzanne.local_profiles import Family, import_family
from suzanne.db import SessionLocal, engine
from suzanne.models import Household, User, Membership, LearningProfile, GuardianLink, Session


def test_private_profile_import_validates_guardians():
    with pytest.raises(ValidationError):
        Family.model_validate({'name':'Foyer test','people':[{'name':'Enfant test','age':12,'role':'child','guardians':['Absent']}]})
    with pytest.raises(ValidationError):
        Family.model_validate({'name':'Foyer test','people':[{'name':'Enfant test','age':12,'role':'guardian'}]})


def test_private_import_does_not_publish_credentials(tmp_path, monkeypatch, client):
    if engine.dialect.name != 'sqlite':
        pytest.skip('Private profile import intentionally requires local SQLite.')
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv('APP_ENV','local')
    folder=tmp_path/'.local';folder.mkdir()
    source=folder/'profiles.json'
    source.write_text(json.dumps({'name':'Foyer de test importé','people':[{'name':'Parent test','age':40,'role':'guardian'},{'name':'Élève test','age':12,'role':'child','level':'5e','subjects':['Anglais','Latin','Grec'],'guardians':['Parent test']}]}))
    import_family(source)
    marker=folder/'profiles.imported.json'
    credentials=json.loads(marker.read_text())
    ids=[a['email'].split('@')[0] for a in credentials['accounts']]
    try:
        assert marker.stat().st_mode & 0o077 == 0
        visible=client.get('/demo/accounts').json()
        assert all(a['demo'] is False for a in visible if a['id'] in ids)
        assert credentials['password'] not in json.dumps(visible)
        response=client.post('/auth/login',json={'email':credentials['accounts'][1]['email'],'password':credentials['password']})
        assert response.status_code==200
        assert client.get('/me').json()['demo'] is False
        assert 'Latin' in client.get('/me').json()['profile']['interest']
        with pytest.raises(ValueError,match='existe déjà'):
            import_family(source)
    finally:
        with SessionLocal() as db:
            db.execute(delete(Session).where(Session.user_id.in_(ids)))
            db.execute(delete(GuardianLink).where(GuardianLink.household_id==credentials['household_id']))
            db.execute(delete(Membership).where(Membership.user_id.in_(ids)))
            db.execute(delete(LearningProfile).where(LearningProfile.user_id.in_(ids)))
            db.execute(delete(User).where(User.id.in_(ids)))
            db.execute(delete(Household).where(Household.id==credentials['household_id']))
            db.commit()
