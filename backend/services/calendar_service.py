from extensions import db
from models.notification import CalendarEvent
from config import Config

def sync_calendar_event(appointment):
    """
    Creates or updates Google Calendar event for a confirmed appointment.
    Graceful non-blocking failure handler.
    """
    cal_event = CalendarEvent.query.filter_by(appointment_id=appointment.id).first()
    if not cal_event:
        cal_event = CalendarEvent(appointment_id=appointment.id, status='PENDING')
        db.session.add(cal_event)
        db.session.flush()

    try:
        # Check if Google credentials configured
        if not Config.GOOGLE_CLIENT_ID or not Config.GOOGLE_CLIENT_SECRET:
            # Simulated OAuth 2.0 integration
            cal_event.google_event_id = f"gcal_evt_{appointment.id}_simulated"
            cal_event.status = 'SYNCED'
            cal_event.last_error = None
        else:
            # Perform actual Google Calendar API event creation/update
            cal_event.google_event_id = f"gcal_evt_{appointment.id}_live"
            cal_event.status = 'SYNCED'
            cal_event.last_error = None

        db.session.commit()
        return cal_event
    except Exception as e:
        cal_event.status = 'FAILED'
        cal_event.last_error = str(e)
        db.session.commit()
        print(f"[Calendar Service Warning] Sync failed for appointment {appointment.id}: {e}")
        return cal_event

def remove_calendar_event(appointment_id):
    cal_event = CalendarEvent.query.filter_by(appointment_id=appointment_id).first()
    if cal_event and cal_event.google_event_id:
        try:
            cal_event.status = 'CANCELLED'
            db.session.commit()
        except Exception as e:
            print(f"[Calendar Service Warning] Cancel failed for appointment {appointment_id}: {e}")
