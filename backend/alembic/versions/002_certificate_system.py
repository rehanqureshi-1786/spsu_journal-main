"""Add certificate generation system tables

Revision ID: 002_certificate_system
Revises: 001_initial_schema
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_certificate_system'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create events table
    op.create_table(
        'events',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_events_event_date', 'events', ['event_date'])
    
    # Create certificates table
    op.create_table(
        'certificates',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('certificate_id', sa.String(32), nullable=False),
        sa.Column('certificate_type', sa.String(20), nullable=False),
        sa.Column('recipient_id', sa.String(36), nullable=False),
        sa.Column('recipient_name', sa.String(255), nullable=False),
        sa.Column('issued_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('subscription_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('event_id', sa.String(36), nullable=True),
        sa.Column('event_name', sa.String(255), nullable=True),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('role', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.Column('download_count', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['event_id'], ['events.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('certificate_id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_certificates_certificate_id', 'certificates', ['certificate_id'], unique=True)
    op.create_index('idx_recipient_id', 'certificates', ['recipient_id'])
    op.create_index('idx_event_id', 'certificates', ['event_id'])
    
    # Create certificate_audit_logs table
    op.create_table(
        'certificate_audit_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('certificate_id', sa.String(32), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['certificate_id'], ['certificates.certificate_id']),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('idx_certificate_id', 'certificate_audit_logs', ['certificate_id'])
    op.create_index('idx_timestamp', 'certificate_audit_logs', ['timestamp'])


def downgrade() -> None:
    # Drop tables in reverse order to respect foreign key constraints
    op.drop_table('certificate_audit_logs')
    op.drop_table('certificates')
    op.drop_table('events')
