from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.user import User

def role_required(allowed_roles):
    """
    Decorator to enforce Role-Based Access Control (RBAC).
    allowed_roles can be a single role string (e.g. 'ADMIN') or a list/tuple of roles.
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({"error": "User not found or unauthenticated"}), 401
            
            if user.role not in allowed_roles:
                return jsonify({"error": f"Access forbidden. Requires one of roles: {allowed_roles}"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
