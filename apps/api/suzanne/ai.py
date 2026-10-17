"""Opt-in OpenRouter pilot. No tools, document context, retries or model fallback."""
import hashlib
import hmac
import os
from datetime import datetime
from decimal import Decimal, ROUND_CEILING
from uuid import UUID
from zoneinfo import ZoneInfo

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import Field
from sqlalchemy import select, func, update
from .main import DB, Principal, StrictModel, membership
from .family import guardian
from .models import AIRequest, AISettings, FamilyBudget, Household
from .ai_contracts import CHAT_URL, chat_request

router = APIRouter(prefix='/households/{hid}/ai')
# Conservative provisioning factor, NOT a currency quote or a tax calculation.
EUR_PER_USD = Decimal('1.50')

def configuration():
    key = os.getenv('OPENROUTER_API_KEY', '').strip()
    model = os.getenv('OPENROUTER_MODEL', '').strip()
    provider = os.getenv('OPENROUTER_PROVIDER', '').strip()
    account_cap = os.getenv('OPENROUTER_ACCOUNT_CAP_CONFIRMED') == 'true'
    # Explicit local-development opt-in. Does not claim a provider cap exists,
    # and never bypasses household permission, reservation or monthly budget.
    local_cap_only = (os.getenv('APP_ENV', 'local') == 'local'
                      and os.getenv('OPENROUTER_ALLOW_LOCAL_CAP_ONLY') == 'true')
    ready = bool(key and model and provider and os.getenv('OPENROUTER_ENABLED') == 'true'
                 and (account_cap or local_cap_only))
    return key, model, provider, ready

def month():
    return datetime.now(ZoneInfo('Europe/Paris')).strftime('%Y-%m')

def provisioned(db, hid):
    return db.scalar(select(func.coalesce(func.sum(AIRequest.reserved_cents), 0)).where(
        AIRequest.household_id == hid, AIRequest.month == month()))

def unresolved(db, hid):
    # Includes previous months: an ambiguous charge must never silently reset.
    return db.scalar(select(AIRequest.id).where(AIRequest.household_id == hid,
        AIRequest.state != 'completed').limit(1)) is not None

def status(db, hid):
    settings, budget = db.get(AISettings, hid), db.get(FamilyBudget, hid)
    _, model, _, ready = configuration()
    enabled = bool(settings and settings.enabled)
    cap = budget.monthly_cap_cents if budget else 0
    used, blocked = provisioned(db, hid), unresolved(db, hid)
    reason = ('Le branchement OpenRouter attend sa configuration serveur.' if not ready else
              'Un responsable doit autoriser le dialogue dans Famille → Budget & vidéo.' if not enabled else
              'Une demande est en cours ou son coût doit être vérifié.' if blocked else
              'Le plafond mensuel est atteint ou reste à définir.' if cap <= used else '')
    return dict(provider_ready=ready, enabled=enabled, available=not reason, reason=reason,
                model=model if ready else None, monthly_cap_cents=cap, reserved_cents=used,
                month=month())

@router.get('')
def get_status(hid: str, user: Principal, db: DB):
    membership(db, user, hid)
    return status(db, hid)

class Permission(StrictModel):
    enabled: bool = Field(strict=True)

@router.patch('')
def permission(hid: str, body: Permission, user: Principal, db: DB):
    guardian(db, user, hid)
    db.execute(update(Household).where(Household.id == hid).values(name=Household.name))
    if body.enabled and not configuration()[3]:
        raise HTTPException(409, 'Configure d’abord le fournisseur et le mode de budget côté serveur.')
    settings = db.get(AISettings, hid)
    if not settings:
        settings = AISettings(household_id=hid)
        db.add(settings)
    settings.enabled = body.enabled
    db.commit()
    return status(db, hid)

class Question(StrictModel):
    id: UUID
    text: str = Field(min_length=1, max_length=4000)

