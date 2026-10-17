"""Family profile details, private files, budget preferences and game history."""
from alembic import op
import sqlalchemy as sa
revision = 'c71a92'
down_revision = 'b4d0192490c2'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('profile_details', sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), primary_key=True), *[sa.Column(n, sa.String(), nullable=False) for n in ('school', 'school_year', 'languages', 'options', 'learning_notes')])
    op.create_table('family_budgets', sa.Column('household_id', sa.String(), sa.ForeignKey('households.id'), primary_key=True), sa.Column('monthly_cap_cents', sa.Integer(), nullable=False), sa.Column('video_cap_cents', sa.Integer(), nullable=False))
    op.create_table('family_documents', sa.Column('id', sa.String(), primary_key=True), sa.Column('household_id', sa.String(), sa.ForeignKey('households.id'), nullable=False), sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False), *[sa.Column(n, sa.String(), nullable=False) for n in ('title', 'kind', 'subject', 'school_year', 'filename', 'media_type')], sa.Column('size', sa.Integer(), nullable=False), sa.Column('created_at', sa.Integer(), nullable=False), sa.Column('deleted', sa.Boolean(), nullable=False), sa.Column('content', sa.LargeBinary(), nullable=False))
    op.create_table('game_results', sa.Column('id', sa.String(), primary_key=True), sa.Column('household_id', sa.String(), sa.ForeignKey('households.id'), nullable=False), sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False), sa.Column('kind', sa.String(), nullable=False), sa.Column('results', sa.String(), nullable=False), sa.Column('created_at', sa.Integer(), nullable=False))
    for table in ('family_documents', 'game_results'):
        for field in ('household_id', 'user_id'):
            op.create_index(f'ix_{table}_{field}', table, [field])

def downgrade():
    for table in ('game_results', 'family_documents', 'family_budgets', 'profile_details'):
        op.drop_table(table)
