from datetime import datetime
from extensions import db
from models.user import Doctor
from models.schedule import ScheduleRequest, WorkingHours
from models.appointment import Appointment
from utils.helpers import parse_time_str, get_shift_datetimes
from services.notification_service import create_notification
from services.calendar_service import remove_calendar_event

def request_schedule_change(doctor_user_id, start_time_str, end_time_str, slot_duration=30, reason=None):
    doctor = Doctor.query.filter_by(user_id=doctor_user_id).first()
    if not doctor:
        raise ValueError("Doctor profile not found.")

    start_t = parse_time_str(start_time_str)
    end_t = parse_time_str(end_time_str)

    req = ScheduleRequest(
        doctor_id=doctor.id,
        requested_start_time=start_t,
        requested_end_time=end_t,
        requested_slot_duration=int(slot_duration),
        reason=reason.strip() if reason else None,
        status='PENDING'
    )
    db.session.add(req)
    db.session.commit()
    return req

def approve_schedule_request(schedule_request_id):
    """
    Admin approves schedule change request.
    Updates WorkingHours, detects affected future appointments, cancels them with patient notification.
    """
    req = ScheduleRequest.query.get(schedule_request_id)
    if not req:
        raise ValueError("Schedule request not found.")

    if req.status == 'APPROVED':
        return req

    req.status = 'APPROVED'
    
    # Update Working Hours configuration
    wh = WorkingHours.query.filter_by(doctor_id=req.doctor_id).first()
    if not wh:
        wh = WorkingHours(doctor_id=req.doctor_id)
        db.session.add(wh)

    wh.start_time = req.requested_start_time
    wh.end_time = req.requested_end_time
    wh.slot_duration = req.requested_slot_duration
    db.session.flush()

    # Detect future appointments that conflict with new working hours
    now = datetime.utcnow()
    future_appts = Appointment.query.filter(
        Appointment.doctor_id == req.doctor_id,
        Appointment.status.in_(['HELD', 'CONFIRMED']),
        Appointment.start_time > now
    ).all()

    doc_name = req.doctor.user.name if req.doctor and req.doctor.user else "Doctor"

    for appt in future_appts:
        appt_date = appt.start_time.date()
        shift_start, shift_end = get_shift_datetimes(appt_date, wh.start_time, wh.end_time)
        
        # If appointment falls outside the new shift boundaries
        if appt.start_time < shift_start or appt.end_time > shift_end:
            appt.status = 'CANCELLED'
            time_str = appt.start_time.strftime("%b %d, %Y at %I:%M %p")
            
            create_notification(
                user_id=appt.patient_id,
                notif_type='SCHEDULE_NOTIFICATION',
                title="Appointment Cancelled - Doctor Schedule Changed",
                message=f"Your appointment with Dr. {doc_name} on {time_str} was cancelled due to a doctor schedule change. Please rebook for an available slot."
            )
            remove_calendar_event(appt.id)

    db.session.commit()
    return req

def reject_schedule_request(schedule_request_id):
    req = ScheduleRequest.query.get(schedule_request_id)
    if not req:
        raise ValueError("Schedule request not found.")

    req.status = 'REJECTED'
    db.session.commit()
    return req
