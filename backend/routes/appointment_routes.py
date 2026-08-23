from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import role_required
from models.specialization import PatientIssueCategory, Specialization
from models.user import Doctor, User
from models.appointment import Appointment
from services.slot_service import get_available_slots
from services.booking_service import hold_appointment_slot, confirm_appointment_booking, cancel_appointment

appointment_bp = Blueprint('appointment', __name__, url_prefix='/api/appointments')

@appointment_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Returns deterministic problem category options & mapping.
    """
    categories = PatientIssueCategory.query.all()
    return jsonify({
        "categories": [c.to_dict() for c in categories]
    }), 200

@appointment_bp.route('/doctors', methods=['GET'])
def get_doctors_by_category():
    """
    Given category_name (e.g. 'Skin'), returns active doctors under mapped specialization.
    Rule 9: Only ACTIVE doctors appear for new bookings.
    """
    category_name = request.args.get('category')
    specialization_id = request.args.get('specialization_id')

    if category_name:
        cat = PatientIssueCategory.query.filter_by(category_name=category_name).first()
        if not cat:
            return jsonify({"error": f"Invalid problem category '{category_name}'"}), 400
        specialization_id = cat.specialization_id

    if not specialization_id:
        doctors = Doctor.query.filter_by(is_active=True).all()
    else:
        doctors = Doctor.query.filter_by(specialization_id=specialization_id, is_active=True).all()

    return jsonify({
        "doctors": [d.to_dict() for d in doctors]
    }), 200

@appointment_bp.route('/doctors/<int:doctor_id>/slots', methods=['GET'])
def get_doctor_slots(doctor_id):
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"error": "Date parameter (YYYY-MM-DD) is required."}), 400

    try:
        slots = get_available_slots(doctor_id, date_str)
        return jsonify({
            "doctor_id": doctor_id,
            "date": date_str,
            "slots": slots
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@appointment_bp.route('/hold', methods=['POST'])
@role_required('PATIENT')
def hold_slot():
    patient_id = get_jwt_identity()
    data = request.get_json() or {}
    doctor_id = data.get('doctor_id')
    start_time = data.get('start_time')
    problem_category = data.get('problem_category')
    symptom_text = data.get('symptom_text')

    if not doctor_id or not start_time or not problem_category or not symptom_text:
        return jsonify({"error": "doctor_id, start_time, problem_category, and symptom_text are required."}), 400

    try:
        appt = hold_appointment_slot(
            patient_id=patient_id,
            doctor_id=doctor_id,
            start_time_iso=start_time,
            problem_category=problem_category,
            symptom_text=symptom_text
        )
        return jsonify({
            "message": "Slot held for 5 minutes.",
            "appointment": appt.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409

@appointment_bp.route('/confirm', methods=['POST'])
@role_required('PATIENT')
def confirm_booking():
    patient_id = get_jwt_identity()
    data = request.get_json() or {}
    appointment_id = data.get('appointment_id')

    if not appointment_id:
        return jsonify({"error": "appointment_id is required."}), 400

    try:
        appt = confirm_appointment_booking(appointment_id, patient_id)
        return jsonify({
            "message": "Appointment booked successfully!",
            "appointment": appt.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@appointment_bp.route('/<int:appointment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_appt(appointment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    try:
        appt = cancel_appointment(appointment_id, user_id, user.role)
        return jsonify({
            "message": "Appointment cancelled successfully.",
            "appointment": appt.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
