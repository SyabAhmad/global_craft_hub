from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from utils.auth import role_required
from database.db import get_cursor

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get the current user's profile"""
    user_id = get_jwt_identity()
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    # Build response with user data
    response_data = {
        'user_id': user['user_id'],
        'email': user['email'],
        'first_name': user['first_name'],
        'last_name': user['last_name'],
        'phone': user['phone'],
        'address': user['address'],
        'city': user['city'],
        'role': user['role'],
        'loyalty_points': user['loyalty_points'],
        'date_joined': user['date_joined'],
        'last_login': user['last_login'],
        'is_active': user['is_active']
    }
    
    # If user is a supplier, get supplier-specific data
    if user['role'] == 'supplier':
        with get_cursor() as cursor:
            sql = """
                SELECT business_name, business_address, business_phone, 
                       tax_id, is_verified
                FROM suppliers 
                WHERE user_id = %s
            """
            cursor.execute(sql, (user_id,))
            supplier = cursor.fetchone()
            
            if supplier:
                response_data.update({
                    'business_name': supplier['business_name'],
                    'business_address': supplier['business_address'],
                    'business_phone': supplier['business_phone'],
                    'tax_id': supplier['tax_id'],
                    'is_verified': supplier['is_verified']
                })
    
    return jsonify({
        'success': True,
        'user': response_data
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the current user's profile"""
    user_id = get_jwt_identity()
    data = request.json
    
    # Only allow updating specific fields
    allowed_fields = ['first_name', 'last_name', 'phone', 'address', 'city', 'password']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        return jsonify({
            'success': False,
            'message': 'No valid fields to update'
        }), 400
    
    success = User.update(user_id, update_data)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to update profile'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully'
    }), 200

@users_bp.route('/deactivate', methods=['DELETE'])
@jwt_required()
def deactivate_account():
    """Deactivate the current user's account"""
    user_id = get_jwt_identity()
    
    success = User.deactivate(user_id)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to deactivate account'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Account deactivated successfully'
    }), 200

# Admin routes
@users_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_all_users():
    """Get all users (admin only)"""
    # Implement pagination
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    # TODO: Implement get_all method in User model
    # users, total = User.get_all(page, limit)
    
    return jsonify({
        'success': True,
        'message': 'Admin only endpoint - Get all users'
        # 'users': users,
        # 'pagination': {
        #     'total': total,
        #     'page': page,
        #     'limit': limit,
        #     'pages': (total + limit - 1) // limit
        # }
    }), 200