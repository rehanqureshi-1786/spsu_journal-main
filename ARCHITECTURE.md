# The Essence — SPSU Journal: Deployment Architecture & CI/CD

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Current AWS Infrastructure](#current-aws-infrastructure)
4. [On-Premise / Private Infrastructure](#on-premise-infrastructure)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Deployment Steps](#deployment-steps)
7. [Environment Configuration](#environment-configuration)
8. [Security Considerations](#security-considerations)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Scaling Strategy](#scaling-strategy)

---

## System Overview

**The Essence** is a full-stack journal management system with:
- **Frontend**: React 18 + Vite (SPA)
- **Backend**: FastAPI (Python 3.10) + SQLAlchemy ORM
- **Database**: MySQL 8.0
- **Web Server**: Nginx (reverse proxy + static files)
- **Process Manager**: systemd

### Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│              React SPA + Vite Build                  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│                   NGINX (Port 80/443)                │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  Static Files    │  │  Reverse Proxy           │  │
│  │  /assets/*       │  │  /auth/* → :8000         │  │
│  │  /index.html     │  │  /papers/* → :8000       │  │
│  │  /faculty/*      │  │  /reviews/* → :8000      │  │
│  │  /spsu-logo.png  │  │  /publications/* → :8000 │  │
│  └─────────────────┘  │  /notifications/* → :8000 │  │
│                        │  /certificates/* → :8000  │  │
│                        │  /storage/* → :8000       │  │
│                        └──────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │   Auth   │ │  Papers  │ │  Reviews/Certs/etc   │ │
│  │  (JWT +  │ │  (CRUD + │ │  (Assignment, PDF    │ │
│  │  Cookies)│ │  Upload) │ │   generation, etc)   │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│                    │                                  │
│              SQLAlchemy ORM                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                MySQL 8.0 Database                    │
│  22 Tables: users, papers, reviews, certificates,   │
│  publications, volumes, issues, notifications, etc   │
└─────────────────────────────────────────────────────┘
```

---

## Architecture Diagrams

### AWS Architecture (Current)

```
                        ┌──────────────┐
                        │   Internet   │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  AWS Route   │
                        │  (Public IP) │
                        │100.49.35.251 │
                        └──────┬───────┘
                               │
                    ┌──────────▼──────────┐
                    │   Security Group     │
                    │  ┌────────────────┐  │
                    │  │ Inbound Rules  │  │
                    │  │ Port 80 (HTTP) │  │
                    │  │ Port 22 (SSH)  │  │
                    │  └────────────────┘  │
                    └──────────┬──────────┘
                               │
              ┌────────────────▼────────────────┐
              │     EC2 Instance (t3.small)      │
              │     Ubuntu 22.04 LTS             │
              │                                  │
              │  ┌────────────┐ ┌─────────────┐  │
              │  │   Nginx    │ │  systemd     │  │
              │  │  (Port 80) │ │  service     │  │
              │  │            │ │              │  │
              │  │  Static +  │ │  uvicorn     │  │
              │  │  Proxy     │ │  (Port 8000) │  │
              │  └────────────┘ └─────────────┘  │
              │                                  │
              │  ┌────────────────────────────┐  │
              │  │  /opt/journal/             │  │
              │  │  ├── backend/              │  │
              │  │  │   ├── app/              │  │
              │  │  │   ├── storage/          │  │
              │  │  │   └── venv/             │  │
              │  │  ├── frontend/             │  │
              │  │  │   ├── dist/ (built)     │  │
              │  │  │   └── public/           │  │
              │  │  └── deployment/           │  │
              │  └────────────────────────────┘  │
              └────────────────┬────────────────┘
                               │ Port 3306
                               ▼
              ┌────────────────────────────────┐
              │      Amazon RDS (MySQL 8.0)     │
              │   spsu-journal-db.*.rds.        │
              │   amazonaws.com                 │
              │                                 │
              │   Database: essence_journal     │
              │   22 tables, ~100+ records      │
              └────────────────────────────────┘
```

### On-Premise / Private Infrastructure

```
                        ┌──────────────┐
                        │   Internet   │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   Firewall   │
                        │  / Router    │
                        └──────┬───────┘
                               │
                    ┌──────────▼──────────┐
                    │  Load Balancer      │
                    │  (Optional: HAProxy │
                    │   or Nginx LB)      │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  App Server  │    │  App Server  │    │  DB Server   │
    │  (Primary)   │    │  (Optional)  │    │              │
    │              │    │              │    │  MySQL 8.0   │
    │  Nginx       │    │  Nginx       │    │  (Master)    │
    │  + FastAPI   │    │  + FastAPI   │    │              │
    │  + Frontend  │    │  + Frontend  │    │  ┌────────┐  │
    │              │    │              │    │  │Replica │  │
    │  /opt/journal│    │  /opt/journal│    │  │(Optional│  │
    └─────────────┘    └─────────────┘    │  └────────┘  │
                                           └─────────────┘

    Minimum Setup (Single Server):
    ┌─────────────────────────────────────┐
    │  Single Server (4GB RAM, 2 vCPU)    │
    │                                     │
    │  ┌─────────┐  ┌─────────┐          │
    │  │  Nginx   │  │ FastAPI │          │
    │  │ (Port 80)│  │ (:8000) │          │
    │  └─────────┘  └─────────┘          │
    │                                     │
    │  ┌─────────────────────────────┐    │
    │  │  MySQL 8.0 (localhost:3306) │    │
    │  └─────────────────────────────┘    │
    └─────────────────────────────────────┘
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Developer│    │  GitHub   │    │  GitHub   │    │   EC2    │
│  Push     │───▶│  Repo     │───▶│  Actions  │───▶│  Server  │
│  to main  │    │  main     │    │  CI/CD    │    │  Deploy  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                            │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  LINT   │  │  TEST   │  │  BUILD  │  │   DEPLOY     │  │
│  │         │  │         │  │         │  │              │  │
│  │ ESLint  │─▶│ pytest  │─▶│ npm run │─▶│ SSH + rsync  │  │
│  │ Python  │  │ vitest  │  │ build   │  │ restart svc  │  │
│  │ checks  │  │         │  │         │  │              │  │
│  └─────────┘  └─────────┘  └─────────┘  └──────────────┘  │
│                                                             │
│  Trigger: Push to main branch                               │
│  Environment: Ubuntu 22.04 runner                           │
└─────────────────────────────────────────────────────────────┘
```

### GitHub Actions File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Frontend Build
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install & Build Frontend
        working-directory: frontend
        run: |
          npm ci
          echo 'VITE_API_BASE_URL=' > .env.production
          npm run build

      # Deploy to EC2
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /opt/journal
            git pull origin main
            
            # Backend
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt -q
            alembic upgrade head
            
            # Frontend
            cd ../frontend
            npm ci
            echo 'VITE_API_BASE_URL=' > .env.production
            npm run build
            cp public/spsu-logo.png dist/
            cp -r public/faculty dist/
            
            # Restart
            sudo systemctl restart journal-backend
            
            echo "✅ Deployed $(date)"
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | EC2 public IP or domain |
| `EC2_SSH_KEY` | Private SSH key (PEM content) |

---

## Deployment Steps

### Fresh Deployment (Any Server)

```bash
# 1. System Setup
sudo apt update && sudo apt install -y python3.10 python3.10-venv python3-pip nodejs npm nginx mysql-server

# 2. Clone Repository
sudo mkdir -p /opt/journal && sudo chown $USER:$USER /opt/journal
git clone https://github.com/Aks1234-tech/spsu_journal.git /opt/journal
cd /opt/journal

# 3. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Configure Environment
cp .env.example .env
# Edit .env:
#   DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/essence_journal
#   SECRET_KEY=$(openssl rand -hex 32)
#   CORS_ORIGINS=["https://yourdomain.com"]

# 5. Database Setup
mysql -u root -p -e "CREATE DATABASE essence_journal CHARACTER SET utf8mb4;"
alembic upgrade head
python3 seed_data.py  # Optional: sample data

# 6. Frontend Build
cd ../frontend
npm install
echo 'VITE_API_BASE_URL=' > .env.production
npm run build
cp public/spsu-logo.png dist/
cp -r public/faculty dist/

# 7. Nginx Configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-enabled/journal
sudo rm -f /etc/nginx/sites-enabled/default
# Edit server_name in nginx.conf if using domain
sudo nginx -t && sudo systemctl reload nginx

# 8. Backend Service
sudo cp deployment/journal-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable journal-backend
sudo systemctl start journal-backend

# 9. Verify
curl http://localhost/health
```

### Quick Deploy (Existing Server)

```bash
cd /opt/journal
./deploy.sh
```

**deploy.sh** (already in repo):
```bash
#!/bin/bash
set -e
cd /opt/journal
git pull origin main

cd backend
source venv/bin/activate
pip install -r requirements.txt -q
alembic upgrade head

cd ../frontend
npm install
VITE_API_BASE_URL="" npm run build
cp public/spsu-logo.png dist/
cp -r public/faculty dist/

sudo systemctl restart journal-backend
echo "✅ Deploy complete!"
```

---

## Environment Configuration

### Backend (.env)

| Variable | Production | Development |
|----------|-----------|-------------|
| `DATABASE_URL` | `mysql+pymysql://user:pass@rds-host:3306/essence_journal` | `mysql+pymysql://root:123456@localhost:3306/essence_journal` |
| `SECRET_KEY` | Random 64-char hex | Any string |
| `ALGORITHM` | `HS256` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | `7` |
| `CORS_ORIGINS` | `["https://yourdomain.com"]` | `["http://localhost:3000"]` |
| `DEBUG` | `False` | `True` |

### Frontend (.env.production)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `` (empty) | Uses relative URLs through Nginx proxy |

### Cookie Security

| Setting | HTTP (current) | HTTPS (production) |
|---------|---------------|-------------------|
| `secure` | `False` | `True` |
| `samesite` | `lax` | `lax` |
| `httponly` | `True` | `True` |

> ⚠️ **Important**: Change `secure=False` to `secure=True` in `backend/app/auth/router.py` when deploying with HTTPS.

---

## Security Considerations

### For Production Deployment

```
┌─────────────────────────────────────────────────┐
│              SECURITY CHECKLIST                  │
│                                                  │
│  ☐ Enable HTTPS (Let's Encrypt / SSL cert)      │
│  ☐ Set secure=True for cookies                  │
│  ☐ Generate strong SECRET_KEY                   │
│  ☐ Restrict CORS_ORIGINS to your domain         │
│  ☐ Set DEBUG=False                              │
│  ☐ Use strong DB password                       │
│  ☐ Restrict DB access (security group/firewall) │
│  ☐ Enable firewall (ufw allow 80,443,22)        │
│  ☐ Setup fail2ban for SSH                       │
│  ☐ Regular backups (DB + storage/)              │
│  ☐ Keep packages updated                        │
└─────────────────────────────────────────────────┘
```

### HTTPS Setup (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
# Auto-renewal: sudo certbot renew --dry-run
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend status
sudo systemctl status journal-backend

# Backend logs
sudo journalctl -u journal-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database check
mysql -u admin -p -h <db-host> -e "SELECT COUNT(*) FROM essence_journal.papers;"

# Disk usage
du -sh /opt/journal/backend/storage/
```

### Backup Strategy

```bash
# Database backup (daily cron)
mysqldump -u admin -p -h <db-host> essence_journal > backup_$(date +%Y%m%d).sql

# Storage backup
tar -czf storage_backup_$(date +%Y%m%d).tar.gz /opt/journal/backend/storage/

# Crontab entry
0 2 * * * /opt/journal/scripts/backup.sh
```

---

## Scaling Strategy

### Vertical Scaling (Simple)

```
Current:  t3.small  (2 vCPU, 2GB RAM)  → handles ~100 concurrent users
Scale to: t3.medium (2 vCPU, 4GB RAM)  → handles ~500 concurrent users
Scale to: t3.large  (2 vCPU, 8GB RAM)  → handles ~1000 concurrent users
```

### Horizontal Scaling (Advanced)

```
                    ┌──────────────┐
                    │     ALB      │
                    │ (Port 80/443)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼──────┐ ┌──▼────────┐
       │  EC2 #1    │ │  EC2 #2  │ │  EC2 #3   │
       │  Nginx +   │ │  Nginx + │ │  Nginx +  │
       │  FastAPI   │ │  FastAPI │ │  FastAPI  │
       └────────────┘ └──────────┘ └───────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │  RDS MySQL   │
                    │  (Multi-AZ)  │
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  S3 Bucket   │
                    │  (Shared     │
                    │   Storage)   │
                    └──────────────┘
```

### Minimum Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB | 50 GB |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| MySQL | 5.7+ | 8.0 |
| Python | 3.10+ | 3.10 |
| Node.js | 16+ | 18 LTS |

---

## File Structure

```
/opt/journal/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── backend/
│   ├── app/
│   │   ├── auth/               # Authentication (JWT + cookies)
│   │   ├── papers/             # Paper submission & management
│   │   ├── reviews/            # Peer review system
│   │   ├── publications/       # Issues & volumes
│   │   ├── certificates/       # PDF certificate generation
│   │   ├── audit/              # Audit logs & notifications
│   │   ├── core/               # Config, DB, security
│   │   ├── middleware/         # Error handling, file access
│   │   └── main.py            # FastAPI app entry
│   ├── storage/
│   │   ├── manuscripts/        # Uploaded papers
│   │   ├── reviews/            # Review documents
│   │   ├── published/          # Published papers (vol/issue/)
│   │   └── certificates/       # Generated certificates
│   ├── alembic/                # DB migrations
│   ├── requirements.txt
│   ├── .env                    # Environment config (not in git)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── public/         # HomePage, About, Login, etc.
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── author/         # Author dashboard pages
│   │   │   └── reviewer/       # Reviewer dashboard pages
│   │   ├── components/         # Navbar, shared components
│   │   ├── services/           # API service layer
│   │   ├── layouts/            # Admin/Author/Reviewer layouts
│   │   └── config/api.js       # Axios config
│   ├── public/
│   │   ├── spsu-logo.png
│   │   └── faculty/            # Faculty photos
│   ├── .env.production
│   └── package.json
├── deployment/
│   ├── nginx.conf              # Nginx site config
│   ├── journal-backend.service # systemd service
│   └── README.md               # Deployment guide
├── deploy.sh                   # Quick deploy script
└── README.md
```

---

## Ports & Services Summary

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Nginx | 80 | HTTP | Public |
| Nginx | 443 | HTTPS | Public (with SSL) |
| FastAPI | 8000 | HTTP | Internal only (127.0.0.1) |
| MySQL | 3306 | TCP | Internal / RDS |
| SSH | 22 | TCP | Admin only |

---

*Document generated for The Essence — SPSU Journal*
*Last updated: April 2026*
