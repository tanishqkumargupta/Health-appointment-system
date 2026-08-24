from datetime import datetime, timedelta
from extensions import db
from models.appointment import Appointment, Symptom, PreVisitSummary
from models.user import Doctor, User
from models.schedule import WorkingHours, LeaveRequest
from services.ai_service import generate_pre_visit_ai_summary
from services.notification_service import create_notification
from services.calendar_service import sync_calendar_event
from utils.helpers import get_shift_datetimes, check_time_overlap

def hold_appointment_slot(patient_id, doctor_id, start_time_iso, problem_category, symptom_text):
    """
    Creates a temporary 5-minute hold for a slot.
    Enforces DB-level transaction checks for Doctor & Patient double-booking constraints.
    """
    if isinstance(start_time_iso, str):
        start_dt = datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
    else:
        start_dt = start_time_iso

    doctor = Doctor.query.get(doctor_id)
    if not doctor or not doctor.is_active:
        raise ValueError("Selected doctor is not active or available.")

    wh = WorkingHours.query.filter_by(doctor_id=doctor_id).first()
    slot_duration = wh.slot_duration if wh else 30
    end_dt = start_dt + timedelta(minutes=slot_duration)

    now = datetime.utcnow()
    if start_dt < now:
        raise ValueError("Cannot book a slot in the past.")

    # Clean up expired holds system-wide
    db.session.query(Appointment).filter(
        Appointment.status == 'HELD',
        Appointment.hold_expires_at <= now
    ).update({"status": "CANCELLED"})

    # Check Leave Conflict
    appointment_date = start_dt.date()
    on_leave = LeaveRequest.query.filter_by(
        doctor_id=doctor_id,
        leave_date=appointment_date,
        status='APPROVED'
    ).first()
    if on_leave:
        raise ValueError("Doctor is on approved leave during this date.")

    # CONSTRAINT 1: Doctor double-booking check
    doctor_conflict = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(['HELD', 'CONFIRMED', 'COMPLETED']),
        Appointment.start_time < end_dt,
        Appointment.end_time > start_dt
    ).first()

    if doctor_conflict:
        raise ValueError("This slot has already been selected or booked by another patient. Please choose another slot.")

    # CONSTRAINT 2: Patient overlapping appointment check (across any doctor)
    patient_conflict = Appointment.query.filter(
        Appointment.patient_id == patient_id,
        Appointment.status.in_(['HELD', 'CONFIRMED', 'COMPLETED']),
        Appointment.start_time < end_dt,
        Appointment.end_time > start_dt
    ).first()

    if patient_conflict:
        raise ValueError("You already have another appointment scheduled during this overlapping time.")

    hold_expires = now + timedelta(minutes=5)

    appointment = Appointment(
        patient_id=patient_id,
        doctor_id=doctor_id,
        start_time=start_dt,
        end_time=end_dt,
        status='HELD',
        hold_expires_at=hold_expires
    )
    db.session.add(appointment)
    db.session.flush()

    symptom = Symptom(
        appointment_id=appointment.id,
        problem_category=problem_category,
        symptom_text=symptom_text
    )
    db.session.add(symptom)
    db.session.commit()

    return appointment

def confirm_appointment_booking(appointment_id, patient_id):
    """
    Confirms a HELD appointment.
    Generates Pre-Visit AI summary, triggers instant email notification to patient and doctor, syncs Calendar.
    """
    appointment = Appointment.query.filter_by(id=appointment_id, patient_id=patient_id).first()
    if not appointment:
        raise ValueError("Appointment hold not found.")

    if appointment.status == 'CONFIRMED':
        return appointment

    if appointment.status != 'HELD':
        raise ValueError("Appointment hold is no longer valid or expired.")

    now = datetime.utcnow()
    if appointment.hold_expires_at and appointment.hold_expires_at < now:
        appointment.status = 'CANCELLED'
        db.session.commit()
        raise ValueError("Slot hold expired. Please select the slot again.")

    appointment.status = 'CONFIRMED'
    appointment.hold_expires_at = None
    db.session.flush()

    # Trigger Pre-Visit AI Summary (Rule 28 & 29)
    if appointment.symptom:
        ai_res = generate_pre_visit_ai_summary(
            appointment.symptom.problem_category,
            appointment.symptom.symptom_text
        )
        pre_summary = PreVisitSummary(
            appointment_id=appointment.id,
            urgency=ai_res["urgency"],
            chief_complaint=ai_res["chief_complaint"],
            suggested_questions=ai_res["suggested_questions"],
            status=ai_res.get("status", "COMPLETED")
        )
        db.session.add(pre_summary)

    doc_name = appointment.doctor.user.name if appointment.doctor and appointment.doctor.user else "Doctor"
    spec_name = appointment.doctor.specialization.name if appointment.doctor and appointment.doctor.specialization else "General"
    time_str = appointment.start_time.strftime("%b %d, %Y at %I:%M %p")

    # Queue & Instantly Send Patient Booking Confirmation Email (Rule 34)
    create_notification(
        user_id=patient_id,
        notif_type='APPOINTMENT_CONFIRMATION',
        title="Appointment Booking Confirmed - MediCare Health",
        message=(
            f"Dear {appointment.patient.name},\n\n"
            f"Your healthcare appointment has been successfully booked and confirmed.\n\n"
            f"Appointment Details:\n"
            f"- Doctor: Dr. {doc_name} ({spec_name})\n"
            f"- Date & Time: {time_str}\n"
            f"- Problem Area: {appointment.symptom.problem_category if appointment.symptom else 'General'}\n"
            f"- Symptoms: {appointment.symptom.symptom_text if appointment.symptom else 'N/A'}\n\n"
            f"Thank you for choosing MediCare Health."
        )
    )

    # Rule 23: Doctor Notification
    if appointment.doctor and appointment.doctor.working_hours:
        wh = appointment.doctor.working_hours
        shift_start, shift_end = get_shift_datetimes(now.date(), wh.start_time, wh.end_time)
        is_active_shift = (shift_start <= now <= shift_end)
        
        if is_active_shift:
            create_notification(
                user_id=appointment.doctor.user_id,
                notif_type='NEW_BOOKING',
                title="New Booking Alert",
                message=f"New appointment booked by {appointment.patient.name} for {time_str} ({appointment.symptom.problem_category if appointment.symptom else ''})."
            )

    db.session.commit()

    # Async Google Calendar Sync
    sync_calendar_event(appointment)

    return appointment

def cancel_appointment(appointment_id, user_id, user_role):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        raise ValueError("Appointment not found.")

    if user_role == 'PATIENT' and appointment.patient_id != user_id:
        raise ValueError("Unauthorized to cancel this appointment.")
    elif user_role == 'DOCTOR' and appointment.doctor.user_id != user_id:
        raise ValueError("Unauthorized to cancel this appointment.")

    appointment.status = 'CANCELLED'
    db.session.commit()

    create_notification(
        user_id=appointment.patient_id,
        notif_type='APPOINTMENT_CANCELLED',
        title="Appointment Cancelled",
        message=f"Your appointment scheduled for {appointment.start_time.strftime('%b %d, %I:%M %p')} has been cancelled."
    )
    return appointment
