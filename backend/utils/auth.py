from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import bcrypt
import uuid
from database.db import get_cursor

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def check_password(password, hashed_password):
    """Check if password matches hashed password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_uuid():
    """Generate a UUID"""
    return str(uuid.uuid4())

def role_required(*roles):
    """Decorator to check user roles against DB. Admin overrides unless explicitly excluded."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()

            try:
                with get_cursor() as cursor:
                    cursor.execute("SELECT role FROM users WHERE user_id = %s AND is_active = TRUE", (user_id,))
                    row = cursor.fetchone()
                    if not row:
                        return jsonify({"success": False, "message": "User not found or inactive"}), 401
                    user_role = row["role"]
            except Exception:
                return jsonify({"success": False, "message": "Authorization lookup failed"}), 500

            # If 'admin' exists, allow unless roles explicitly restrict and 'admin' not included
            if roles and user_role not in roles:
                # allow admin as superuser by default
                if user_role != 'admin':
                    return jsonify({
                        "success": False,
                        "message": f"Access denied. Role '{user_role}' not authorized."
                    }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper