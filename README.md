# MediCare Health - Healthcare Appointment Management Platform

A full-stack healthcare appointment management platform supporting **Patients, Doctors, and System Administrators**. Built with Flask, SQLAlchemy, JWT Authentication, React, Vite, PostgreSQL/SQLite, and integrated AI and calendar services.

# WEBSITE DEPLOYED URL

https://health-appointment-system-t93i.onrender.com

# BACKEND API

https://health-appointment-backend-a204.onrender.com

---

## Key Features

### 1. Patient Portal

- **Public Signup & Authentication**: Secure patient registration and login with role-based access.
- **Patient Profile**: Manage personal information and view appointment-related details.
- **Deterministic Category Mapping**:
  - Skin → Dermatology
  - Heart / Chest → Cardiology
  - Head / Brain → Neurology
  - Bones / Joints → Orthopedics
  - Eyes → Ophthalmology
  - Ear / Nose / Throat → ENT
  - Stomach / Digestion → Gastroenterology
  - General / Other → General Medicine
- **Doctor Selection**: Find doctors according to the selected healthcare category and specialization.
- **Dynamic Slot Engine**: Displays appointment slots based on doctor working hours and slot duration.
- **5-Minute Slot Hold**: Temporarily holds a selected slot using `hold_expires_at` before final confirmation.
- **Double-Booking Protection**: Prevents conflicting doctor appointments and overlapping patient appointments.
- **Appointment Management**: View upcoming and previous appointments and their status.
- **Pre-Visit Summary**: Displays AI-generated chief complaint, urgency, and suggested questions when available.
- **Prescription History**: Allows patients to view prescriptions associated with completed consultations.
- **Feedback**: Supports appointment feedback and 1–5 star ratings.

### 2. Doctor Portal

- **Doctor Authentication**: Secure login with doctor-specific authorization.
- **Appointment Dashboard**: View assigned appointments according to date and schedule.
- **Patient Information**: Access patient details, symptoms, and appointment information.
- **AI Pre-Visit Information**: View available urgency level, chief complaint, and suggested questions.
- **Consultation Management**: Record diagnosis and clinical notes for assigned appointments.
- **Prescription Management**: Create prescriptions containing multiple medicines and instructions.
- **Working Hours**: Configure doctor availability and appointment slot duration.
- **Leave Requests**: Submit leave requests for administrator approval.
- **Schedule Requests**: Request changes to working schedules where supported.
- **Appointment Notifications**: Receive relevant appointment-related notifications.

### 3. Admin Portal

- **Doctor Management**: Create and manage doctor accounts.
- **Specialization Assignment**: Assign doctors to medical specializations.
- **Working Hours Management**: Configure working hours and appointment slot duration.
- **Doctor Status Management**: Activate or deactivate doctor accounts.
- **Leave Approval Center**: Review and approve or reject doctor leave requests.
- **Schedule Management**: Review scheduling-related requests.
- **Appointment Management**: Monitor system appointments and doctor availability.
- **System Overview**: View important system-level information and pending requests.

### 4. Appointment & Scheduling System

- **Dynamic Slot Generation**: Slots are generated from configured doctor working hours.
- **Temporary Slot Hold**: A selected slot is held for 5 minutes before confirmation.
- **Slot Expiration**: Expired holds become available again.
- **Conflict Detection**: Prevents overlapping bookings.
- **Doctor Leave Conflict Handling**: Prevents appointments during approved doctor leave.
- **Past Slot Protection**: Prevents booking appointment slots that have already passed.
- **Appointment Confirmation**: Converts a valid held appointment into a confirmed appointment.
- **Appointment Cancellation**: Supports cancellation through the appropriate role workflow.

### 5. Consultation & Prescription System

- **Assigned Appointment Validation**: Doctors can only complete consultations for appointments assigned to them.
- **Consultation Records**: Store diagnosis and clinical notes.
- **Prescription Creation**: Associate prescriptions with consultations.
- **Prescription Items**: Support multiple medicines within a prescription.
- **Consultation Completion Protection**: Prevents the same consultation from being completed multiple times.

### 6. Background Services & Integrations

- **APScheduler**: Handles scheduled background operations.
- **Appointment Reminders**: Supports scheduled appointment reminder processing.
- **Medication Reminders**: Supports scheduled medication reminder processing.
- **Slot Hold Cleanup**: Expired appointment holds can be cleaned automatically.
- **AI Integration**: Supports generation of pre-visit summaries.
- **Calendar Integration**: Supports synchronization of appointment information with the configured calendar service.
- **Graceful External-Service Handling**: External AI or calendar failures should not prevent the core appointment workflow from operating.

---

## Technology Stack

- **Frontend**: React, Vite, JavaScript, React Router, CSS
- **Backend**: Python 3.11, Flask, REST API, SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended, bcrypt
- **Database**: PostgreSQL (Production) / SQLite (Local Development)
- **API Security**: JWT Authentication, Role-Based Authorization, CORS
- **Background Processing**: APScheduler
- **AI Integration**: OpenAI API
- **Calendar Integration**: Google Calendar API
- **Deployment**: Render
- **Production Server**: Gunicorn

---

## System Design

The application follows a layered full-stack architecture:

```text
                         ┌─────────────────────┐
                         │       PATIENT       │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   React + Vite UI   │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                              REST API / JWT
                                    │
                         ┌──────────▼──────────┐
                         │   Flask Backend     │
                         │    Application      │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
       │Authentication│     │ Appointment │      │ Role-Based  │
       │    Routes    │     │   Routes    │      │   Routes    │
       └─────────────┘      └──────┬──────┘      └─────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │     Services      │
                         │ Booking / Slots / │
                         │ Notifications / AI│
                         └─────────┬─────────┘
                                   │
                         ┌─────────▼─────────┐
                         │   SQLAlchemy ORM  │
                         └─────────┬─────────┘
                                   │
                         ┌─────────▼─────────┐
                         │     Database      │
                         │ PostgreSQL / SQLite│
                         └───────────────────┘
```