def request_payload(text, age, model, provider):
    payload = chat_request(text, model=model, allowed_models=(model,), max_prompt_price=0.5, max_completion_price=2)
    band = '5 à 11 ans' if age < 12 else '12 à 17 ans' if age < 18 else 'adulte'
    payload['messages'][0]['content'] += f' Adapte le vocabulaire au public {band}. Pose une question à la fois. Ne demande pas de données personnelles. Ne prétends pas être humaine.'
    payload['provider']['only'] = [provider]
    payload['provider']['max_price']['request'] = 0
    payload['stream'] = False
    # UTF-8 bytes are a conservative text-token bound, plus framing allowance.
    tokens = sum(len(m['content'].encode('utf-8')) for m in payload['messages']) + 1024
    usd = (Decimal(tokens) * Decimal('0.5') + Decimal(600 * 2)) / 1_000_000
    reserve = max(1, int((usd * EUR_PER_USD * 100).to_integral_value(rounding=ROUND_CEILING)))
    return payload, reserve

def send_provider(key, payload):
    # Fixed HTTPS endpoint, no redirect forwarding credentials, no retry.
    with httpx.Client(timeout=httpx.Timeout(30, connect=5), follow_redirects=False) as client:
        response = client.post(CHAT_URL, headers={'Authorization': f'Bearer {key}'}, json=payload)
        response.raise_for_status()
        return response.json()

@router.post('/questions')
def ask(hid: str, body: Question, user: Principal, db: DB):
    membership(db, user, hid)
    key, model, provider, ready = configuration()
    if not ready:
        raise HTTPException(503, 'Le dialogue IA n’est pas encore activé côté serveur.')
    # Serialize admission across processes on both SQLite and PostgreSQL.
    db.execute(update(Household).where(Household.id == hid).values(name=Household.name))
    fingerprint = hmac.new(key.encode(), body.text.encode(), hashlib.sha256).hexdigest()
    existing = db.get(AIRequest, str(body.id))
    if existing:
        if (existing.household_id, existing.user_id, existing.fingerprint) != (hid, user.id, fingerprint):
            raise HTTPException(409, 'Identifiant de demande déjà utilisé.')
        if existing.state != 'completed':
            raise HTTPException(409, 'Cette demande attend une vérification. Elle ne sera pas refacturée.')
        return {'id': existing.id, 'answer': existing.answer, 'status': status(db, hid)}
    current = status(db, hid)
    if not current['available']:
        raise HTTPException(409, current['reason'])
    payload, reserve = request_payload(body.text, user.age, model, provider)
    if current['reserved_cents'] + reserve > current['monthly_cap_cents']:
        raise HTTPException(409, 'Le budget restant ne suffit pas pour cette question.')
    record = AIRequest(id=str(body.id), household_id=hid, user_id=user.id, fingerprint=fingerprint,
                       month=month(), reserved_cents=reserve, cost_usd='', state='pending', answer='')
    db.add(record)
    db.commit()  # Durable reservation BEFORE any external side effect.
    try:
        result = send_provider(key, payload)
        answer = result['choices'][0]['message']['content']
        cost = result['usage']['cost']
        if not isinstance(answer, str) or not answer.strip() or len(answer) > 16000 or type(cost) not in (int, float):
            raise ValueError('Invalid provider response')
        cost = Decimal(str(cost))
        if not cost.is_finite() or cost < 0:
            raise ValueError('Invalid provider cost')
        record.cost_usd = str(cost)
        actual = int((cost * EUR_PER_USD * 100).to_integral_value(rounding=ROUND_CEILING))
        if actual > reserve:
            record.reserved_cents = actual
            raise ValueError('Provider cost exceeds reservation')
        record.answer, record.state = answer.strip(), 'completed'
        # Keep the conservative reserve, rather than claiming an exact EUR invoice.
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
        record.state = 'uncertain'
        db.commit()
        raise HTTPException(502, 'La réponse ou son coût n’a pas pu être confirmé. Le dialogue est suspendu pour éviter une nouvelle dépense.') from None
    db.commit()
    return {'id': record.id, 'answer': record.answer, 'status': status(db, hid)}
