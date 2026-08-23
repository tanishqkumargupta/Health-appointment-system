# MediCare Health - Healthcare Appointment Management Platform

A dynamic, production-ready healthcare appointment management platform supporting Patients, Doctors, and System Administrators. Built with Flask, SQLAlchemy, JWT Authentication, React, Vite, and OpenAI LLM integration.

## 🚀 Key Features

### 1. Patient Portal
- **Public Signup & Auth**: Secure registration & login (`role = PATIENT`).
- **Deterministic Category Mapping**:
  - Skin → Dermatology
  - Heart / Chest → Cardiology
  - Head / Brain → Neurology
  - Bones / Joints → Orthopedics
  - Eyes → Ophthalmology
  - Ear / Nose / Throat → ENT
  - Stomach / Digestion → Gastroenterology
  - General / Other → General Medicine
- **Dynamic Slot Engine & Hold**: 5-minute temporary slot hold (`hold_expires_at`) before booking confirmation.
- **Double-Booking Protection**: Prevents doctor conflicts and overlapping patient appointments across different doctors.
- **Clean Dashboard**: Prominent NEXT / UPCOMING appointment display, past appointments, prescription history, and 1-5 star feedback.

### 2. Doctor Portal
- **Date & Slot Consultation Panel**: View patient information, symptoms, and pre-visit AI triage summaries (Urgency: Low/Medium/High, chief complaint, 3 suggested doctor questions).
- **Authoritative Prescriptions**: Diagnosis entry, clinical notes, multi-medicine prescription constructor (Food instructions: Before/With/After/Without food; Frequencies: Morning 9 AM, Afternoon 2 PM, Evening 6 PM, Night 9 PM).
- **Atomic Consultation Completion**: Single DB transaction for diagnosis, clinical notes, prescription, and automatic medication reminder generation.
- **Leave & Schedule Requests**: Request leave or shift/duration changes with pending status tracking.
- **Pre-Shift Daily Summary**: Pre-shift aggregated appointment list and real-time active shift booking alerts.

### 3. Admin Portal
- **Doctor Provisioning & Management**: Create doctors, assign specializations, set overnight shift hours (e.g. 6 PM to 2 AM next day), slot duration (15/30/45/60m), and toggle active/inactive status.
- **Approval Center**: Review doctor leave and schedule change requests. Approved leave automatically cancels affected appointments and notifies patients.
- **System Metrics**: Overview of total doctors, active doctors, today's appointments, and pending requests.

### 4. Background Services & Resilience
- **Background Scheduler (APScheduler)**: 24h & 2h appointment reminders, medication reminders, email retries, and slot hold cleanup.
- **Non-Blocking External Services**: LLM failure or Google Calendar API failure falls back gracefully without breaking core booking or consultation transactions.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, JavaScript, React Router, Custom CSS Design System
- **Backend**: Python 3.11, Flask, REST API, SQLAlchemy ORM, Flask-JWT-Extended, bcrypt
- **Database**: PostgreSQL (Production) / SQLite (Local Development)
- **Deployment**: Vercel (Frontend), Render (Backend)

---

## 📁 Project Structure

```
Health appointment system/
├── backend/
│   ├── app.py                 # Flask App Factory & Database Seeding
│   ├── config.py              # Environment Configuration
│   ├── extensions.py          # SQLAlchemy, JWT, CORS
│   ├── requirements.txt       # Backend Dependencies
│   ├── models/                # Relational Models (User, Doctor, Appointment, Consultation, etc.)
│   ├── routes/                # REST API Endpoints (auth, patient, doctor, admin, appointment)
│   ├── services/              # Business Logic & Core Algorithms (slot_service, booking_service, etc.)
│   ├── tasks/                 # APScheduler Background Workers
│   └── tests/                 # Pytest Test Suite
├── frontend/
│   ├── package.json           # Frontend Dependencies
│   ├── vite.config.js         # Vite Configuration
│   └── src/
│       ├── components/        # UI Components (Header)
│       ├── layouts/           # Role Layouts (PatientLayout, DoctorLayout, AdminLayout)
│       ├── pages/             # Page Views (Dashboard, Book, Consultations, Admin, Auth)
│       ├── services/          # Fetch API Service
│       └── context/           # AuthContext Provider
├── README.md
└── .env.example
```

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs on `http://localhost:5000`.

### 2. Default Seed Credentials
- **Admin**: `admin@healthapp.com` / `admin123`
- **Doctor (Dermatology)**: `dr.sharma@healthapp.com` / `doctor123`
- **Doctor (Cardiology Overnight)**: `dr.patel@healthapp.com` / `doctor123`

### 3. Run Backend Tests
```bash
.venv\Scripts\pytest backend/tests
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## ☁️ Deployment Instructions

### Deploy Backend to Render
1. Push backend code to GitHub repository.
2. Create a new Web Service on Render.
3. Set Build Command: `pip install -r backend/requirements.txt`
4. Set Start Command: `gunicorn backend.app:app`
5. Configure Environment Variables: `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY`.

### Deploy Frontend to Vercel
1. Connect GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Configure Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`.
