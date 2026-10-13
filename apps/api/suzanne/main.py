import hashlib
import os
import secrets
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Annotated, Literal
from uuid import uuid4
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, ConfigDict
from pwdlib import PasswordHash
from sqlalchemy import select, delete
from sqlalchemy.orm import Session as DBSession
from .db import db_session
from .models import User, Membership, Household, GuardianLink, LearningProfile, Session, Goal, NotebookEntry, HouseholdSettings

if os.getenv('APP_ENV', 'local') not in ('local', 'test'):
    raise RuntimeError('Sprint 1 : usage local uniquement. Auth de production à valider avant pilote.')
app = FastAPI(root_path='/api', title='Suzanne API', version='0.1.0', description='Sprint 1 local — données fictives. Aucune IA connectée.')
DB = Annotated[DBSession, Depends(db_session)]
COOKIE = 'suzanne_session'
ORIGIN = os.getenv('APP_ORIGIN', 'http://localhost:3000')
passwords = PasswordHash.recommended()
dummy_hash = passwords.hash(secrets.token_urlsafe(24))
login_attempts: dict[str, deque] = defaultdict(deque)
rate_lock = Lock()

@app.middleware('http')
async def security(request: Request, call_next):
    if request.method not in ('GET', 'HEAD', 'OPTIONS') and request.headers.get('origin') != ORIGIN:
        from starlette.responses import JSONResponse
        return JSONResponse({'detail': 'Origine de la requête non autorisée.'}, status_code=403)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
class Login(StrictModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=200)
class ProfileUpdate(StrictModel):
    nickname: str = Field(min_length=1, max_length=30)
    large_text: bool
class NewGoal(StrictModel):
    title: str = Field(min_length=1, max_length=120)
class GoalUpdate(StrictModel):
    done: bool

def digest(token: str):
    return hashlib.sha256(token.encode()).hexdigest()

def current_user(request: Request, db: DB):
    token = request.cookies.get(COOKIE, '')
    session = db.get(Session, digest(token)) if token else None
    if not session or session.expires_at <= int(time.time()):
        raise HTTPException(401, 'Connecte-toi pour retrouver ton espace.')
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, 'Session invalide.')
    return user
Principal = Annotated[User, Depends(current_user)]

def membership(db, user, hid):
    member = db.get(Membership, (hid, user.id))
    if not member:
        raise HTTPException(404, 'Espace introuvable.')
    return member

def own_profile(db, user):
    p = db.get(LearningProfile, user.id)
    return {'id': user.id, 'name': user.name, 'age': user.age, 'nickname': p.nickname, 'level': p.level, 'interest': p.interest, 'large_text': p.large_text}

def goal_json(g):
    return {'id': g.id, 'title': g.title, 'done': g.done}

@app.get('/health')
def health(db: DB):
    db.execute(select(1))
    return {'status': 'ok'}

@app.get('/demo/accounts')
def accounts(db: DB):
    # Local-only profile chooser. Imported profiles never include passwords here.
    rows = db.execute(select(User, Membership, Household).join(Membership, User.id == Membership.user_id).join(Household, Household.id == Membership.household_id)).all()
    return [{'id': u.id, 'name': u.name, 'email': u.email, 'age': u.age, 'role': m.role, 'household': h.name, 'demo': not u.id.startswith('local-')} for u, m, h in rows]

@app.post('/auth/login')
def login(body: Login, request: Request, response: Response, db: DB):
    key = request.client.host if request.client else 'unknown'
    now = time.time()
    with rate_lock:
        q = login_attempts[key]
        while q and q[0] < now - 60:
            q.popleft()
        if len(q) >= 20:
            raise HTTPException(429, 'Patiente une minute avant de réessayer.')
        q.append(now)
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    valid = passwords.verify(body.password, user.password_hash if user else dummy_hash)
    if not user or not valid:
        raise HTTPException(401, 'Identifiants incorrects.')
    old = request.cookies.get(COOKIE)
    if old:
        db.execute(delete(Session).where(Session.token_hash == digest(old)))
    db.execute(delete(Session).where(Session.expires_at <= int(now)))
    token = secrets.token_urlsafe(32)
    db.add(Session(token_hash=digest(token), user_id=user.id, expires_at=int(now) + 28800))
    db.commit()
    response.set_cookie(COOKIE, token, httponly=True, secure=os.getenv('COOKIE_SECURE', 'false') == 'true', samesite='strict', max_age=28800, path='/')
    return {'ok': True}

@app.post('/auth/logout')
def logout(request: Request, response: Response, db: DB):
    db.execute(delete(Session).where(Session.token_hash == digest(request.cookies.get(COOKIE, ''))))
    db.commit()
    response.delete_cookie(COOKIE, path='/', httponly=True, samesite='strict')
    return {'ok': True}

@app.get('/me')
def me(user: Principal, db: DB):
    members = db.scalars(select(Membership).where(Membership.user_id == user.id)).all()
    return {'profile': own_profile(db, user), 'households': [{'id': m.household_id, 'name': db.get(Household, m.household_id).name, 'role': m.role} for m in members], 'demo': not user.id.startswith('local-')}

@app.patch('/me/profile')
def update_profile(body: ProfileUpdate, user: Principal, db: DB):
    p = db.get(LearningProfile, user.id)
    p.nickname, p.large_text = body.nickname, body.large_text
    db.commit()
    return own_profile(db, user)