---

## Appointment Methodology

```text
Patient
   │
   ▼
Register / Login
   │
   ▼
Select Healthcare Category
   │
   ▼
Map Category to Specialization
   │
   ▼
Select Doctor
   │
   ▼
Fetch Available Slots
   │
   ▼
Select Date & Time
   │
   ▼
Check Slot Availability
   │
   ├── Unavailable ──────► Select Another Slot
   │
   ▼
Check Doctor Leave / Conflicts
   │
   ├── Conflict ─────────► Reject Booking
   │
   ▼
Hold Slot for 5 Minutes
   │
   ├── Hold Expires ─────► Release Slot
   │
   ▼
Confirm Appointment
   │
   ▼
Generate Pre-Visit Summary
   │
   ▼
Notify Patient / Doctor
   │
   ▼
Doctor Views Appointment
   │
   ▼
Consultation
   │
   ▼
Diagnosis & Clinical Notes
   │
   ▼
Prescription
   │
   ▼
Patient Views Appointment & Prescription
```

---

## Project Structure

```text
Health-appointment-system/
│
├── backend/
│   ├── app.py                 # Flask application factory and database seeding
│   ├── config.py              # Environment configuration
│   ├── extensions.py          # SQLAlchemy, JWT, CORS and migration extensions
│   ├── requirements.txt       # Backend dependencies
│   │
│   ├── models/                # Database models
│   ├── routes/                # REST API routes
│   ├── services/              # Business logic and integrations
│   ├── tasks/                 # APScheduler background tasks
│   └── tests/                 # Backend tests
│
├── frontend/
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── index.html
│   │
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── layouts/           # Patient, Doctor and Admin layouts
│       ├── pages/             # Application pages
│       ├── services/          # API service layer
│       └── context/           # Authentication context
│
├── README.md
└── .env.example
```

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tanishqkumargupta/Health-appointment-system.git
cd Health-appointment-system
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

Activate the environment on Windows:

```bash
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
python app.py
```

Backend runs on:

```text
http://localhost:5000
```

### 3. Default Seed Credentials

#### Admin

```text
Email: admin@healthapp.com
Password: admin123
```

#### Doctor - Dermatology

```text
Email: dr.sharma@healthapp.com
Password: doctor123
```

#### Doctor - Cardiology

```text
Email: dr.patel@healthapp.com
Password: doctor123
```

#### Demo Patient

```text
Email: patient@example.com
Password: patient123
```

These credentials are intended for local/demo use and should be replaced with secure credentials for production.

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Production Deployment

### Deploy Backend to Render

1. Connect the GitHub repository to Render.
2. Create a new **Web Service**.
3. Configure the backend root directory according to the repository structure.
4. Set the build command:

```bash
pip install -r backend/requirements.txt
```

5. Set the start command:

```bash
gunicorn "backend.app:create_app()"
```

6. Configure the required environment variables:

```env
DATABASE_URL=your_postgresql_database_url
JWT_SECRET_KEY=your_secret_key
OPENAI_API_KEY=your_openai_api_key
```

7. Deploy the backend.

### Deploy Frontend

1. Connect the GitHub repository to Render.
2. Set the root directory to:

```text
frontend
```

3. Set the build command:

```bash
npm install && npm run build
```

4. Set the output directory:

```text
dist
```

5. Configure the frontend environment variable:

```env
VITE_API_URL=https://health-appointment-backend-a204.onrender.com/api
```

6. Deploy the frontend.

---

## Environment Variables

### Backend

```env
DATABASE_URL=your_database_url
JWT_SECRET_KEY=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

Additional variables may be required for Google Calendar and other configured services.

### Frontend

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=https://health-appointment-backend-a204.onrender.com/api
```

**Never commit real API keys, database credentials, JWT secrets, or other sensitive configuration values to GitHub.**

---

## API Structure

### Authentication

```text
/api/auth/*
```

Handles registration and login.

### Patient

```text
/api/patient/*
```

Handles patient profiles, prescriptions, appointments, and patient-specific operations.

### Doctor

```text
/api/doctor/*
```

Handles doctor appointments, consultations, prescriptions, schedules, and leave requests.

### Admin

```text
/api/admin/*
```

Handles doctor management, leave approvals, schedule requests, and administrative operations.

### Appointments

```text
/api/appointments/*
```

Handles slot availability, appointment holds, confirmation, cancellation, and appointment operations.

### Health Check

```text
GET /api/health
```

Returns:

```json
{
  "status": "healthy",
  "service": "Health Appointment API"
}
```

---

## Security

The application uses:

- JWT-based authentication
- Password hashing
- Role-based access control
- Protected API endpoints
- CORS configuration
- Environment variables for sensitive configuration
- Appointment ownership validation
- Doctor-assignment validation
- Consultation completion validation
- Appointment conflict validation

Sensitive credentials should never be committed to the repository.

---

## Deployment

### Frontend

https://health-appointment-system-t93i.onrender.com

### Backend

https://health-appointment-backend-a204.onrender.com

### GitHub Repository

https://github.com/tanishqkumargupta/Health-appointment-system

---

## Author

**Tanishq Kumar Gupta**

GitHub: https://github.com/tanishqkumargupta

Repository: https://github.com/tanishqkumargupta/Health-appointment-system

---

## License

This project is developed for educational and demonstration purposes.
