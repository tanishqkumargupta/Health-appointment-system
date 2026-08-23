from extensions import db
from models.user import User, Doctor
from models.schedule import WorkingHours
from models.specialization import Specialization
from utils.helpers import parse_time_str

def create_doctor(name, email, password, phone, specialization_id, start_time_str, end_time_str, slot_duration=30):
    email = email.lower().strip()
    if User.query.filter_by(email=email).first():
        raise ValueError("User with this email already exists.")
    
    spec = Specialization.query.get(specialization_id)
    if not spec:
        raise ValueError(f"Specialization with ID {specialization_id} not found.")

    start_t = parse_time_str(start_time_str)
    end_t = parse_time_str(end_time_str)

    user = User(
        name=name.strip(),
        email=email,
        phone=phone.strip() if phone else None,
        role='DOCTOR'
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    doctor = Doctor(
        user_id=user.id,
        specialization_id=specialization_id,
        is_active=True
    )
    db.session.add(doctor)
    db.session.flush()

    working_hours = WorkingHours(
        doctor_id=doctor.id,
        start_time=start_t,
        end_time=end_t,
        slot_duration=int(slot_duration)
    )
    db.session.add(working_hours)
    db.session.commit()

    return doctor

def update_doctor(doctor_id, name=None, phone=None, specialization_id=None, start_time_str=None, end_time_str=None, slot_duration=None):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        raise ValueError("Doctor not found.")

    if name:
        doctor.user.name = name.strip()
    if phone is not None:
        doctor.user.phone = phone.strip() if phone else None
    if specialization_id:
        spec = Specialization.query.get(specialization_id)
        if not spec:
            raise ValueError(f"Specialization ID {specialization_id} not found.")
        doctor.specialization_id = specialization_id

    if doctor.working_hours:
        if start_time_str:
            doctor.working_hours.start_time = parse_time_str(start_time_str)
        if end_time_str:
            doctor.working_hours.end_time = parse_time_str(end_time_str)
        if slot_duration:
            doctor.working_hours.slot_duration = int(slot_duration)

    db.session.commit()
    return doctor

def set_doctor_active_status(doctor_id, is_active):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        raise ValueError("Doctor not found.")
    doctor.is_active = is_active
    db.session.commit()
    return doctor
