from datetime import datetime
from extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    status = db.Column(db.String(20), default='PENDING', nullable=False) # PENDING, SENT, FAILED
    attempts = db.Column(db.Integer, default=0, nullable=False)
    last_error = db.Column(db.Text, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "status": self.status,
            "attempts": self.attempts,
            "last_error": self.last_error,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Feedback(db.Model):
    __tablename__ = 'feedback'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1-5 stars
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True)
    google_event_id = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='PENDING', nullable=False) # SYNCED, PENDING, FAILED
    last_error = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "google_event_id": self.google_event_id,
            "status": self.status,
            "last_error": self.last_error,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
