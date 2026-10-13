"""Local family management. Every object access is scoped and authorized."""
import json
import time
from uuid import uuid4, UUID
from urllib.parse import quote
from typing import Literal
from fastapi import APIRouter, HTTPException, Request, Response, Query
from pydantic import Field, model_validator
from sqlalchemy import select, func, update
from .main import DB, Principal, StrictModel, membership, own_profile
from .models import User, Membership, GuardianLink, LearningProfile, ProfileDetails, FamilyDocument, FamilyBudget, GameResult

router = APIRouter(prefix='/households/{hid}')
MAX_FILE = 10 * 1024 * 1024

def accessible_ids(db, user, hid):
    m = membership(db, user, hid)
    ids = [user.id]
    if m.role == 'guardian':
        ids += list(db.scalars(select(GuardianLink.child_id).join(Membership, (Membership.household_id == GuardianLink.household_id) & (Membership.user_id == GuardianLink.child_id)).where(GuardianLink.household_id == hid, GuardianLink.guardian_id == user.id, Membership.role == 'child')))
    return ids

def target(db, user, hid, uid):
    if uid not in accessible_ids(db, user, hid):
        raise HTTPException(404, 'Profil introuvable ou non autorisé.')
    return db.get(User, uid)

def guardian(db, user, hid):
    if membership(db, user, hid).role != 'guardian':
        raise HTTPException(403, 'Réservé aux responsables du foyer.')

def member_json(db, member, hid):
    d = db.get(ProfileDetails, member.id)
    return {**own_profile(db, member), 'role': db.get(Membership, (hid, member.id)).role,
            **{k: getattr(d, k, '') for k in ('school', 'school_year', 'languages', 'options', 'learning_notes')}}

class MemberUpdate(StrictModel):
    name: str = Field(min_length=1, max_length=60)
    age: int = Field(ge=5, le=120)
    level: str = Field(max_length=50)
    interest: str = Field(max_length=500)
    school: str = Field(max_length=160, default='')
    school_year: str = Field(max_length=20, default='')
    languages: str = Field(max_length=200, default='')
    options: str = Field(max_length=200, default='')
    learning_notes: str = Field(max_length=2000, default='')

@router.get('/members')
def members(hid: str, user: Principal, db: DB):
    return [member_json(db, db.get(User, uid), hid) for uid in accessible_ids(db, user, hid)]

@router.patch('/members/{uid}')
def edit_member(hid: str, uid: str, body: MemberUpdate, user: Principal, db: DB):
    u = target(db, user, hid, uid)
    # A minor can read their profile, but identity and school edits require their guardian.
    if membership(db, user, hid).role == 'child':
        raise HTTPException(403, 'Demande à ton responsable de modifier ce profil.')
    u.name, u.age = body.name, body.age
    p = db.get(LearningProfile, uid)
    p.level, p.interest = body.level, body.interest
    d = db.get(ProfileDetails, uid)
    if not d:
        d = ProfileDetails(user_id=uid)
        db.add(d)
    for k in ('school', 'school_year', 'languages', 'options', 'learning_notes'):
        setattr(d, k, getattr(body, k))
    db.commit()
    return member_json(db, u, hid)

def doc_json(d):
    return {k: getattr(d, k) for k in ('id', 'user_id', 'title', 'kind', 'subject', 'school_year', 'filename', 'size', 'created_at', 'deleted')}

@router.get('/documents')
def documents(hid: str, user: Principal, db: DB, trash: bool = False):
    ids = accessible_ids(db, user, hid)
    return [doc_json(d) for d in db.scalars(select(FamilyDocument).where(FamilyDocument.household_id == hid, FamilyDocument.user_id.in_(ids), FamilyDocument.deleted == trash).order_by(FamilyDocument.created_at.desc(), FamilyDocument.id))]

