"""add booking status fields

Revision ID: 004
Revises: 003
Create Date: 2026-08-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонки в bookings
    op.add_column('bookings', sa.Column('status', sa.String(), nullable=True, server_default='active'))
    op.add_column('bookings', sa.Column('cancelled_by', sa.Integer(), nullable=True))
    op.add_column('bookings', sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True))
    
    # Добавляем foreign key
    op.create_foreign_key('fk_bookings_cancelled_by', 'bookings', 'users', ['cancelled_by'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_bookings_cancelled_by', 'bookings', type_='foreignkey')
    op.drop_column('bookings', 'cancelled_at')
    op.drop_column('bookings', 'cancelled_by')
    op.drop_column('bookings', 'status')