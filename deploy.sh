#!/bin/bash
set -e
cd /opt/journal

# Pull latest code
git pull origin main

# Backend
cd /opt/journal/backend
source venv/bin/activate
pip install -r requirements.txt -q
alembic upgrade head

# Frontend
cd /opt/journal/frontend
npm install
VITE_API_BASE_URL="" npm run build

# Restart backend
sudo systemctl restart journal-backend
echo "Deploy complete!"
