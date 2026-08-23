from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from extensions import db
from models.appointment import Appointment
from models.user import Doctor
from services.notification_service import create_notification
from services.email_service import process_pending_email_jobs

scheduler = BackgroundScheduler()

def check_and_send_appointment_reminders(app):
    with app.app_context():
        now = datetime.utcnow()

        # 24-hour reminder check (window: between 23.5h and 24.5h from now)
        start_24h = now + timedelta(hours=23, minutes=30)
        end_24h = now + timedelta(hours=24, minutes=30)
        appts_24h = Appointment.query.filter(
            Appointment.status == 'CONFIRMED',
            Appointment.start_time >= start_24h,
            Appointment.start_time <= end_24h
        ).all()

        for appt in appts_24h:
            time_str = appt.start_time.strftime("%b %d at %I:%M %p")
            doc_name = appt.doctor.user.name if appt.doctor and appt.doctor.user else "Doctor"
            create_notification(
                user_id=appt.patient_id,
                notif_type='APPOINTMENT_REMINDER',
                title="Reminder: Upcoming Appointment Tomorrow",
                message=f"Reminder: You have an appointment with Dr. {doc_name} tomorrow on {time_str}."
            )

        # 2-hour reminder check (window: between 1.5h and 2.5h from now)
        start_2h = now + timedelta(hours=1, minutes=30)
        end_2h = now + timedelta(hours=2, minutes=30)
        appts_2h = Appointment.query.filter(
            Appointment.status == 'CONFIRMED',
            Appointment.start_time >= start_2h,
            Appointment.start_time <= end_2h
        ).all()

        for appt in appts_2h:
            time_str = appt.start_time.strftime("%I:%M %p")
            doc_name = appt.doctor.user.name if appt.doctor and appt.doctor.user else "Doctor"
            create_notification(
                user_id=appt.patient_id,
                notif_type='APPOINTMENT_REMINDER',
                title="Reminder: Appointment in 2 Hours",
                message=f"Reminder: Your appointment with Dr. {doc_name} is in 2 hours at {time_str}."
            )

def process_email_queue_job(app):
    with app.app_context():
        process_pending_email_jobs()

def expire_held_slots_job(app):
    with app.app_context():
        now = datetime.utcnow()
        db.session.query(Appointment).filter(
            Appointment.status == 'HELD',
            Appointment.hold_expires_at <= now
        ).update({"status": "CANCELLED"})
        db.session.commit()

def init_scheduler(app):
    if not scheduler.running:
        scheduler.add_job(lambda: check_and_send_appointment_reminders(app), 'interval', minutes=15, id='appt_reminders')
        scheduler.add_job(lambda: process_email_queue_job(app), 'interval', minutes=2, id='email_queue')
        scheduler.add_job(lambda: expire_held_slots_job(app), 'interval', minutes=1, id='slot_hold_expire')
        scheduler.start()
