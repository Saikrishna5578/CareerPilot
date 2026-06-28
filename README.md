# 🎯 CareerPilot & Learn

> **Your intelligent career development companion** — AI-powered learning roadmaps, a live job scraper, and a drag-and-drop Kanban application tracker, all in one premium dark-themed web app.

![Tech Stack](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=flat-square&logo=fastapi)
![Database](https://img.shields.io/badge/Database-Supabase%20%28PostgreSQL%29-3ECF8E?style=flat-square&logo=supabase)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square&logo=google)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **AI Roadmap Generator** | Generates a personalised week-by-week learning curriculum using Google Gemini based on your career goal, skills, and interests |
| 💼 **Job Scraper** | Syncs live job listings from Adzuna, tags them as **New** or **Older**, and stores results in the database |
| 📋 **Kanban Board** | Drag-and-drop job application tracker across `Saved Favorites → Applied → First Round → Technical Interview → Offer Received` |
| ⭐ **Favorites** | Star any scraped job to save it to your personal favorites list; persisted to the database |
| ✏️ **Edit & Delete** | Full in-place editing and deletion for every Kanban card, synced to the database via backend REST API |
| 📄 **Resume Upload** | Upload and store your master resume in Supabase Storage |
| 🔒 **Guest Mode** | Unauthenticated users can explore the app; locked features prompt sign-up |
| 🎬 **Cinematic Onboarding** | First-time-login mission briefing animation and interactive guided tour |
| 🛡️ **Admin Panel** | System logs viewer, API hit analytics, and feature flag controls |
| 📱 **Fully Responsive** | Mobile-first design works across all screen sizes from 320px to 4K |

---

## 🏗️ Architecture

```
┌────────────────────────────┐      REST API       ┌──────────────────────────────┐
│   React 18 + Vite          │ ◄──────────────────► │   FastAPI (Python)           │
│   frontend-web/            │   http://localhost:8000│   backend/main.py            │
│                            │                       │                              │
│  • App.jsx (root state)    │                       │  • /api/roadmap/generate     │
│  • KanbanBoard.jsx         │                       │  • /api/scraper/trigger      │
│  • LearningDashboard.jsx   │                       │  • /api/applications  (CRUD) │
│  • Onboarding / Tour       │                       │  • /api/jobs                 │
│  • Admin Panel             │                       │  • /api/notifications        │
└────────────────────────────┘                       └──────────────┬───────────────┘
                                                                     │ Supabase SDK
                                                                     ▼
                                                      ┌──────────────────────────────┐
                                                      │   Supabase (PostgreSQL)      │
                                                      │                              │
                                                      │  • profiles                  │
                                                      │  • roadmaps + roadmap_items  │
                                                      │  • job_listings              │
                                                      │  • job_applications          │
                                                      │  • system_logs               │
                                                      │  • feature_flags             │
                                                      └──────────────────────────────┘
```

> **Security Note:** The frontend never writes to the database directly. All database operations go through the FastAPI backend using the service role key, which is kept server-side only.

---

## 📁 Project Structure

```
CareerPilot/
├── frontend-web/               # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx             # Root component — global state, auth, routing
│   │   ├── index.css           # Full design system + responsive media queries
│   │   ├── components/
│   │   │   ├── admin/          # Admin panel, logs viewer, feature flags
│   │   │   ├── auth/           # Login / Signup forms
│   │   │   ├── common/         # Toast, ConfirmDialog, PromptDialog
│   │   │   ├── dashboard/      # LearningDashboard, LearningAccordion
│   │   │   ├── guest/          # GuestLanding, GuestBanner
│   │   │   ├── kanban/         # KanbanBoard, JobCard, EditJobModal, ResumeUpload
│   │   │   └── onboarding/     # MissionBriefing, InteractiveTour
│   │   └── utils/
│   │       └── supabaseClient.js  # Auth-only Supabase client (no DB writes)
│   ├── public/                 # Static assets + logo
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                    # Python FastAPI server
│   ├── main.py                 # API gateway — all endpoints defined here
│   ├── scraper.py              # Adzuna job scraper (Playwright + BeautifulSoup)
│   ├── roadmap_gen.py          # Gemini AI roadmap generator
│   ├── logger.py               # Structured logging to Supabase system_logs
│   ├── requirements.txt
│   └── .env                    # ← server secrets (never commit this)
│
└── database/
    └── schema.sql              # Full Supabase schema — run this once to bootstrap DB
```

---

## 🚀 Local Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | `≥ 18.x` |
| Python | `≥ 3.11` |
| pip | latest |
| Supabase account | [supabase.com](https://supabase.com) (free tier works) |
| Google Gemini API key | [aistudio.google.com](https://aistudio.google.com) |
| Adzuna API credentials | [developer.adzuna.com](https://developer.adzuna.com) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/careerpilot.git
cd careerpilot
```

---

### Step 2 — Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the entire contents of [`database/schema.sql`](./database/schema.sql)
3. Click **Run** — this creates all 7 tables, policies, triggers, and seed data
4. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon / public` key
   - `service_role` key (keep this secret!)

---

### Step 3 — Configure Backend Environment

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Adzuna Job Scraper
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-app-key
ADZUNA_COUNTRY=gb

# Email Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

### Step 4 — Configure Frontend Environment

Create `frontend-web/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

> ⚠️ Only the **anon key** goes in the frontend `.env`. The service role key must **never** be exposed to the client.

---

### Step 5 — Start the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (for scraper)
playwright install chromium

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

API will be live at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

### Step 6 — Start the Frontend

```bash
cd frontend-web

# Install dependencies
npm install

# Start dev server
npm run dev
```

App will be live at: **http://localhost:5173**

---

## 📦 Deployment

### Frontend — Deploy to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Set **Root Directory** to `frontend-web`
4. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy** — Vercel auto-detects Vite

**Or via CLI:**
```bash
cd frontend-web
npm run build
npx vercel --prod
```

---

### Backend — Deploy to Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. Configure:
   - **Build Command:** `pip install -r requirements.txt && playwright install chromium`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all **Environment Variables** from your `backend/.env`
5. Click **Create Web Service**

**After deployment**, update your frontend's API base URL from `http://localhost:8000` to your Render URL.

> 💡 Update the hardcoded `http://localhost:8000` references in `frontend-web/src/App.jsx` and `frontend-web/src/components/kanban/KanbanBoard.jsx` to your production backend URL, or use a `VITE_API_BASE_URL` environment variable.

---

### Backend — Deploy to Railway (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up
```

---

## 🔌 API Reference

All endpoints are served by the FastAPI backend. Interactive docs available at `/docs`.

### Applications (Kanban)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications?user_id={id}` | Fetch all applications for a user |
| `POST` | `/api/applications` | Create a new job application |
| `PUT` | `/api/applications/{id}` | Update an existing application |
| `DELETE` | `/api/applications/{id}?user_id={id}` | Delete an application |

### Jobs & Scraper

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs?query={q}` | Fetch job listings filtered by keyword |
| `POST` | `/api/scraper/trigger` | Trigger live scraper and sync to DB |

### Roadmap & Profile

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/roadmap/generate` | Generate AI roadmap via Gemini |
| `POST` | `/api/profile` | Create / update user profile |

### Admin & System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/logs` | Fetch system audit logs |
| `GET` | `/api/flags` | Fetch feature flags |
| `PUT` | `/api/flags/{key}` | Toggle a feature flag |
| `GET` | `/api/analytics` | Fetch API hit analytics |

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profile — name, skills, target roles, resume URL |
| `roadmaps` | AI-generated career roadmaps (one active per user) |
| `roadmap_items` | Individual weekly curriculum items (Pending / Completed) |
| `job_listings` | Global scraper cache — all scraped jobs |
| `job_applications` | Per-user Kanban board — favorites + active pipeline |
| `system_logs` | Audit trail of all backend events |
| `feature_flags` | Admin-controlled feature toggles |
| `api_hits` | Per-endpoint request counters |

> All tables use **Row Level Security (RLS)**. Users can only access their own data. The backend uses the service role key to bypass RLS for trusted server-side operations.

---

## 🛡️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-side only) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for roadmap generation |
| `ADZUNA_APP_ID` | ✅ | Adzuna API App ID for job scraping |
| `ADZUNA_APP_KEY` | ✅ | Adzuna API App Key |
| `ADZUNA_COUNTRY` | ✅ | Country code (e.g. `gb`, `us`, `in`) |
| `SMTP_HOST` | Optional | SMTP host for email notifications |
| `SMTP_PORT` | Optional | SMTP port (default: `587`) |
| `SMTP_USER` | Optional | SMTP email address |
| `SMTP_PASS` | Optional | SMTP app password |

### Frontend (`frontend-web/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key (safe for client) |

---

## 🔒 Security Notes

- The **service role key** is only ever used server-side in the FastAPI backend. It is never shipped in the frontend bundle.
- The frontend uses the **anon key** solely for Supabase Auth (login/signup). All data operations go through the backend REST API.
- All database tables enforce **Row Level Security** — users can only read/write their own records.
- CORS is currently set to `allow_origins=["*"]` for development. Restrict this to your production frontend URL before going live.

---

## 🧰 Tech Stack

### Frontend
- [React 18](https://react.dev) — UI framework
- [Vite 5](https://vitejs.dev) — Build tool & dev server
- [Supabase JS](https://supabase.com/docs/reference/javascript) — Auth client
- Vanilla CSS — Custom design system (dark mode, glassmorphism, animations)

### Backend
- [FastAPI](https://fastapi.tiangolo.com) — REST API framework
- [Uvicorn](https://www.uvicorn.org) — ASGI server
- [Supabase Python](https://supabase.com/docs/reference/python) — Database client
- [Playwright](https://playwright.dev/python/) — Headless browser for scraping
- [BeautifulSoup4](https://beautiful-soup-4.readthedocs.io) — HTML parsing
- [Google GenAI](https://ai.google.dev) — Gemini API for AI roadmap generation
- [APScheduler](https://apscheduler.readthedocs.io) — Background job scheduling

### Infrastructure
- [Supabase](https://supabase.com) — PostgreSQL database, Auth, Storage, Realtime
- [Vercel](https://vercel.com) — Frontend hosting (recommended)
- [Render](https://render.com) / [Railway](https://railway.app) — Backend hosting (recommended)

---

## 🙏 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.
