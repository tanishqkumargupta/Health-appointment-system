import pytest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from extensions import db
from models import User, Doctor, Specialization, WorkingHours
from services.booking_service import hold_appointment_slot

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_doctor_double_booking_prevention(app):
    with app.app_context():
        # Setup patients and doctor
        p1 = User(name="Patient 1", email="p1@test.com", role="PATIENT")
        p1.set_password("pass")
        p2 = User(name="Patient 2", email="p2@test.com", role="PATIENT")
        p2.set_password("pass")
        db.session.add_all([p1, p2])
        db.session.flush()

        doc_u = User(name="Dr. Busy", email="busy@doc.com", role="DOCTOR")
        doc_u.set_password("pass")
        db.session.add(doc_u)
        db.session.flush()

        spec = Specialization.query.first()
        doc = Doctor(user_id=doc_u.id, specialization_id=spec.id, is_active=True)
        db.session.add(doc)
        db.session.flush()

        wh = WorkingHours(doctor_id=doc.id, start_time=datetime.strptime("09:00", "%H:%M").time(), end_time=datetime.strptime("17:00", "%H:%M").time(), slot_duration=30)
        db.session.add(wh)
        db.session.commit()

        future_slot = (datetime.utcnow() + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat()

        # Patient 1 holds slot successfully
        appt1 = hold_appointment_slot(p1.id, doc.id, future_slot, "Skin", "Itching rash")
        assert appt1.status == "HELD"

        # Patient 2 attempts to hold the same slot -> MUST be rejected
        with pytest.raises(ValueError) as exc:
            hold_appointment_slot(p2.id, doc.id, future_slot, "Skin", "Acne")
        assert "already been selected" in str(exc.value)

def test_patient_overlapping_appointment_prevention(app):
    with app.app_context():
        p1 = User(name="Patient 1", email="p1@test.com", role="PATIENT")
        p1.set_password("pass")
        db.session.add(p1)
        db.session.flush()

        spec = Specialization.query.first()
        
        # Doctor A
        doc_u1 = User(name="Dr. A", email="dra@doc.com", role="DOCTOR")
        doc_u1.set_password("pass")
        db.session.add(doc_u1)
        db.session.flush()
        docA = Doctor(user_id=doc_u1.id, specialization_id=spec.id, is_active=True)
        db.session.add(docA)
        db.session.flush()
        db.session.add(WorkingHours(doctor_id=docA.id, start_time=datetime.strptime("09:00", "%H:%M").time(), end_time=datetime.strptime("17:00", "%H:%M").time(), slot_duration=30))

        # Doctor B
        doc_u2 = User(name="Dr. B", email="drb@doc.com", role="DOCTOR")
        doc_u2.set_password("pass")
        db.session.add(doc_u2)
        db.session.flush()
        docB = Doctor(user_id=doc_u2.id, specialization_id=spec.id, is_active=True)
        db.session.add(docB)
        db.session.flush()
        db.session.add(WorkingHours(doctor_id=docB.id, start_time=datetime.strptime("09:00", "%H:%M").time(), end_time=datetime.strptime("17:00", "%H:%M").time(), slot_duration=30))

        db.session.commit()

        future_slot = (datetime.utcnow() + timedelta(days=2)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat()

        # Patient books Doctor A at 11:00 AM
        hold_appointment_slot(p1.id, docA.id, future_slot, "Skin", "Rash")

        # Patient attempts to book Doctor B at 11:00 AM -> MUST be rejected
        with pytest.raises(ValueError) as exc:
            hold_appointment_slot(p1.id, docB.id, future_slot, "Heart", "Chest tightness")
        assert "overlapping time" in str(exc.value)
