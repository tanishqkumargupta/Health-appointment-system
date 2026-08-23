from extensions import db
from models.notification import Notification

def create_notification(user_id, notif_type, title, message):
    """
    Creates an in-app notification & queued email job record.
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
    return notif

def get_user_notifications(user_id):
    return Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()

def mark_notification_read(notif_id, user_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
    return notif
