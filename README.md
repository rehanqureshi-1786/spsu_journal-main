# 📚 The Essence — SPSU Academic Journal Management System

A full-stack academic journal management platform built for **Sir Padampat Singhania University (SPSU), Udaipur**. The system handles the complete manuscript lifecycle — from author submission through blind peer review to final publication — with role-based dashboards for admins, reviewers, and authors.

**Live:** [http://ec2-100-49-35-251.compute-1.amazonaws.com](http://ec2-100-49-35-251.compute-1.amazonaws.com)

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with HttpOnly cookies (access + refresh tokens)
- Role-based access control: **Admin**, **Reviewer**, **Author**, **Public**
- Secure password hashing with Bcrypt
- Session timeout handling with auto-redirect
- Token refresh with automatic retry on 401

### 📝 Manuscript Management
- Online paper submission with PDF upload (max 10MB)
- Version tracking for revisions
- Full status workflow: `Submitted → Initial Screening → Reviewer Assigned → Under Review → Decision Made → Published`
- Bulk paper actions and CSV export
- Paper timeline tracking with status history
- Anonymized filenames for blind review

### 🔍 Blind Peer Review
- Admin assigns reviewers to papers
- **Accept/Reject dialog** — reviewers can accept or decline assignments directly
- Double-blind review process (anonymized identities)
- Separate comments for author and editor
- Review file attachments
- Reviewer workload tracking
- **Decline notification** — admin gets notified when reviewer declines, paper auto-reverts for reassignment

### 📰 Publication Management
- Volume and issue creation (multi-volume, multi-issue)
- Paper-to-issue assignment and publishing
- Public browsable Issues & Volumes page with PDF download
- Publication date tracking

### 🏆 Certificate System
- **Reviewer Joining Certificate** — issued to reviewers with "--- as Reviewer ---" designation
- **Author Subscription Certificate** — issued to authors
- Event participation certificates
- PDF generation with SPSU branding and logo
- Public certificate verification page
- Bulk certificate issuance

### 🔔 Notification System
- Real-time notification bell on admin dashboard
- Unread count badge with auto-refresh (30s polling)
- Notification dropdown with mark-as-read
- Admin notified when reviewer declines assignment
- Role-based notifications (admin, reviewer, author)

### 📊 Admin Dashboard
- Overview statistics (papers, users, reviews)
- Recent submissions table
- Quick actions (assign reviewers, manage papers)
- Notification bell with unread count
- Manage: Papers, Reviewers, Users, Publications, Events, Certificates, Audit Logs
- Site configuration and announcements
- Homepage slideshow management

### 👤 Author Dashboard
- Submit new papers
- Track paper status and timeline
- View reviewer feedback
- Upload revisions
- Download certificates

### 🔬 Reviewer Dashboard
- View assigned papers with **Accept/Reject** buttons
- Download anonymized manuscripts
- Submit reviews with recommendation
- View review history
- Download certificates

### 🌐 Public Website (SPSU Branded)
- **Homepage** — Hero with stats, scope & subjects, how to publish process, call for papers, journal particulars footer
- **About** — Mission & vision, journal particulars, aims & scope, why publish
- **Editorial Board** — Chief Patron (Dr. Sanjay Sinha, FRSA), Advisory Board, full FCI faculty with photos
- **Author Guidelines** — Submission requirements, manuscript structure, process steps, publication ethics
- **Reviewer Guidelines** — Review criteria, process steps, ethical guidelines
- **Issues & Volumes** — Browse published papers by volume/issue with PDF download
- **Contact Us** — Editorial office, mailing address, quick help
- **Verify Certificate** — Public certificate verification by ID
- **Login / Signup** — SPSU branded split-layout with 2-step registration

### 🎨 SPSU Branding
- Navy blue (#1a5490) + Gold (#d4af37) color scheme matching SPSU identity
- Real SPSU logo on navbar, homepage, login, certificates
- Faculty photos on Editorial Board page
- Top bar with university name, ISSN, link to SPSU main site
- Consistent theme across all 30+ pages (public, admin, author, reviewer)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, CSS Modules + Inline Styles |
| **Backend** | FastAPI (Python 3.10), SQLAlchemy ORM, Alembic |
| **Database** | MySQL 8.0 (RDS or local) |
| **Auth** | JWT (access + refresh) in HttpOnly cookies |
| **PDF** | ReportLab (certificate generation) |
| **Web Server** | Nginx (reverse proxy + static files) |
| **Process Manager** | systemd |
| **Deployment** | AWS EC2 + RDS / Any Ubuntu server |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+, Node.js 18+, MySQL 8.0, Nginx

### Setup
```bash
git clone https://github.com/Aks1234-tech/spsu_journal.git
cd spsu_journal

# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your DB credentials
alembic upgrade head
python3 seed_data.py  # Optional: sample data

# Frontend
cd ../frontend
npm install
echo 'VITE_API_BASE_URL=' > .env.production
npm run build
cp public/spsu-logo.png dist/ && cp -r public/faculty dist/

# Server
sudo cp deployment/nginx.conf /etc/nginx/sites-enabled/journal
sudo cp deployment/journal-backend.service /etc/systemd/system/
sudo systemctl enable --now journal-backend
sudo systemctl reload nginx
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full deployment guide, CI/CD pipeline, and infrastructure diagrams.

---

## 👥 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@spsu.ac.in | Admin@123 |
| Author | ashwani.sharma@spsu.ac.in | Author@123 |
| Reviewer | kamal.hiran@spsu.ac.in | Reviewer@123 |

---

## 📋 API Endpoints

| Module | Endpoints | Auth |
|--------|-----------|------|
| Auth | `/auth/login`, `/auth/refresh`, `/auth/logout` | Public / Authenticated |
| Users | `/users` | Admin |
| Papers | `/papers`, `/papers/{id}/download` | Author / Admin |
| Reviews | `/reviews/assign`, `/reviews/assignments`, `/reviews/assignments/{id}/decline` | Admin / Reviewer |
| Publications | `/publications/volumes`, `/publications/issues`, `/publications/papers/{id}/download` | Public |
| Certificates | `/certificates`, `/certificates/verify/{id}` | Authenticated / Public |
| Notifications | `/notifications`, `/notifications/unread-count`, `/notifications/{id}/read` | Authenticated |
| Events | `/events` | Admin |
| Audit | `/audit/logs` | Admin |
| Statistics | `/statistics` | Admin |
| Content | `/content/pages` | Admin |

Full API docs: `http://your-server/docs` (Swagger UI)

---

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT authentication
│   │   ├── papers/         # Manuscript management
│   │   ├── reviews/        # Peer review + decline
│   │   ├── publications/   # Volumes, issues, publishing
│   │   ├── certificates/   # PDF generation
│   │   ├── audit/          # Audit logs + notifications
│   │   ├── core/           # Config, DB, security
│   │   └── main.py
│   ├── storage/            # Uploaded files
│   ├── alembic/            # DB migrations
│   ├── seed_data.py        # Sample data script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── views/public/   # 10 public pages
│   │   ├── views/admin/    # 12 admin pages
│   │   ├── views/author/   # 8 author pages
│   │   ├── views/reviewer/ # 5 reviewer pages
│   │   ├── components/     # Navbar, shared components
│   │   ├── services/       # API service layer
│   │   └── layouts/        # Dashboard layouts
│   └── public/
│       ├── spsu-logo.png
│       └── faculty/        # 24 faculty photos
├── deployment/
│   ├── nginx.conf
│   ├── journal-backend.service
│   └── README.md
├── ARCHITECTURE.md         # Deployment & CI/CD docs
├── deploy.sh               # Quick deploy script
└── README.md
```

---

## 🔒 Security

- HttpOnly + Secure cookies for JWT tokens
- Double-blind peer review (anonymized filenames & identities)
- CORS protection with configurable origins
- File type validation (PDF only, 10MB max)
- Audit logging for all critical actions
- Password hashing with Bcrypt
- Role-based access control on all endpoints
- SQL injection protection via SQLAlchemy ORM

---

## 📦 Deployment

| Environment | Infrastructure |
|-------------|---------------|
| **Current** | AWS EC2 (t3.small) + RDS MySQL |
| **On-Premise** | Any Ubuntu 22.04 server with MySQL |
| **CI/CD** | GitHub Actions → SSH deploy |

See [ARCHITECTURE.md](ARCHITECTURE.md) for:
- AWS and on-premise architecture diagrams
- GitHub Actions CI/CD pipeline
- HTTPS setup with Let's Encrypt
- Backup strategy
- Scaling guide

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed for Sir Padampat Singhania University (SPSU), Udaipur.

## 📞 Contact

**The Essence — Editorial Office**
Sir Padampat Singhania University
Bhatewar, Udaipur, Rajasthan 313601, India
🌐 [www.spsu.ac.in](https://www.spsu.ac.in)
