from extensions import db
from models.user import User, Doctor
from flask_jwt_extended import create_access_token

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

    token = create_access_token(identity=str(user.id))
    return user, token

def login_user(email, password):
    email = email.lower().strip()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        raise ValueError("Invalid email or password.")

    token = create_access_token(identity=str(user.id))
    return user, token
