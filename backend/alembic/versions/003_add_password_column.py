"""add password column to users

Revision ID: 003
Revises: 002
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем колонку password
    op.add_column('users', sa.Column('password', sa.String(), nullable=True))


def downgrade() -> None:
    # Удаляем колонку password
    op.drop_column('users', 'password')