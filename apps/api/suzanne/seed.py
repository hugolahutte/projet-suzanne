"""Explicit, idempotent local-only fictional fixtures. Never runs at import."""
import os
from pwdlib import PasswordHash
from .db import SessionLocal
from .models import Household, User, Membership, GuardianLink, LearningProfile, Goal

DEMO_PASSWORD = 'Suzanne-demo-2026!'
PEOPLE = [
    ('camille', 'Camille', 39, 'guardian', 'atelier', 'Apprentissage libre', 'Arts & voyages'),
    ('noe', 'Noé', 12, 'child', 'atelier', '5e', 'Sciences & espace'),
    ('lila', 'Lila', 7, 'child', 'atelier', 'CE1', 'Nature & histoires'),
    ('gabriel', 'Gabriel', 41, 'adult', 'atelier', 'Apprentissage libre', 'Langues & musique'),
    ('rose', 'Rose', 72, 'guardian', 'horizon', 'Apprentissage libre', 'Histoire & jardin'),
    ('sami', 'Sami', 10, 'child', 'horizon', 'CM2', 'Océans & animaux'),
    ('jeanne', 'Jeanne', 87, 'adult', 'horizon', 'Apprentissage libre', 'Arts & littérature'),
]
def seed():
    if os.getenv('APP_ENV', 'local') not in ('local', 'test'):
        raise RuntimeError('Fixtures réservées au développement local.')
    with SessionLocal() as db:
        for hid, name in [('atelier', 'Famille Atelier'), ('horizon', 'Famille Horizon')]:
            if not db.get(Household, hid):
                db.add(Household(id=hid, name=name))
        db.flush()
        for uid, name, age, role, hid, level, interest in PEOPLE:
            if db.get(User, uid):
                continue
            db.add(User(id=uid, email=f'{uid}@example.test', password_hash=PasswordHash.recommended().hash(DEMO_PASSWORD), name=name, age=age))
            db.flush()
            db.add(Membership(user_id=uid, household_id=hid, role=role))
            db.add(LearningProfile(user_id=uid, nickname='Suzie' if age < 18 else 'Suzanne', level=level, interest=interest, large_text=age >= 70))
            db.add(Goal(id=f'{uid}-goal', household_id=hid, user_id=uid, title='Découvrir quelque chose de nouveau', done=False))
        db.flush()
        for hid, parent, child in [('atelier', 'camille', 'noe'), ('atelier', 'camille', 'lila'), ('horizon', 'rose', 'sami')]:
            if not db.get(GuardianLink, (hid, parent, child)):
                db.add(GuardianLink(household_id=hid, guardian_id=parent, child_id=child))
        db.commit()
if __name__ == '__main__':
    seed()
