"""Durable AI reservations and household opt-in."""
from alembic import op
import sqlalchemy as sa
revision = 'e19a1'
down_revision = 'd832f1'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('ai_settings',
        sa.Column('household_id', sa.String(), sa.ForeignKey('households.id'), primary_key=True),
        sa.Column('enabled', sa.Boolean(), nullable=False))
    op.create_table('ai_requests',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('household_id', sa.String(), sa.ForeignKey('households.id'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        *[sa.Column(name, sa.String(), nullable=False) for name in ('fingerprint', 'month', 'cost_usd', 'state', 'answer')],
        sa.Column('reserved_cents', sa.Integer(), nullable=False))
    op.create_index('ix_ai_requests_household_id', 'ai_requests', ['household_id'])

def downgrade():
    op.drop_table('ai_requests')
    op.drop_table('ai_settings')
