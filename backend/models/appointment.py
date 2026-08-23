import json
from datetime import datetime
from extensions import db

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, index=True)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='HELD') # HELD, CONFIRMED, COMPLETED, CANCELLED
    hold_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    symptom = db.relationship('Symptom', backref='appointment', uselist=False, cascade='all, delete-orphan')
    pre_visit_summary = db.relationship('PreVisitSummary', backref='appointment', uselist=False, cascade='all, delete-orphan')
    consultation = db.relationship('Consultation', backref='appointment', uselist=False, cascade='all, delete-orphan')
    feedback = db.relationship('Feedback', backref='appointment', uselist=False, cascade='all, delete-orphan')
    calendar_event = db.relationship('CalendarEvent', backref='appointment', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else None,
            "patient_email": self.patient.email if self.patient else None,
            "patient_phone": self.patient.phone if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.name if self.doctor and self.doctor.user else None,
            "specialization_name": self.doctor.specialization.name if self.doctor and self.doctor.specialization else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "hold_expires_at": self.hold_expires_at.isoformat() if self.hold_expires_at else None,
            "symptom": self.symptom.to_dict() if self.symptom else None,
            "pre_visit_summary": self.pre_visit_summary.to_dict() if self.pre_visit_summary else None,
            "consultation": self.consultation.to_dict() if self.consultation else None,
            "feedback": self.feedback.to_dict() if self.feedback else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Symptom(db.Model):
    __tablename__ = 'symptoms'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True)
    problem_category = db.Column(db.String(100), nullable=False)
    symptom_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "problem_category": self.problem_category,
            "symptom_text": self.symptom_text,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PreVisitSummary(db.Model):
    __tablename__ = 'pre_visit_summaries'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True)
    urgency = db.Column(db.String(20), nullable=False, default='Medium') # Low, Medium, High
    chief_complaint = db.Column(db.Text, nullable=True)
    suggested_questions_json = db.Column(db.Text, nullable=True) # JSON array string
    status = db.Column(db.String(20), nullable=False, default='COMPLETED') # COMPLETED, FAILED, PENDING
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def suggested_questions(self):
        if self.suggested_questions_json:
            try:
                return json.loads(self.suggested_questions_json)
            except Exception:
                return []
        return []

    @suggested_questions.setter
    def suggested_questions(self, value):
        self.suggested_questions_json = json.dumps(value) if value else json.dumps([])

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "urgency": self.urgency,
            "chief_complaint": self.chief_complaint,
            "suggested_questions": self.suggested_questions,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
