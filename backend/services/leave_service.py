from datetime import datetime
from extensions import db
from models.user import Doctor
from models.schedule import LeaveRequest
from models.appointment import Appointment
from services.notification_service import create_notification
from services.calendar_service import remove_calendar_event

def request_leave(doctor_user_id, leave_date_str, reason):
    doctor = Doctor.query.filter_by(user_id=doctor_user_id).first()
    if not doctor:
        raise ValueError("Doctor profile not found.")

    leave_date = datetime.strptime(leave_date_str, "%Y-%m-%d").date()
    if leave_date < datetime.utcnow().date():
        raise ValueError("Cannot request leave for past dates.")

    # Check for existing request on same date
    existing = LeaveRequest.query.filter_by(doctor_id=doctor.id, leave_date=leave_date).first()
    if existing:
        if existing.status == 'APPROVED':
            raise ValueError("Leave is already approved for this date.")
        elif existing.status == 'PENDING':
            raise ValueError("A leave request for this date is already pending approval.")

    leave_req = LeaveRequest(
        doctor_id=doctor.id,
        leave_date=leave_date,
        reason=reason.strip() if reason else None,
        status='PENDING'
    )
    db.session.add(leave_req)
    db.session.commit()
    return leave_req

def approve_leave_request(leave_request_id):
    """
    Admin approves leave request.
    Cancels conflicting existing appointments, notifies affected patients, and updates calendar events.
    """
    req = LeaveRequest.query.get(leave_request_id)
    if not req:
        raise ValueError("Leave request not found.")

    if req.status == 'APPROVED':
        return req

    req.status = 'APPROVED'
    db.session.flush()

    # Find existing CONFIRMED or HELD appointments for this doctor on leave_date
    start_of_day = datetime.combine(req.leave_date, datetime.min.time())
    end_of_day = datetime.combine(req.leave_date, datetime.max.time())

    conflicting_appts = Appointment.query.filter(
        Appointment.doctor_id == req.doctor_id,
        Appointment.status.in_(['HELD', 'CONFIRMED']),
        Appointment.start_time >= start_of_day,
        Appointment.start_time <= end_of_day
    ).all()

    doc_name = req.doctor.user.name if req.doctor and req.doctor.user else "Doctor"

    for appt in conflicting_appts:
        appt.status = 'CANCELLED'
        time_str = appt.start_time.strftime("%b %d, %Y at %I:%M %p")
        
        # Rule 17: Email notification to patient
        create_notification(
            user_id=appt.patient_id,
            notif_type='LEAVE_CANCELLATION',
            title="Appointment Cancelled - Doctor Unavailable",
            message=f"Your appointment with Dr. {doc_name} on {time_str} has been cancelled because the doctor is unavailable. Please book another available slot."
        )

        remove_calendar_event(appt.id)

    db.session.commit()
    return req

def reject_leave_request(leave_request_id):
    req = LeaveRequest.query.get(leave_request_id)
    if not req:
        raise ValueError("Leave request not found.")

    req.status = 'REJECTED'
    db.session.commit()
    return req
