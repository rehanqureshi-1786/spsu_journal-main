#!/bin/bash
set -e

echo "=========================================="
echo "  The Essence - Starting up..."
echo "=========================================="

# Run database migrations
echo ">> Running database migrations..."
alembic upgrade head

# Create admin user if not exists
echo ">> Setting up admin user..."
python create_admin.py

echo ">> Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
