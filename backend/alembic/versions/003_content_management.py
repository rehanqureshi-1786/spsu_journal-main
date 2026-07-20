"""Add content management system tables

Revision ID: 003_content_management
Revises: 002_certificate_system
Create Date: 2026-03-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_content_management'
down_revision = '002_certificate_system'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create slideshow table
    op.create_table(
        'slideshow',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('image_url', sa.String(500), nullable=False),
        sa.Column('caption', sa.String(500), nullable=True),
        sa.Column('link', sa.String(500), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_slideshow_order', 'slideshow', ['order'])
    
    # Create page_content table
    op.create_table(
        'page_content',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('page_key', sa.String(100), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('last_updated_by', sa.String(36), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['last_updated_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('page_key'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_page_content_page_key', 'page_content', ['page_key'], unique=True)
    
    # Create site_configuration table
    op.create_table(
        'site_configuration',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('site_name', sa.String(255), nullable=False),
        sa.Column('site_tagline', sa.String(500), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('primary_color', sa.String(7), nullable=True),
        sa.Column('secondary_color', sa.String(7), nullable=True),
        sa.Column('social_links', sa.JSON(), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('footer_text', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    
    # Create announcements table
    op.create_table(
        'announcements',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('background_color', sa.String(7), nullable=True),
        sa.Column('text_color', sa.String(7), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_by', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_announcements_start_date', 'announcements', ['start_date'])
    op.create_index('ix_announcements_end_date', 'announcements', ['end_date'])


def downgrade() -> None:
    # Drop tables in reverse order to respect foreign key constraints
    op.drop_table('announcements')
    op.drop_table('site_configuration')
    op.drop_table('page_content')
    op.drop_table('slideshow')
