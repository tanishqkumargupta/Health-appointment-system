import pytest
import sys
import os
from datetime import datetime, timedelta, time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from extensions import db
from models import User, Doctor, Specialization, WorkingHours
from services.slot_service import get_available_slots

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

def test_overnight_slot_generation(app):
    with app.app_context():
        spec = Specialization.query.filter_by(name="Cardiology").first()
        doc_u = User(name="Dr. Night", email="night@doc.com", role="DOCTOR")
        doc_u.set_password("pass")
        db.session.add(doc_u)
        db.session.flush()

        doc = Doctor(user_id=doc_u.id, specialization_id=spec.id, is_active=True)
        db.session.add(doc)
        db.session.flush()

        # Overnight shift: 18:00 to 02:00 (8 hours = 16 30-min slots)
        wh = WorkingHours(doctor_id=doc.id, start_time=time(18, 0), end_time=time(2, 0), slot_duration=30)
        db.session.add(wh)
        db.session.commit()

        slots = get_available_slots(doc.id, "2026-09-01")
        assert len(slots) == 16
        assert slots[0]["start_time"] == "18:00"
        assert slots[-1]["start_time"] == "01:30"
        assert slots[-1]["end_time"] == "02:00"
