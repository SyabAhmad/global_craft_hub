from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import bcrypt
import uuid

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
    """Decorator to check user roles"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Get user role from database - for now just use a placeholder
            user_role = "customer"  # Placeholder, replace with actual DB lookup
            
            if user_role not in roles:
                return jsonify({
                    "success": False, 
                    "message": f"Access denied. Role '{user_role}' not authorized."
                }), 403
                
            return fn(*args, **kwargs)
        return decorator
    return wrapper