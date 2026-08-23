from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from utils.decorators import role_required
from models.user import Doctor, User
from models.appointment import Appointment
from models.schedule import LeaveRequest, ScheduleRequest
from services.slot_service import get_available_slots
from services.consultation_service import complete_consultation
from services.leave_service import request_leave
from services.schedule_service import request_schedule_change

doctor_bp = Blueprint('doctor', __name__, url_prefix='/api/doctor')

@doctor_bp.route('/appointments', methods=['GET'])
@role_required('DOCTOR')
def get_doctor_appointments():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({"error": "Doctor profile not found."}), 404

    target_date_str = request.args.get('date', datetime.utcnow().strftime("%Y-%m-%d"))
    try:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())

    appts = Appointment.query.filter(
        Appointment.doctor_id == doctor.id,
        Appointment.start_time >= start_of_day,
        Appointment.start_time <= end_of_day,
        Appointment.status != 'CANCELLED'
    ).order_by(Appointment.start_time.asc()).all()

    # Also fetch slots layout
    slots = get_available_slots(doctor.id, target_date_str)

    return jsonify({
        "date": target_date_str,
        "appointments": [a.to_dict() for a in appts],
        "slots": slots
    }), 200

@doctor_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@role_required('DOCTOR')
def get_appointment_details(appointment_id):
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({"error": "Doctor profile not found."}), 404

    appt = Appointment.query.filter_by(id=appointment_id, doctor_id=doctor.id).first()
    if not appt:
        return jsonify({"error": "Appointment not found or unauthorized."}), 404

    return jsonify({"appointment": appt.to_dict()}), 200

@doctor_bp.route('/appointments/<int:appointment_id>/consultation', methods=['POST'])
@role_required('DOCTOR')
def submit_consultation(appointment_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    diagnosis = data.get('diagnosis')
    clinical_notes = data.get('clinical_notes')
    prescription_items = data.get('prescription_items', [])

    if not diagnosis:
        return jsonify({"error": "Diagnosis is required."}), 400

    if not prescription_items or not isinstance(prescription_items, list):
        return jsonify({"error": "Prescription items must be a non-empty list."}), 400

    try:
        consultation = complete_consultation(
            doctor_user_id=user_id,
            appointment_id=appointment_id,
            diagnosis=diagnosis,
            clinical_notes=clinical_notes,
            prescription_items_data=prescription_items
        )
        return jsonify({
            "message": "Consultation and prescription saved successfully.",
            "consultation": consultation.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@doctor_bp.route('/leave-request', methods=['POST', 'GET'])
@role_required('DOCTOR')
def leave_requests():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({"error": "Doctor profile not found."}), 404

    if request.method == 'GET':
        requests = LeaveRequest.query.filter_by(doctor_id=doctor.id).order_by(LeaveRequest.created_at.desc()).all()
        return jsonify({"leave_requests": [r.to_dict() for r in requests]}), 200

    data = request.get_json() or {}
    leave_date = data.get('leave_date')
    reason = data.get('reason')

    if not leave_date:
        return jsonify({"error": "leave_date (YYYY-MM-DD) is required."}), 400

    try:
        req = request_leave(user_id, leave_date, reason)
        return jsonify({"message": "Leave request submitted.", "leave_request": req.to_dict()}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@doctor_bp.route('/schedule-request', methods=['POST', 'GET'])
@role_required('DOCTOR')
def schedule_requests():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({"error": "Doctor profile not found."}), 404

    if request.method == 'GET':
        requests = ScheduleRequest.query.filter_by(doctor_id=doctor.id).order_by(ScheduleRequest.created_at.desc()).all()
        return jsonify({"schedule_requests": [r.to_dict() for r in requests]}), 200

    data = request.get_json() or {}
    start_time = data.get('requested_start_time')
    end_time = data.get('requested_end_time')
    slot_duration = data.get('requested_slot_duration', 30)
    reason = data.get('reason')

    if not start_time or not end_time:
        return jsonify({"error": "requested_start_time and requested_end_time are required."}), 400

    try:
        req = request_schedule_change(user_id, start_time, end_time, slot_duration, reason)
        return jsonify({"message": "Schedule request submitted.", "schedule_request": req.to_dict()}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@doctor_bp.route('/pre-shift-summary', methods=['GET'])
@role_required('DOCTOR')
def get_pre_shift_summary():
    """
    Rule 22: Pre-shift Doctor Summary endpoint.
    Aggregates today's upcoming appointments for the doctor shift.
    """
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=user_id).first()
    if not doctor:
        return jsonify({"error": "Doctor profile not found."}), 404

    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    appts = Appointment.query.filter(
        Appointment.doctor_id == doctor.id,
        Appointment.start_time >= start_of_day,
        Appointment.start_time <= end_of_day,
        Appointment.status == 'CONFIRMED'
    ).order_by(Appointment.start_time.asc()).all()

    summary_items = []
    for a in appts:
        summary_items.append({
            "appointment_id": a.id,
            "patient_name": a.patient.name,
            "start_time": a.start_time.strftime("%I:%M %p"),
            "problem_category": a.symptom.problem_category if a.symptom else "General",
            "symptoms": a.symptom.symptom_text if a.symptom else "",
            "urgency": a.pre_visit_summary.urgency if a.pre_visit_summary else "Medium",
            "chief_complaint": a.pre_visit_summary.chief_complaint if a.pre_visit_summary else "",
            "suggested_questions": a.pre_visit_summary.suggested_questions if a.pre_visit_summary else []
        })

    return jsonify({
        "date": today.strftime("%Y-%m-%d"),
        "total_appointments": len(summary_items),
        "shift_summary": summary_items
    }), 200
