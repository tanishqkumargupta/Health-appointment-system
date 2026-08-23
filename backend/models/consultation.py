import json
from datetime import datetime
from extensions import db

class Consultation(db.Model):
    __tablename__ = 'consultations'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True)
    diagnosis = db.Column(db.Text, nullable=False)
    clinical_notes = db.Column(db.Text, nullable=True)
    post_visit_ai_summary = db.Column(db.Text, nullable=True)
    ai_status = db.Column(db.String(20), nullable=False, default='PENDING') # COMPLETED, FAILED, PENDING
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prescription = db.relationship('Prescription', backref='consultation', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "diagnosis": self.diagnosis,
            "clinical_notes": self.clinical_notes,
            "post_visit_ai_summary": self.post_visit_ai_summary,
            "ai_status": self.ai_status,
            "prescription": self.prescription.to_dict() if self.prescription else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Prescription(db.Model):
    __tablename__ = 'prescriptions'

    id = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, db.ForeignKey('consultations.id', ondelete='CASCADE'), nullable=False, unique=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship('PrescriptionItem', backref='prescription', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "consultation_id": self.consultation_id,
            "appointment_id": self.appointment_id,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.name if self.doctor and self.doctor.user else None,
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.items]
        }


class PrescriptionItem(db.Model):
    __tablename__ = 'prescription_items'

    id = db.Column(db.Integer, primary_key=True)
    prescription_id = db.Column(db.Integer, db.ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False)
    medicine_name = db.Column(db.String(150), nullable=False)
    dosage = db.Column(db.String(100), nullable=False) # e.g. 500 mg
    food_instruction = db.Column(db.String(50), nullable=False) # Before food, With food, After food, Without food
    frequency_json = db.Column(db.Text, nullable=False) # JSON list e.g. ["Morning", "Evening"]
    duration = db.Column(db.String(50), nullable=True) # e.g. 5 days

    @property
    def frequency(self):
        if self.frequency_json:
            try:
                return json.loads(self.frequency_json)
            except Exception:
                return []
        return []

    @frequency.setter
    def frequency(self, value):
        self.frequency_json = json.dumps(value) if isinstance(value, list) else json.dumps([value])

    def to_dict(self):
        return {
            "id": self.id,
            "prescription_id": self.prescription_id,
            "medicine_name": self.medicine_name,
            "dosage": self.dosage,
            "food_instruction": self.food_instruction,
            "frequency": self.frequency,
            "duration": self.duration
        }
