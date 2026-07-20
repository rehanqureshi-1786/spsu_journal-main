"""Initial schema with all tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_roles_name', 'roles', ['name'])
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role_id', sa.String(36), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role_id', 'users', ['role_id'])
    
    # Create authors table
    op.create_table(
        'authors',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('affiliation', sa.String(255), nullable=False),
        sa.Column('orcid', sa.String(19), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_authors_user_id', 'authors', ['user_id'])
    
    # Create reviewers table
    op.create_table(
        'reviewers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('expertise', sa.JSON(), nullable=True),
        sa.Column('affiliation', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_reviewers_user_id', 'reviewers', ['user_id'])
    
    # Create papers table
    op.create_table(
        'papers',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('author_id', sa.String(36), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('abstract', sa.Text(), nullable=False),
        sa.Column('keywords', sa.JSON(), nullable=True),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('anonymized_filename', sa.String(255), nullable=False),
        sa.Column('file_hash', sa.String(64), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['authors.id']),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_papers_author_id', 'papers', ['author_id'])
    op.create_index('ix_papers_status', 'papers', ['status'])
    op.create_index('ix_papers_submitted_at', 'papers', ['submitted_at'])
    
    # Create paper_versions table
    op.create_table(
        'paper_versions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('paper_id', sa.String(36), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_hash', sa.String(64), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('paper_id', 'version_number', name='unique_paper_version'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_paper_versions_paper_id', 'paper_versions', ['paper_id'])
    
    # Create paper_status_history table
    op.create_table(
        'paper_status_history',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('paper_id', sa.String(36), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('changed_by', sa.String(36), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_paper_status_history_paper_id', 'paper_status_history', ['paper_id'])
    op.create_index('ix_paper_status_history_changed_at', 'paper_status_history', ['changed_at'])
    
    # Create review_assignments table
    op.create_table(
        'review_assignments',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('paper_id', sa.String(36), nullable=False),
        sa.Column('reviewer_id', sa.String(36), nullable=False),
        sa.Column('assigned_by', sa.String(36), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['reviewers.id']),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('paper_id', 'reviewer_id', name='unique_paper_reviewer'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_review_assignments_paper_id', 'review_assignments', ['paper_id'])
    op.create_index('ix_review_assignments_reviewer_id', 'review_assignments', ['reviewer_id'])
    op.create_index('ix_review_assignments_status', 'review_assignments', ['status'])
    
    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('assignment_id', sa.String(36), nullable=False),
        sa.Column('recommendation', sa.String(50), nullable=False),
        sa.Column('comments_for_author', sa.Text(), nullable=True),
        sa.Column('comments_for_editor', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('review_file', sa.String(255), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['review_assignments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assignment_id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_reviews_assignment_id', 'reviews', ['assignment_id'])
    
    # Create volumes table
    op.create_table(
        'volumes',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('volume_number', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('volume_number', 'year', name='unique_volume_year'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_volumes_year', 'volumes', ['year'])
    
    # Create issues table
    op.create_table(
        'issues',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('volume_id', sa.String(36), nullable=False),
        sa.Column('issue_number', sa.Integer(), nullable=False),
        sa.Column('publication_date', sa.Date(), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['volume_id'], ['volumes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('volume_id', 'issue_number', name='unique_volume_issue'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_issues_volume_id', 'issues', ['volume_id'])
    op.create_index('ix_issues_publication_date', 'issues', ['publication_date'])
    
    # Create publications table
    op.create_table(
        'publications',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('paper_id', sa.String(36), nullable=False),
        sa.Column('issue_id', sa.String(36), nullable=False),
        sa.Column('page_start', sa.Integer(), nullable=True),
        sa.Column('page_end', sa.Integer(), nullable=True),
        sa.Column('doi', sa.String(255), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id']),
        sa.ForeignKeyConstraint(['issue_id'], ['issues.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('paper_id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_publications_paper_id', 'publications', ['paper_id'])
    op.create_index('ix_publications_issue_id', 'publications', ['issue_id'])
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.String(36), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4'
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_resource_type', 'audit_logs', ['resource_type'])
    op.create_index('ix_audit_logs_resource_id', 'audit_logs', ['resource_id'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    # Drop tables in reverse order to respect foreign key constraints
    op.drop_table('audit_logs')
    op.drop_table('publications')
    op.drop_table('issues')
    op.drop_table('volumes')
    op.drop_table('reviews')
    op.drop_table('review_assignments')
    op.drop_table('paper_status_history')
    op.drop_table('paper_versions')
    op.drop_table('papers')
    op.drop_table('reviewers')
    op.drop_table('authors')
    op.drop_table('users')
    op.drop_table('roles')
