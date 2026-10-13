from sqlalchemy import String, ForeignKey, Integer, Boolean, UniqueConstraint, CheckConstraint, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

class Household(Base):
    __tablename__ = 'households'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)

class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    password_hash: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    age: Mapped[int] = mapped_column(Integer)

class Membership(Base):
    __tablename__ = 'memberships'
    __table_args__ = (CheckConstraint("role IN ('guardian','adult','child')"),)
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    role: Mapped[str] = mapped_column(String)

class GuardianLink(Base):
    __tablename__ = 'guardian_links'
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), primary_key=True)
    guardian_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    child_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)

class LearningProfile(Base):
    __tablename__ = 'learning_profiles'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    nickname: Mapped[str] = mapped_column(String, default='Suzanne')
    level: Mapped[str] = mapped_column(String)
    interest: Mapped[str] = mapped_column(String)
    large_text: Mapped[bool] = mapped_column(Boolean, default=False)

class Session(Base):
    __tablename__ = 'sessions'
    token_hash: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    expires_at: Mapped[int] = mapped_column(Integer)

class Goal(Base):
    __tablename__ = 'goals'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    title: Mapped[str] = mapped_column(String)
    done: Mapped[bool] = mapped_column(Boolean, default=False)

class NotebookEntry(Base):
    __tablename__ = 'notebook_entries'
    __table_args__ = (CheckConstraint("kind IN ('book','grade','homework')"),)
    id: Mapped[str] = mapped_column(String, primary_key=True)
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    kind: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String(120))
    subject: Mapped[str] = mapped_column(String(60))
    details: Mapped[str] = mapped_column(String(2000))
    created_at: Mapped[int] = mapped_column(Integer)

class HouseholdSettings(Base):
    __tablename__ = 'household_settings'
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), primary_key=True)
    live_allowed: Mapped[bool] = mapped_column(Boolean, default=False)

class ProfileDetails(Base):
    __tablename__ = 'profile_details'
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    school: Mapped[str] = mapped_column(String, default='')
    school_year: Mapped[str] = mapped_column(String, default='')
    languages: Mapped[str] = mapped_column(String, default='')
    options: Mapped[str] = mapped_column(String, default='')
    learning_notes: Mapped[str] = mapped_column(String, default='')

class FamilyDocument(Base):
    __tablename__ = 'family_documents'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    title: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    subject: Mapped[str] = mapped_column(String)
    school_year: Mapped[str] = mapped_column(String)
    filename: Mapped[str] = mapped_column(String)
    media_type: Mapped[str] = mapped_column(String)
    size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[int] = mapped_column(Integer)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    content: Mapped[bytes] = mapped_column(LargeBinary, deferred=True)

class FamilyBudget(Base):
    __tablename__ = 'family_budgets'
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), primary_key=True)
    monthly_cap_cents: Mapped[int] = mapped_column(Integer, default=0)
    video_cap_cents: Mapped[int] = mapped_column(Integer, default=0)

class GameResult(Base):
    __tablename__ = 'game_results'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    kind: Mapped[str] = mapped_column(String)
    results: Mapped[str] = mapped_column(String)
    created_at: Mapped[int] = mapped_column(Integer)

class FamilyQuestion(Base):
    __tablename__ = 'family_questions'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    household_id: Mapped[str] = mapped_column(ForeignKey('households.id'), index=True)
    prompt: Mapped[str] = mapped_column(String)
    answer: Mapped[str] = mapped_column(String)
    explanation: Mapped[str] = mapped_column(String)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
