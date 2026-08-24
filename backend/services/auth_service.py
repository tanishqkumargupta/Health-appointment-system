from datetime import datetime
from extensions import db
from models.user import User, Doctor
from flask_jwt_extended import create_access_token
from services.notification_service import create_notification

def register_patient(name, email, phone, password):
    email = email.lower().strip()
    if User.query.filter_by(email=email).first():
        raise ValueError("An account with this email already exists.")

    user = User(
        name=name.strip(),
        email=email,
        phone=phone.strip() if phone else None,
        role='PATIENT'
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Welcome email notification
    create_notification(
        user_id=user.id,
        notif_type='WELCOME_NOTIFICATION',
        title="Welcome to MediCare Health Portal",
        message=f"Hello {user.name},\n\nThank you for registering with MediCare Health Portal. You can now search for doctors, book appointments, and view your prescription history."
    )

    token = create_access_token(identity=str(user.id))
    return user, token

def login_user(email, password):
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        raise ValueError("Invalid email or password.")

    token = create_access_token(identity=str(user.id))

    # Requirement 1: Login Notification Email sent upon every login
    time_str = datetime.utcnow().strftime("%b %d, %Y at %I:%M %p UTC")
    create_notification(
        user_id=user.id,
        notif_type='LOGIN_NOTIFICATION',
        title="Security Alert: Successful Login to MediCare Portal",
        message=f"Hello {user.name},\n\nYour MediCare Portal account was successfully logged into on {time_str}.\nRole: {user.role}\n\nIf you did not initiate this login, please contact system administration immediately."
    )

    return user, token
