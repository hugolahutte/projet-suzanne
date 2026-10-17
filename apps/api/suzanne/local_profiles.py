"""Import private test profiles from an ignored local JSON file, never fixtures.

Usage: PYTHONPATH=apps/api .venv/bin/python -m suzanne.local_profiles .local/profiles.json
Creates a separate household. Never modifies demo accounts. Local SQLite only.
"""
import json
import os
import secrets
import sys
from pathlib import Path
from uuid import uuid4
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pwdlib import PasswordHash
from .db import SessionLocal, engine
from .models import Household, User, Membership, GuardianLink, LearningProfile

class Person(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=5, le=120)
    role: Literal['guardian', 'adult', 'child']
    level: str = Field(default='Apprentissage libre', max_length=60)
    interests: str = Field(default='', max_length=200)
    subjects: list[str] = Field(default_factory=list, max_length=20)
    guardians: list[str] = Field(default_factory=list, max_length=10)

    @model_validator(mode='after')
    def check_age(self):
        if (self.role == 'child') != (self.age < 18):
            raise ValueError('Le rôle doit être cohérent avec l’âge.')
        return self

class Family(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=80)
    people: list[Person] = Field(min_length=1, max_length=15)

    @model_validator(mode='after')
    def check_guardians(self):
        names = [p.name for p in self.people]
        if len(set(names)) != len(names):
            raise ValueError('Utilise des prénoms distincts pour cet import.')
        guardians = {p.name for p in self.people if p.role == 'guardian'}
        for person in self.people:
            if person.role == 'child' and (not person.guardians or not set(person.guardians) <= guardians):
                raise ValueError('Chaque enfant doit référencer ses responsables légaux explicites.')
            if person.role != 'child' and person.guardians:
                raise ValueError('Un adulte apprenant ne possède pas de supervision parentale.')
        return self

def import_family(source: Path):
    if os.getenv('APP_ENV', 'local') != 'local' or engine.dialect.name != 'sqlite':
        raise RuntimeError('Import réservé à une base SQLite locale.')
    private = Path('.local').resolve()
    source = source.resolve()
    if not source.is_relative_to(private):
        raise ValueError('Place le JSON dans le dossier .local ignoré par Git.')
    if source.stat().st_size > 32000:
        raise ValueError('Fichier trop volumineux.')
    # Do not echo validation errors: they may contain private input.
    try:
        family = Family.model_validate_json(source.read_text())
    except ValueError:
        raise ValueError('Fichier invalide : vérifie les champs, âges et responsables légaux.') from None
    marker = private / (source.stem + '.imported.json')
    if marker.exists():
        raise ValueError('Cet import existe déjà. Aucun compte modifié.')
    hid = 'local-' + str(uuid4())
    ids = {person.name: 'local-' + str(uuid4()) for person in family.people}
    password = secrets.token_urlsafe(18)
    # Common secret is for supervised local testing only, not a parental security boundary.
    credentials = {'household_id': hid, 'password': password, 'accounts': [{'name': p.name, 'email': f'{ids[p.name]}@local.invalid'} for p in family.people]}
    private.mkdir(mode=0o700, exist_ok=True)
    os.chmod(private, 0o700)
    with SessionLocal() as db:
        if db.query(Household).filter(Household.name == family.name).first():
            raise ValueError('Un foyer porte déjà ce nom. Aucun compte modifié.')
        db.add(Household(id=hid, name=family.name)); db.flush()
        for p in family.people:
            uid = ids[p.name]
            db.add(User(id=uid, email=f'{uid}@local.invalid', password_hash=PasswordHash.recommended().hash(password), name=p.name, age=p.age)); db.flush()
            db.add(Membership(user_id=uid, household_id=hid, role=p.role))
            db.add(LearningProfile(user_id=uid, nickname='Suzanne', level=p.level, interest=' · '.join(filter(None,[p.interests, ', '.join(p.subjects)])), large_text=p.age>=70))
        db.flush()
        for p in family.people:
            for parent in p.guardians:
                db.add(GuardianLink(household_id=hid, guardian_id=ids[parent], child_id=ids[p.name]))
        fd = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(fd, 'w') as output:
                json.dump(credentials, output, ensure_ascii=False, indent=2)
            db.commit()
        except Exception:
            marker.unlink(missing_ok=True)
            raise
    print('Profils importés. Identifiants conservés dans le dossier .local, sans affichage dans les journaux.')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Indique un fichier .local/profiles.json.')
    import_family(Path(sys.argv[1]))
