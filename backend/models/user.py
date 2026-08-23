from datetime import datetime
import bcrypt
from extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='PATIENT') # PATIENT, DOCTOR, ADMIN
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor_profile = db.relationship('Doctor', backref='user', uselist=False, cascade='all, delete-orphan')
    appointments_as_patient = db.relationship('Appointment', backref='patient', foreign_keys='Appointment.patient_id')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete-orphan')

    def set_password(self, password, rounds=12):
        salt = bcrypt.gensalt(rounds=rounds)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Doctor(db.Model):
    __tablename__ = 'doctors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    specialization_id = db.Column(db.Integer, db.ForeignKey('specializations.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    working_hours = db.relationship('WorkingHours', backref='doctor', uselist=False, cascade='all, delete-orphan')
    leave_requests = db.relationship('LeaveRequest', backref='doctor', cascade='all, delete-orphan')
    schedule_requests = db.relationship('ScheduleRequest', backref='doctor', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', backref='doctor', foreign_keys='Appointment.doctor_id')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name if self.user else None,
            "email": self.user.email if self.user else None,
            "phone": self.user.phone if self.user else None,
            "specialization_id": self.specialization_id,
            "specialization_name": self.specialization.name if self.specialization else None,
            "is_active": self.is_active,
            "working_hours": self.working_hours.to_dict() if self.working_hours else None
        }
