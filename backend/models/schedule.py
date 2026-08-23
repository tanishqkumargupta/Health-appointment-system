from datetime import datetime
from extensions import db

class WorkingHours(db.Model):
    __tablename__ = 'working_hours'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False, unique=True)
    start_time = db.Column(db.Time, nullable=False) # e.g. 09:00 or 18:00
    end_time = db.Column(db.Time, nullable=False)   # e.g. 17:00 or 02:00
    slot_duration = db.Column(db.Integer, nullable=False, default=30) # 15, 30, 45, 60 minutes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "slot_duration": self.slot_duration
        }


class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    leave_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='PENDING') # PENDING, APPROVED, REJECTED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.name if self.doctor and self.doctor.user else None,
            "leave_date": self.leave_date.isoformat() if self.leave_date else None,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ScheduleRequest(db.Model):
    __tablename__ = 'schedule_requests'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    requested_start_time = db.Column(db.Time, nullable=False)
    requested_end_time = db.Column(db.Time, nullable=False)
    requested_slot_duration = db.Column(db.Integer, nullable=False, default=30)
    reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='PENDING') # PENDING, APPROVED, REJECTED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.name if self.doctor and self.doctor.user else None,
            "requested_start_time": self.requested_start_time.strftime("%H:%M") if self.requested_start_time else None,
            "requested_end_time": self.requested_end_time.strftime("%H:%M") if self.requested_end_time else None,
            "requested_slot_duration": self.requested_slot_duration,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
