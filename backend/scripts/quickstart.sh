#!/bin/bash
# Quick start script for The Essence Journal System

echo "=========================================="
echo "The Essence - Quick Start Setup"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠ Please edit .env with your database credentials!"
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Initialize database
echo "Initializing database with roles..."
python scripts/init_db.py

echo ""
echo "=========================================="
echo "✓ Setup complete!"
echo "=========================================="
echo ""
echo "To start the server, run:"
echo "  uvicorn app.main:app --reload"
echo ""
