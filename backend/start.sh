#!/bin/bash
set -e

echo "=========================================="
echo "  The Essence - Starting up..."
echo "=========================================="

# Run database migrations
echo ">> Running database migrations..."
alembic upgrade head

# Seed roles and create admin user if not exists
echo ">> Bootstrapping database (roles + admin)..."
python bootstrap_db.py

echo ">> Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
