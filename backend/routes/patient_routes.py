from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import role_required
from extensions import db
from models.user import User
from models.appointment import Appointment
from models.consultation import Prescription
from models.notification import Feedback

patient_bp = Blueprint('patient', __name__, url_prefix='/api/patient')

@patient_bp.route('/appointments', methods=['GET'])
@role_required('PATIENT')
def get_patient_appointments():
    patient_id = get_jwt_identity()
    now = datetime.utcnow()

    # Fetch all appointments for patient
    appts = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.start_time.asc()).all()

    upcoming = []
    past = []

    for appt in appts:
        appt_data = appt.to_dict()
        if appt.status == 'CONFIRMED' and appt.start_time >= now:
            upcoming.append(appt_data)
        else:
            past.append(appt_data)

    # Sort upcoming ascending, past descending
    past.sort(key=lambda x: x['start_time'], reverse=True)

    return jsonify({
        "upcoming": upcoming,
        "past": past,
        "next_appointment": upcoming[0] if upcoming else None
    }), 200

@patient_bp.route('/prescriptions', methods=['GET'])
@role_required('PATIENT')
def get_patient_prescriptions():
    patient_id = get_jwt_identity()
    prescriptions = Prescription.query.filter_by(patient_id=patient_id).order_by(Prescription.created_at.desc()).all()
    return jsonify({
        "prescriptions": [p.to_dict() for p in prescriptions]
    }), 200

@patient_bp.route('/profile', methods=['GET', 'PUT'])
@role_required('PATIENT')
def patient_profile():
    patient_id = get_jwt_identity()
    user = User.query.get(patient_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    if request.method == 'GET':
        return jsonify({"user": user.to_dict()}), 200

    data = request.get_json() or {}
    name = data.get('name')
    phone = data.get('phone')

    if name:
        user.name = name.strip()
    if phone is not None:
        user.phone = phone.strip() if phone else None

    db.session.commit()
    return jsonify({"message": "Profile updated successfully.", "user": user.to_dict()}), 200

@patient_bp.route('/feedback', methods=['POST'])
@role_required('PATIENT')
def submit_feedback():
    patient_id = get_jwt_identity()
    data = request.get_json() or {}
    appointment_id = data.get('appointment_id')
    rating = data.get('rating')
    comment = data.get('comment')

    if not appointment_id or not rating or not (1 <= int(rating) <= 5):
        return jsonify({"error": "Valid appointment_id and rating (1-5) are required."}), 400

    appointment = Appointment.query.filter_by(id=appointment_id, patient_id=patient_id).first()
    if not appointment or appointment.status != 'COMPLETED':
        return jsonify({"error": "Feedback can only be submitted for completed appointments."}), 400

    existing = Feedback.query.filter_by(appointment_id=appointment_id).first()
    if existing:
        return jsonify({"error": "Feedback has already been submitted for this appointment."}), 400

    fb = Feedback(
        appointment_id=appointment_id,
        patient_id=patient_id,
        doctor_id=appointment.doctor_id,
        rating=int(rating),
        comment=comment.strip() if comment else None
    )
    db.session.add(fb)
    db.session.commit()

    return jsonify({"message": "Feedback submitted successfully.", "feedback": fb.to_dict()}), 201
