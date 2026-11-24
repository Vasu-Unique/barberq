"""Initial database schema with 13 tables and seeded roles

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-11-23 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=True)

    # 2. roles
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_role_name'), 'roles', ['role_name'], unique=True)

    # Seed initial roles
    op.execute(
        sa.text(
            """
            INSERT INTO roles (id, role_name, description) VALUES
            (1, 'admin', 'Platform administrator'),
            (2, 'staff', 'Salon owner, barber, or authorized salon employee'),
            (3, 'users', 'Customers who book tokens and track queues')
            ON CONFLICT (id) DO NOTHING;
            """
        )
    )

    # 3. user_roles
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    # 4. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('event_time', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_event_time'), 'audit_logs', ['event_time'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # 5. refresh_tokens
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('replaced_by_token_id', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['replaced_by_token_id'], ['refresh_tokens.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)

    # 6. salons
    op.create_table(
        'salons',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('salon_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('opening_time', sa.Time(), nullable=False),
        sa.Column('closing_time', sa.Time(), nullable=False),
        sa.Column('max_queue_capacity', sa.Integer(), server_default='50', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_salons_city'), 'salons', ['city'], unique=False)
    op.create_index(op.f('ix_salons_owner_id'), 'salons', ['owner_id'], unique=False)
    op.create_index(op.f('ix_salons_salon_name'), 'salons', ['salon_name'], unique=False)

    # 7. salon_members
    op.create_table(
        'salon_members',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('salon_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('salon_id', 'user_id', name='uq_salon_user')
    )
    op.create_index(op.f('ix_salon_members_salon_id'), 'salon_members', ['salon_id'], unique=False)
    op.create_index(op.f('ix_salon_members_user_id'), 'salon_members', ['user_id'], unique=False)

    # 8. services
    op.create_table(
        'services',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('salon_id', sa.UUID(), nullable=False),
        sa.Column('service_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('is_available', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_services_salon_id'), 'services', ['salon_id'], unique=False)

    # 9. operating_hours
    op.create_table(
        'operating_hours',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('salon_id', sa.UUID(), nullable=False),
        sa.Column('day_of_week', sa.String(length=20), nullable=False),
        sa.Column('opening_time', sa.Time(), nullable=True),
        sa.Column('closing_time', sa.Time(), nullable=True),
        sa.Column('is_closed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('salon_id', 'day_of_week', name='uq_salon_day')
    )
    op.create_index(op.f('ix_operating_hours_salon_id'), 'operating_hours', ['salon_id'], unique=False)

    # 10. queue_sessions
    op.create_table(
        'queue_sessions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('salon_id', sa.UUID(), nullable=False),
        sa.Column('session_date', sa.Date(), nullable=False),
        sa.Column('last_token_number', sa.Integer(), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='OPEN', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('salon_id', 'session_date', name='uq_salon_session_date')
    )
    op.create_index(op.f('ix_queue_sessions_salon_id'), 'queue_sessions', ['salon_id'], unique=False)

    # 11. queue_entries
    op.create_table(
        'queue_entries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('customer_id', sa.UUID(), nullable=True),
        sa.Column('service_id', sa.UUID(), nullable=False),
        sa.Column('token_number', sa.Integer(), nullable=False),
        sa.Column('customer_name', sa.String(length=255), nullable=False),
        sa.Column('customer_phone', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='WAITING', nullable=False),
        sa.Column('estimated_duration', sa.Integer(), nullable=False),
        sa.Column('service_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('called_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['session_id'], ['queue_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'token_number', name='uq_session_token_number')
    )
    op.create_index(op.f('ix_queue_entries_customer_id'), 'queue_entries', ['customer_id'], unique=False)
    op.create_index(op.f('ix_queue_entries_service_id'), 'queue_entries', ['service_id'], unique=False)
    op.create_index(op.f('ix_queue_entries_session_id'), 'queue_entries', ['session_id'], unique=False)
    op.create_index(op.f('ix_queue_entries_status'), 'queue_entries', ['status'], unique=False)
    op.create_index(op.f('ix_queue_entries_token_number'), 'queue_entries', ['token_number'], unique=False)

    # 12. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('queue_entry_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['queue_entry_id'], ['queue_entries.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)
    op.create_index(op.f('ix_notifications_queue_entry_id'), 'notifications', ['queue_entry_id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # 13. queue_events
    op.create_table(
        'queue_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('queue_entry_id', sa.UUID(), nullable=False),
        sa.Column('actor_id', sa.UUID(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['queue_entry_id'], ['queue_entries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_queue_events_queue_entry_id'), 'queue_events', ['queue_entry_id'], unique=False)


def downgrade() -> None:
    op.drop_table('queue_events')
    op.drop_table('notifications')
    op.drop_table('queue_entries')
    op.drop_table('queue_sessions')
    op.drop_table('operating_hours')
    op.drop_table('services')
    op.drop_table('salon_members')
    op.drop_table('salons')
    op.drop_table('refresh_tokens')
    op.drop_table('audit_logs')
    op.drop_table('user_roles')
    op.drop_table('roles')
    op.drop_table('users')
