"""fix booking unique constraint

Revision ID: 005
Revises: 004
Create Date: 2026-08-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Удаляем старое ограничение
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_user_booking_per_day;")
    
    # Создаем частичный уникальный индекс только для активных бронирований
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS unique_user_booking_per_day_active 
        ON bookings (user_id, booking_date) 
        WHERE status = 'active';
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS unique_user_booking_per_day_active;")
    op.execute("""
        ALTER TABLE bookings ADD CONSTRAINT unique_user_booking_per_day 
        UNIQUE (user_id, booking_date);
    """)