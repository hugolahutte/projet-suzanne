import os
import tempfile
from pathlib import Path
import pytest
from alembic.config import Config
from alembic import command

# Never use DATABASE_URL directly: tests always have a dedicated disposable database.
_temp = tempfile.TemporaryDirectory(prefix='suzanne-tests-')
os.environ['DATABASE_URL'] = os.getenv('TEST_DATABASE_URL', f'sqlite:///{_temp.name}/test.db')
os.environ['APP_ENV'] = 'test'
os.environ['APP_ORIGIN'] = 'http://localhost:3000'
from suzanne.db import SessionLocal
from suzanne.models import Session
from suzanne.seed import seed
from suzanne.main import app, login_attempts
from sqlalchemy import delete
from fastapi.testclient import TestClient

@pytest.fixture(scope='session', autouse=True)
def database():
    config = Config(str(Path(__file__).parents[1] / 'alembic.ini'))
    command.upgrade(config, 'head')
    seed()
    yield
    command.downgrade(config, 'base')
    command.upgrade(config, 'head')

@pytest.fixture
def client():
    login_attempts.clear()
    with SessionLocal() as db:
        db.execute(delete(Session))
        db.commit()
    with TestClient(app, headers={'origin': 'http://localhost:3000'}) as c:
        yield c

@pytest.fixture
def login(client):
    def do(name='camille'):
        response = client.post('/auth/login', json={'email': f'{name}@example.test', 'password': 'Suzanne-demo-2026!'})
        assert response.status_code == 200
        return response
    return do