@router.post('/documents', status_code=201)
async def upload_document(hid: str, request: Request, user: Principal, db: DB,
                          owner: str = Query(max_length=100), title: str = Query(min_length=1, max_length=120),
                          kind: Literal['report', 'homework', 'book', 'other'] = 'report',
                          subject: str = Query(default='', max_length=60), school_year: str = Query(default='', max_length=20),
                          filename: str = Query(min_length=1, max_length=180)):
    target(db, user, hid, owner)
    if not title.strip() or any(c in filename for c in ('/', '\\', '\r', '\n', '\x00')):
        raise HTTPException(422, 'Titre ou nom de fichier invalide.')
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > MAX_FILE:
            raise HTTPException(413, 'Le fichier dépasse 10 Mo.')
        data.extend(chunk)
    formats = [(b'%PDF-', '.pdf', 'application/pdf'), (b'\x89PNG\r\n\x1a\n', '.png', 'image/png'), (b'\xff\xd8\xff', ('.jpg', '.jpeg'), 'image/jpeg')]
    media = next((mime for magic, ext, mime in formats if data.startswith(magic) and filename.lower().endswith(ext)), None)
    if not media:
        raise HTTPException(415, 'Choisis un PDF, PNG ou JPEG correspondant à son extension.')
    # Acquire a database write lock before quota admission, including on SQLite.
    from .models import Household
    db.execute(update(Household).where(Household.id == hid).values(name=Household.name))
    total = db.scalar(select(func.coalesce(func.sum(FamilyDocument.size), 0)).where(FamilyDocument.household_id == hid))
    count = db.scalar(select(func.count()).select_from(FamilyDocument).where(FamilyDocument.household_id == hid))
    if total + len(data) > 100 * 1024 * 1024 or count >= 100:
        raise HTTPException(409, 'Limite locale atteinte : 100 documents ou 100 Mo par foyer, corbeille incluse.')
    d = FamilyDocument(id=str(uuid4()), household_id=hid, user_id=owner, title=title.strip(), kind=kind, subject=subject.strip(), school_year=school_year.strip(), filename=filename, media_type=media, size=len(data), content=bytes(data), created_at=int(time.time()), deleted=False)
    db.add(d)
    db.commit()
    return doc_json(d)

def find_doc(db, user, hid, did):
    ids = accessible_ids(db, user, hid)
    d = db.scalar(select(FamilyDocument).where(FamilyDocument.id == did, FamilyDocument.household_id == hid, FamilyDocument.user_id.in_(ids)))
    if not d:
        raise HTTPException(404, 'Document introuvable.')
    return d

@router.get('/documents/{did}/file')
def download(hid: str, did: str, user: Principal, db: DB):
    d = find_doc(db, user, hid, did)
    if d.deleted:
        raise HTTPException(404, 'Ce document est dans la corbeille.')
    return Response(d.content, media_type=d.media_type, headers={'Content-Disposition': "attachment; filename*=UTF-8''" + quote(d.filename, safe=''), 'Content-Security-Policy': "sandbox; default-src 'none'"})

class DocumentState(StrictModel):
    deleted: bool

@router.patch('/documents/{did}')
def document_state(hid: str, did: str, body: DocumentState, user: Principal, db: DB):
    d = find_doc(db, user, hid, did)
    d.deleted = body.deleted
    db.commit()
    return doc_json(d)

class BudgetUpdate(StrictModel):
    monthly_cap_cents: int = Field(ge=0, le=50000, strict=True)
    video_cap_cents: int = Field(ge=0, le=50000, strict=True)
    @model_validator(mode='after')
    def video_within_total(self):
        if self.video_cap_cents > self.monthly_cap_cents:
            raise ValueError('Le sous-plafond vidéo doit rester dans le plafond total.')
        return self

@router.get('/budget')
def budget(hid: str, user: Principal, db: DB):
    guardian(db, user, hid)
    b = db.get(FamilyBudget, hid)
    return {'monthly_cap_cents': b.monthly_cap_cents if b else 0, 'video_cap_cents': b.video_cap_cents if b else 0, 'spent_cents': 0, 'provider_ready': False}

