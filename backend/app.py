import sys
import os
from flask import Flask, jsonify

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from extensions import db, jwt, cors, migrate
from models import (
    User, Doctor, Specialization, PatientIssueCategory,
    WorkingHours, LeaveRequest, ScheduleRequest, Appointment,
    Symptom, PreVisitSummary, Consultation, Prescription,
    PrescriptionItem, Notification, Feedback, CalendarEvent
)
from routes.auth_routes import auth_bp
from routes.patient_routes import patient_bp
from routes.doctor_routes import doctor_bp
from routes.admin_routes import admin_bp
from routes.appointment_routes import appointment_bp
from tasks.scheduler import init_scheduler

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(appointment_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "Health Appointment API"}), 200

    # CLI command to seed default database records
    @app.cli.command("seed-db")
    def seed_db_command():
        seed_database()
        print("Database successfully seeded!")

    # Auto-seed in app context if tables empty
    with app.app_context():
        db.create_all()
        seed_database()

    # Initialize background task scheduler
    try:
        init_scheduler(app)
    except Exception as e:
        print(f"[Scheduler Warning] Could not start scheduler: {e}")

    return app

def seed_database():
    """Seeds default specializations, categories, superadmin, initial doctors, and demo patient."""

    # 1. Deterministic Specialization & Category Mappings (Section 7)
    mappings = [
        ("Skin", "Dermatology", "Skin disorders, rashes, and aesthetic dermatological care."),
        ("Heart / Chest", "Cardiology", "Heart health, cardiovascular diseases, and chest pain evaluation."),
        ("Head / Brain", "Neurology", "Nervous system, severe headaches, migraines, and neurological disorders."),
        ("Bones / Joints", "Orthopedics", "Bone fractures, joint pain, arthritis, and musculoskeletal health."),
        ("Eyes", "Ophthalmology", "Vision care, eye infections, and ocular health."),
        ("Ear / Nose / Throat", "ENT", "Ear, nose, throat conditions, sinus problems, and hearing health."),
        ("Stomach / Digestion", "Gastroenterology", "Digestive system, stomach pain, acid reflux, and liver health."),
        ("General / Other", "General Medicine", "Primary healthcare, general illness, fever, and routine wellness.")
    ]

    for cat_name, spec_name, spec_desc in mappings:
        spec = Specialization.query.filter_by(name=spec_name).first()
        if not spec:
            spec = Specialization(name=spec_name, description=spec_desc)
            db.session.add(spec)
            db.session.flush()

        cat = PatientIssueCategory.query.filter_by(category_name=cat_name).first()
        if not cat:
            cat = PatientIssueCategory(category_name=cat_name, specialization_id=spec.id)
            db.session.add(cat)

    # 2. Default Admin Account (Section 3)
    admin = User.query.filter_by(email="admin@healthapp.com").first()
    if not admin:
        admin = User(
            name="System Admin",
            email="admin@healthapp.com",
            phone="1234567890",
            role="ADMIN"
        )
        admin.set_password("admin123", rounds=4)
        db.session.add(admin)
        db.session.flush()

    # 3. Default Doctor Accounts (Dr. Sharma - Dermatology, Dr. Patel - Cardiology)
    derma_spec = Specialization.query.filter_by(name="Dermatology").first()
    if derma_spec:
        doc_user1 = User.query.filter_by(email="dr.sharma@healthapp.com").first()
        if not doc_user1:
            doc_user1 = User(
                name="Dr. Sharma",
                email="dr.sharma@healthapp.com",
                phone="9876543210",
                role="DOCTOR"
            )
            doc_user1.set_password("doctor123", rounds=4)
            db.session.add(doc_user1)
            db.session.flush()

            doctor1 = Doctor(
                user_id=doc_user1.id,
                specialization_id=derma_spec.id,
                is_active=True
            )
            db.session.add(doctor1)
            db.session.flush()

            wh1 = WorkingHours(
                doctor_id=doctor1.id,
                start_time=parse_time_helper("09:00"),
                end_time=parse_time_helper("17:00"),
                slot_duration=30
            )
            db.session.add(wh1)

    cardio_spec = Specialization.query.filter_by(name="Cardiology").first()
    if cardio_spec:
        doc_user2 = User.query.filter_by(email="dr.patel@healthapp.com").first()
        if not doc_user2:
            doc_user2 = User(
                name="Dr. Patel",
                email="dr.patel@healthapp.com",
                phone="9876543211",
                role="DOCTOR"
            )
            doc_user2.set_password("doctor123", rounds=4)
            db.session.add(doc_user2)
            db.session.flush()

            doctor2 = Doctor(
                user_id=doc_user2.id,
                specialization_id=cardio_spec.id,
                is_active=True
            )
            db.session.add(doctor2)
            db.session.flush()

            wh2 = WorkingHours(
                doctor_id=doctor2.id,
                start_time=parse_time_helper("18:00"),
                end_time=parse_time_helper("02:00"), # Overnight shift!
                slot_duration=30
            )
            db.session.add(wh2)

    # 4. Default Demo Patient Account
    patient = User.query.filter_by(email="patient@example.com").first()
    if not patient:
        patient = User(
            name="Demo Patient",
            email="patient@example.com",
            phone="9876543212",
            role="PATIENT"
        )
        patient.set_password("patient123", rounds=4)
        db.session.add(patient)

    db.session.commit()

def parse_time_helper(t_str):
    from datetime import datetime
    return datetime.strptime(t_str, "%H:%M").time()

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
