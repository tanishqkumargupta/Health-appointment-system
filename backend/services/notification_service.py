from datetime import datetime
from extensions import db
from models.notification import Notification
from services.email_service import send_email_direct

def create_notification(user_id, notif_type, title, message):
    """
    Creates an in-app notification & queued email job record.
    Attempts immediate dispatch, with fallback to background retry worker on failure.
    """
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        is_read=False,
        status='PENDING',
        attempts=0
    )
    db.session.add(notif)
    db.session.commit()

    # Immediate email dispatch attempt (non-blocking failure)
    try:
        user_email = notif.user.email if notif.user else None
        if user_email:
            send_email_direct(user_email, title, message)
            notif.status = 'SENT'
            notif.attempts = 1
            notif.sent_at = datetime.utcnow()
            db.session.commit()
    except Exception as e:
        print(f"[Immediate Email Dispatch Exception] Notification {notif.id}: {e}")

    return notif

def get_user_notifications(user_id):
    return Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()

def mark_notification_read(notif_id, user_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
    return notif