@router.patch('/budget')
def edit_budget(hid: str, body: BudgetUpdate, user: Principal, db: DB):
    guardian(db, user, hid)
    b = db.get(FamilyBudget, hid)
    if not b:
        b = FamilyBudget(household_id=hid)
        db.add(b)
    b.monthly_cap_cents, b.video_cap_cents = body.monthly_cap_cents, body.video_cap_cents
    db.commit()
    return budget(hid, user, db)

class PlayerScore(StrictModel):
    name: str = Field(min_length=1, max_length=24)
    score: int = Field(ge=0, le=40, strict=True)

class NewGame(StrictModel):
    id: UUID
    kind: Literal['capitales', 'bac', 'quiz']
    players: list[PlayerScore] = Field(min_length=1, max_length=4)
    @model_validator(mode='after')
    def scores_fit(self):
        if self.kind in ('capitales', 'quiz') and any(p.score > 5 for p in self.players):
            raise ValueError('Le maximum est de 5 points aux capitales.')
        return self

@router.get('/games')
def game_history(hid: str, user: Principal, db: DB):
    ids = accessible_ids(db, user, hid)
    rows = db.scalars(select(GameResult).where(GameResult.household_id == hid, GameResult.user_id.in_(ids)).order_by(GameResult.created_at.desc()).limit(100))
    return [{'id': r.id, 'user_id': r.user_id, 'kind': r.kind, 'players': json.loads(r.results), 'created_at': r.created_at} for r in rows]

@router.post('/games', status_code=201)
def save_game(hid: str, body: NewGame, user: Principal, db: DB):
    membership(db, user, hid)
    record = db.get(GameResult, str(body.id))
    payload = json.dumps([p.model_dump() for p in body.players], ensure_ascii=False)
    if record:
        if (record.household_id, record.user_id, record.kind, record.results) != (hid, user.id, body.kind, payload):
            raise HTTPException(409, 'Cette partie existe déjà avec un autre résultat.')
        return {'id': record.id}
    db.add(GameResult(id=str(body.id), household_id=hid, user_id=user.id, kind=body.kind, results=payload, created_at=int(time.time())))
    db.commit()
    return {'id': str(body.id)}

from .models import FamilyQuestion
class QuestionBody(StrictModel):
    prompt: str = Field(min_length=3, max_length=300)
    answer: str = Field(min_length=1, max_length=80)
    explanation: str = Field(max_length=1000, default='')
    active: bool = True

def question_json(q):
    return {k: getattr(q, k) for k in ('id','prompt','answer','explanation','active')}

@router.get('/questions')
def questions(hid: str, user: Principal, db: DB, archived: bool = False):
    m = membership(db, user, hid)
    if archived and m.role != 'guardian':
        raise HTTPException(403, 'Archives réservées aux responsables.')
    rows = db.scalars(select(FamilyQuestion).where(FamilyQuestion.household_id == hid, FamilyQuestion.active == (not archived)).order_by(FamilyQuestion.id))
    return [question_json(q) for q in rows]

@router.post('/questions', status_code=201)
def add_question(hid: str, body: QuestionBody, user: Principal, db: DB):
    guardian(db, user, hid)
    from .models import Household
    db.execute(update(Household).where(Household.id == hid).values(name=Household.name))
    if db.scalar(select(func.count()).select_from(FamilyQuestion).where(FamilyQuestion.household_id == hid)) >= 200:
        raise HTTPException(409, 'Limite de 200 questions par foyer, archives incluses.')
    q=FamilyQuestion(id=str(uuid4()),household_id=hid,**body.model_dump())
    db.add(q);db.commit()
    return question_json(q)

@router.patch('/questions/{qid}')
def edit_question(hid: str, qid: str, body: QuestionBody, user: Principal, db: DB):
    guardian(db, user, hid)
    q=db.scalar(select(FamilyQuestion).where(FamilyQuestion.id==qid,FamilyQuestion.household_id==hid))
    if not q: raise HTTPException(404,'Question introuvable.')
    for k,v in body.model_dump().items():setattr(q,k,v)
    db.commit()
    return question_json(q)