@app.get('/households/{hid}/dashboard')
def dashboard(hid: str, user: Principal, db: DB):
    membership(db, user, hid)
    goals = db.scalars(select(Goal).where(Goal.household_id == hid, Goal.user_id == user.id)).all()
    return {'simulated': True, 'minutes': 45, 'discoveries': 3, 'week': [15, 8, 0, 12, 10, 0, 0], 'goals': [goal_json(g) for g in goals]}

@app.get('/households/{hid}/children')
def children(hid: str, user: Principal, db: DB):
    if membership(db, user, hid).role != 'guardian':
        raise HTTPException(403, 'Cet espace est réservé aux responsables légaux.')
    ids = db.scalars(select(GuardianLink.child_id).where(GuardianLink.household_id == hid, GuardianLink.guardian_id == user.id)).all()
    result = []
    for uid in ids:
        child_member = db.get(Membership, (hid, uid))
        if not child_member or child_member.role != 'child':
            continue
        child = db.get(User, uid)
        profile = db.get(LearningProfile, uid)
        # Minimized summary: no conversations, personal settings, or adult profiles.
        result.append({'id': uid, 'name': child.name, 'level': profile.level, 'minutes': 30 if child.age < 10 else 45, 'topic': 'Nature' if child.age < 10 else 'Sciences', 'simulated': True})
    return result

@app.post('/households/{hid}/goals', status_code=201)
def add_goal(hid: str, body: NewGoal, user: Principal, db: DB):
    membership(db, user, hid)
    goals = db.scalars(select(Goal.id).where(Goal.household_id == hid, Goal.user_id == user.id)).all()
    if len(goals) >= 30:
        raise HTTPException(409, 'Limite de 30 objectifs atteinte pour cette démonstration.')
    goal = Goal(id=str(uuid4()), household_id=hid, user_id=user.id, title=body.title, done=False)
    db.add(goal)
    db.commit()
    return goal_json(goal)

@app.patch('/households/{hid}/goals/{gid}')
def update_goal(hid: str, gid: str, body: GoalUpdate, user: Principal, db: DB):
    membership(db, user, hid)
    goal = db.scalar(select(Goal).where(Goal.id == gid, Goal.household_id == hid, Goal.user_id == user.id))
    if not goal:
        raise HTTPException(404, 'Objectif introuvable.')
    goal.done = body.done
    db.commit()
    return goal_json(goal)


class NewEntry(StrictModel):
    kind: Literal['book', 'grade', 'homework']
    title: str = Field(min_length=1, max_length=120)
    subject: str = Field(max_length=60, default='')
    details: str = Field(max_length=2000, default='')

class LiveUpdate(StrictModel):
    live_allowed: bool

def entry_json(entry):
    return {key: getattr(entry, key) for key in ('id', 'kind', 'title', 'subject', 'details', 'created_at')}

@app.get('/households/{hid}/notebook')
def notebook(hid: str, user: Principal, db: DB):
    membership(db, user, hid)
    entries = db.scalars(select(NotebookEntry).where(NotebookEntry.household_id == hid, NotebookEntry.user_id == user.id).order_by(NotebookEntry.created_at.desc(), NotebookEntry.id)).all()
    return [entry_json(entry) for entry in entries]

@app.post('/households/{hid}/notebook', status_code=201)
def add_entry(hid: str, body: NewEntry, user: Principal, db: DB):
    membership(db, user, hid)
    count = len(db.scalars(select(NotebookEntry.id).where(NotebookEntry.household_id == hid, NotebookEntry.user_id == user.id)).all())
    if count >= 100:
        raise HTTPException(409, 'Limite de 100 fiches pour cette démonstration.')
    entry = NotebookEntry(id=str(uuid4()), household_id=hid, user_id=user.id, created_at=int(time.time()), **body.model_dump())
    db.add(entry)
    db.commit()
    return entry_json(entry)

@app.delete('/households/{hid}/notebook/{eid}', status_code=204)
def remove_entry(hid: str, eid: str, user: Principal, db: DB):
    membership(db, user, hid)
    entry = db.scalar(select(NotebookEntry).where(NotebookEntry.id == eid, NotebookEntry.household_id == hid, NotebookEntry.user_id == user.id))
    if not entry:
        raise HTTPException(404, 'Fiche introuvable.')
    db.delete(entry)
    db.commit()
    return Response(status_code=204)

@app.get('/households/{hid}/live-settings')
def live_settings(hid: str, user: Principal, db: DB):
    member = membership(db, user, hid)
    settings = db.get(HouseholdSettings, hid)
    # No video provider/session creation exists. This flag cannot activate video.
    return {'live_allowed': bool(settings and settings.live_allowed), 'can_manage': member.role == 'guardian', 'provider_ready': False, 'available': False, 'reason': 'Le service vidéo n’est pas encore connecté. Une connexion Wi-Fi vérifiée sera également nécessaire.'}

@app.patch('/households/{hid}/live-settings')
def update_live_settings(hid: str, body: LiveUpdate, user: Principal, db: DB):
    if membership(db, user, hid).role != 'guardian':
        raise HTTPException(403, 'Seul un responsable légal peut modifier cette autorisation.')
    settings = db.get(HouseholdSettings, hid)
    if not settings:
        settings = HouseholdSettings(household_id=hid)
        db.add(settings)
    settings.live_allowed = body.live_allowed
    db.commit()
    return live_settings(hid, user, db)

from .family import router as family_router
app.include_router(family_router)
from .ai import router as ai_router
app.include_router(ai_router)
