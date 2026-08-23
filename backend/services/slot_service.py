from datetime import datetime, timedelta, date, time
from extensions import db
from models.user import Doctor
from models.schedule import WorkingHours, LeaveRequest
from models.appointment import Appointment
from utils.helpers import get_shift_datetimes, check_time_overlap

def get_available_slots(doctor_id, target_date_str):
    """
    Generates time slots for a given doctor on target_date_str ('YYYY-MM-DD').
    Handles overnight boundary shifts, active slot holds, approved leave, and double booking.
    """
    if isinstance(target_date_str, str):
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    else:
        target_date = target_date_str

    doctor = Doctor.query.get(doctor_id)
    if not doctor or not doctor.is_active:
        return []

    wh = WorkingHours.query.filter_by(doctor_id=doctor_id).first()
    if not wh:
        return []

    # Check if doctor is on approved leave on target_date
    approved_leave = LeaveRequest.query.filter_by(
        doctor_id=doctor_id,
        leave_date=target_date,
        status='APPROVED'
    ).first()
    if approved_leave:
        # Entire day is blocked by leave
        return []

    # Calculate full shift start and end datetimes
    shift_start_dt, shift_end_dt = get_shift_datetimes(target_date, wh.start_time, wh.end_time)
    slot_delta = timedelta(minutes=wh.slot_duration)

    now = datetime.utcnow()

    # Clean up expired holds for this doctor
    expired_holds = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status == 'HELD',
        Appointment.hold_expires_at <= now
    ).all()
    for exp in expired_holds:
        exp.status = 'CANCELLED'
    if expired_holds:
        db.session.commit()

    # Fetch active appointments for this doctor that overlap with shift timeframe
    # Active statuses: CONFIRMED, COMPLETED, or HELD (unexpired)
    existing_appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(['CONFIRMED', 'COMPLETED', 'HELD']),
        Appointment.start_time < shift_end_dt,
        Appointment.end_time > shift_start_dt
    ).all()

    # Re-verify holds in list
    active_appointments = []
    for appt in existing_appointments:
        if appt.status == 'HELD' and appt.hold_expires_at and appt.hold_expires_at <= now:
            continue
        active_appointments.append(appt)

    slots = []
    curr = shift_start_dt

    while curr + slot_delta <= shift_end_dt:
        slot_start = curr
        slot_end = curr + slot_delta

        # Is slot in the past?
        is_past = slot_start < now

        # Does slot overlap with any active appointment/hold?
        is_booked = False
        for appt in active_appointments:
            if check_time_overlap(slot_start, slot_end, appt.start_time, appt.end_time):
                is_booked = True
                break

        slots.append({
            "doctor_id": doctor_id,
            "date": target_date.strftime("%Y-%m-%d"),
            "start_time": slot_start.strftime("%H:%M"),
            "end_time": slot_end.strftime("%H:%M"),
            "start_datetime": slot_start.isoformat(),
            "end_datetime": slot_end.isoformat(),
            "is_available": (not is_past) and (not is_booked),
            "is_past": is_past,
            "is_booked": is_booked
        })

        curr += slot_delta

    return slots
