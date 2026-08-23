from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.auth_service import register_patient, login_user
from models.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    try:
        user, token = register_patient(name, email, phone, password)
        return jsonify({
            "message": "Registration successful.",
            "access_token": token,
            "user": user.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        user, token = login_user(email, password)
        user_dict = user.to_dict()
        if user.role == 'DOCTOR' and user.doctor_profile:
            user_dict['doctor_id'] = user.doctor_profile.id
            user_dict['specialization_id'] = user.doctor_profile.specialization_id
            user_dict['is_active'] = user.doctor_profile.is_active

        return jsonify({
            "message": "Login successful.",
            "access_token": token,
            "user": user_dict
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    user_dict = user.to_dict()
    if user.role == 'DOCTOR' and user.doctor_profile:
        user_dict['doctor_id'] = user.doctor_profile.id
        user_dict['specialization_id'] = user.doctor_profile.specialization_id
        user_dict['is_active'] = user.doctor_profile.is_active

    return jsonify({"user": user_dict}), 200
