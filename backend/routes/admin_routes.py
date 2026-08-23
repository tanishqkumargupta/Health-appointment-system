from datetime import datetime
from flask import Blueprint, request, jsonify
from utils.decorators import role_required
from models.user import Doctor, User
from models.specialization import Specialization, PatientIssueCategory
from models.schedule import LeaveRequest, ScheduleRequest
from models.appointment import Appointment
from services.doctor_service import create_doctor, update_doctor, set_doctor_active_status
from services.leave_service import approve_leave_request, reject_leave_request
from services.schedule_service import approve_schedule_request, reject_schedule_request

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/metrics', methods=['GET'])
@role_required('ADMIN')
def get_metrics():
    total_doctors = Doctor.query.count()
    active_doctors = Doctor.query.filter_by(is_active=True).count()
    
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    
    today_appointments = Appointment.query.filter(
        Appointment.start_time >= start_of_day,
        Appointment.start_time <= end_of_day,
        Appointment.status != 'CANCELLED'
    ).count()

    pending_leaves = LeaveRequest.query.filter_by(status='PENDING').count()
    pending_schedules = ScheduleRequest.query.filter_by(status='PENDING').count()

    return jsonify({
        "total_doctors": total_doctors,
        "active_doctors": active_doctors,
        "today_appointments": today_appointments,
        "pending_leave_requests": pending_leaves,
        "pending_schedule_requests": pending_schedules
    }), 200

@admin_bp.route('/doctors', methods=['GET', 'POST'])
@role_required('ADMIN')
def doctors_management():
    if request.method == 'GET':
        doctors = Doctor.query.all()
        return jsonify({"doctors": [d.to_dict() for d in doctors]}), 200

    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    specialization_id = data.get('specialization_id')
    start_time = data.get('start_time', '09:00')
    end_time = data.get('end_time', '17:00')
    slot_duration = data.get('slot_duration', 30)

    if not name or not email or not password or not specialization_id:
        return jsonify({"error": "Name, email, password, and specialization_id are required."}), 400

    try:
        doctor = create_doctor(
            name=name,
            email=email,
            password=password,
            phone=phone,
            specialization_id=specialization_id,
            start_time_str=start_time,
            end_time_str=end_time,
            slot_duration=slot_duration
        )
        return jsonify({"message": "Doctor created successfully.", "doctor": doctor.to_dict()}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/doctors/<int:doctor_id>', methods=['PUT'])
@role_required('ADMIN')
def edit_doctor(doctor_id):
    data = request.get_json() or {}
    try:
        doctor = update_doctor(
            doctor_id=doctor_id,
            name=data.get('name'),
            phone=data.get('phone'),
            specialization_id=data.get('specialization_id'),
            start_time_str=data.get('start_time'),
            end_time_str=data.get('end_time'),
            slot_duration=data.get('slot_duration')
        )
        return jsonify({"message": "Doctor updated successfully.", "doctor": doctor.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/doctors/<int:doctor_id>/status', methods=['PATCH'])
@role_required('ADMIN')
def toggle_doctor_status(doctor_id):
    data = request.get_json() or {}
    is_active = data.get('is_active')
    if is_active is None:
        return jsonify({"error": "is_active boolean field is required."}), 400

    try:
        doctor = set_doctor_active_status(doctor_id, is_active)
        return jsonify({"message": f"Doctor status updated to {'Active' if is_active else 'Inactive'}.", "doctor": doctor.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/leave-requests', methods=['GET'])
@role_required('ADMIN')
def get_leave_requests():
    requests = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
    return jsonify({"leave_requests": [r.to_dict() for r in requests]}), 200

@admin_bp.route('/leave-requests/<int:request_id>/approve', methods=['POST'])
@role_required('ADMIN')
def approve_leave(request_id):
    try:
        req = approve_leave_request(request_id)
        return jsonify({"message": "Leave request approved.", "leave_request": req.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/leave-requests/<int:request_id>/reject', methods=['POST'])
@role_required('ADMIN')
def reject_leave(request_id):
    try:
        req = reject_leave_request(request_id)
        return jsonify({"message": "Leave request rejected.", "leave_request": req.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/schedule-requests', methods=['GET'])
@role_required('ADMIN')
def get_schedule_requests():
    requests = ScheduleRequest.query.order_by(ScheduleRequest.created_at.desc()).all()
    return jsonify({"schedule_requests": [r.to_dict() for r in requests]}), 200

@admin_bp.route('/schedule-requests/<int:request_id>/approve', methods=['POST'])
@role_required('ADMIN')
def approve_schedule(request_id):
    try:
        req = approve_schedule_request(request_id)
        return jsonify({"message": "Schedule request approved.", "schedule_request": req.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/schedule-requests/<int:request_id>/reject', methods=['POST'])
@role_required('ADMIN')
def reject_schedule(request_id):
    try:
        req = reject_schedule_request(request_id)
        return jsonify({"message": "Schedule request rejected.", "schedule_request": req.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route('/specializations', methods=['GET'])
@role_required('ADMIN')
def get_specializations():
    specs = Specialization.query.all()
    return jsonify({"specializations": [s.to_dict() for s in specs]}), 200
