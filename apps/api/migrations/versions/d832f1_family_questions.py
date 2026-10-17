"""Original question bank per household."""
from alembic import op
import sqlalchemy as sa
revision='d832f1'
down_revision='c71a92'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('family_questions',sa.Column('id',sa.String(),primary_key=True),sa.Column('household_id',sa.String(),sa.ForeignKey('households.id'),nullable=False),sa.Column('prompt',sa.String(),nullable=False),sa.Column('answer',sa.String(),nullable=False),sa.Column('explanation',sa.String(),nullable=False),sa.Column('active',sa.Boolean(),nullable=False))
    op.create_index('ix_family_questions_household_id','family_questions',['household_id'])

def downgrade():
    op.drop_table('family_questions')
