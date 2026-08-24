# MediCare Health - Healthcare Appointment Management Platform

A full-stack healthcare appointment management platform supporting **Patients, Doctors, and System Administrators**. Built with Flask, SQLAlchemy, JWT Authentication, React, Vite, PostgreSQL/SQLite, and integrated AI and calendar services.

# WEBSITE DEPLOYED URL

https://health-appointment-system-t93i.onrender.com

# BACKEND API

https://health-appointment-backend-a204.onrender.com

# SYSTEM DESIGN DOCUMENT

https://drive.google.com/file/d/1F6b_ju6bZRcMrImfT_s94RhQoROvq1rw/view?usp=sharing

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
       │ Authentication│     │ Appointment │      │ Role-Based  │
       │    Routes     │     │   Routes    │      │   Routes    │
       └──────────────┘      └──────┬──────┘      └─────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │     Services        │
                         │ Booking / Slots /   │
                         │ Notifications / AI  │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │    SQLAlchemy ORM   │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │      Database       │
                         │ PostgreSQL / SQLite │
                         └─────────────────────┘
