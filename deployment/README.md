# Deployment Guide — The Essence (SPSU Journal)

## Prerequisites
- Ubuntu 22.04 (EC2 or any server)
- Python 3.10+
- Node.js 18+
- MySQL 8.0 (RDS or local)
- Nginx

## Quick Setup

### 1. Clone & Setup Backend
```bash
cd /opt/journal
git clone https://github.com/Aks1234-tech/spsu_journal.git .

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Edit .env with your DB credentials, SECRET_KEY, CORS_ORIGINS
```

### 2. Database
```bash
# Run migrations
alembic upgrade head
```

### 3. Frontend
```bash
cd /opt/journal/frontend
npm install

# Create .env.production with empty API URL (uses nginx proxy)
echo 'VITE_API_BASE_URL=' > .env.production
echo 'VITE_API_URL=' >> .env.production

npm run build
```

### 4. Nginx
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-enabled/journal
sudo rm -f /etc/nginx/sites-enabled/default
# Edit server_name if you have a domain
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Backend Service
```bash
sudo cp deployment/journal-backend.service /etc/systemd/system/
# Edit WorkingDirectory/User if different
sudo systemctl daemon-reload
sudo systemctl enable journal-backend
sudo systemctl start journal-backend
```

### 6. Verify
```bash
curl http://localhost/health  # Should return {"status": "healthy"}
```

## Environment Variables (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | MySQL connection string | mysql+pymysql://user:pass@host:3306/dbname |
| SECRET_KEY | JWT signing key (generate random) | openssl rand -hex 32 |
| CORS_ORIGINS | Allowed origins | ["http://yourdomain.com"] |
| REFRESH_TOKEN_EXPIRE_DAYS | Token expiry | 7 |

## For HTTPS (Production)
1. Set `secure=True` in `backend/app/auth/router.py` (all cookie settings)
2. Setup SSL with Let's Encrypt: `sudo certbot --nginx -d yourdomain.com`
3. Update CORS_ORIGINS in .env with https:// domain

## Deploy Script
```bash
./deploy.sh  # Pulls latest, installs deps, builds frontend, restarts backend
```
