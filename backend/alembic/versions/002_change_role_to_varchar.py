"""change role to varchar

Revision ID: 002
Revises: 001
Create Date: 2026-08-02 05:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Удаляем ограничение ENUM на колонке role
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text")
    
    # 2. Удаляем ENUM тип (после того как он больше не используется)
    op.execute("DROP TYPE userrole")


def downgrade() -> None:
    # 1. Создаем ENUM тип заново
    op.execute("CREATE TYPE userrole AS ENUM ('user', 'admin')")
    
    # 2. Меняем тип колонки обратно на ENUM
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")