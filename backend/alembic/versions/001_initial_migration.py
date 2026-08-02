"""initial migration

Revision ID: 001
Revises: 
Create Date: 2026-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Создаем ENUM типы с помощью SQLAlchemy с проверкой на существование
    userrole = ENUM('user', 'admin', name='userrole', create_type=False)
    placeblock = ENUM('A', 'B', 'C', name='placeblock', create_type=False)
    
    # Проверяем существование типов и создаем если их нет
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                CREATE TYPE userrole AS ENUM ('user', 'admin');
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'placeblock') THEN
                CREATE TYPE placeblock AS ENUM ('A', 'B', 'C');
            END IF;
        END $$;
    """)
    
    # Users table - используем create_type=False чтобы не создавать тип повторно
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('has_access', sa.Boolean(), nullable=True),
        sa.Column('role', ENUM('user', 'admin', name='userrole', create_type=False), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id')
    )
    op.create_index('ix_users_employee_id', 'users', ['employee_id'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    
    # KS Places table
    op.create_table(
        'ks_places',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('place_number', sa.Integer(), nullable=False),
        sa.Column('block', ENUM('A', 'B', 'C', name='placeblock', create_type=False), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('place_number')
    )
    op.create_index('ix_ks_places_id', 'ks_places', ['id'], unique=False)
    op.create_index('ix_ks_places_place_number', 'ks_places', ['place_number'], unique=True)
    
    # Insert KS places
    for i in range(1, 21):
        op.execute(f"INSERT INTO ks_places (place_number, block) VALUES ({i}, 'A')")
    for i in range(21, 41):
        op.execute(f"INSERT INTO ks_places (place_number, block) VALUES ({i}, 'B')")
    for i in range(41, 61):
        op.execute(f"INSERT INTO ks_places (place_number, block) VALUES ({i}, 'C')")
    
    # Bookings table
    op.create_table(
        'bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=False),
        sa.Column('booking_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['place_id'], ['ks_places.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'booking_date', name='unique_user_booking_per_day')
    )
    op.create_index('ix_bookings_id', 'bookings', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('bookings')
    op.drop_table('ks_places')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS placeblock")
    op.execute("DROP TYPE IF EXISTS userrole")