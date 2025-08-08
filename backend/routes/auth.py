from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database.db import get_cursor, get_db
from utils.auth import hash_password
from models.user import User
import json
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register/customer', methods=['POST'])
def register_customer():
    """Register a new customer account"""
    data = request.json
    
    # Validate required fields
    required_fields = ['email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # Check if user already exists
    existing_user = User.get_by_email(data['email'])
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'User with this email already exists'
        }), 409
    
    # Create user with customer role
    try:
        user_data = {
            'email': data['email'],
            'password': data['password'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'phone': data.get('phone'),
            'address': data.get('address'),
            'city': data.get('city'),
            'role': 'customer'
        }
        
        user_id = User.create(user_data)
        
        # Generate JWT token
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'message': 'Customer account registered successfully',
            'token': access_token,
            'user': {
                'user_id': user_id,
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': 'customer'
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Registration failed',
            'error': str(e)
        }), 500

@auth_bp.route('/register/supplier', methods=['POST'])
def register_supplier():
    db = None
    try:
        data = request.json
        
        print(f"DEBUG: Supplier registration data: {data}")
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'password', 'business_name', 'business_address', 'business_phone']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Get database connection for manual transaction control
        db = get_db()
        
        # Start transaction explicitly
        db.autocommit = False
        
        cursor = db.cursor()
        
        try:
            # Check if email already exists
            cursor.execute("SELECT email FROM users WHERE email = %s", (data['email'],))
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Email already registered'
                }), 409
            
            # Generate IDs
            user_id = str(uuid.uuid4())
            supplier_id = str(uuid.uuid4())
            store_id = str(uuid.uuid4())
            
            print(f"DEBUG: Generated IDs - user_id: {user_id}, supplier_id: {supplier_id}, store_id: {store_id}")
            
            # Create user account (using correct column name: date_joined)
            cursor.execute("""
                INSERT INTO users (
                    user_id, email, password_hash, first_name, last_name, role, is_active, date_joined
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                user_id,
                data['email'],
                hash_password(data['password']),
                data['first_name'],
                data['last_name'],
                'supplier',
                True
            ))
            
            print(f"DEBUG: User insert affected {cursor.rowcount} rows")
            
            # Create supplier profile (using correct column name: date_registered)
            cursor.execute("""
                INSERT INTO suppliers (
                    supplier_id, user_id, business_name, business_address, business_phone, is_verified, date_registered
                ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (
                supplier_id,
                user_id,
                data['business_name'],
                data['business_address'],
                data['business_phone'],
                False
            ))
            
            print(f"DEBUG: Supplier insert affected {cursor.rowcount} rows")
            
            # Create store automatically (using correct column name: date_created)
            opening_hours_data = {
                "Monday": "9:00 AM - 6:00 PM",
                "Tuesday": "9:00 AM - 6:00 PM",
                "Wednesday": "9:00 AM - 6:00 PM",
                "Thursday": "9:00 AM - 6:00 PM",
                "Friday": "9:00 AM - 6:00 PM",
                "Saturday": "10:00 AM - 4:00 PM",
                "Sunday": "Closed"
            }
            
            cursor.execute("""
                INSERT INTO stores (
                    store_id, owner_id, name, description, address, city,
                    phone, opening_hours, is_active, date_created
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                store_id,
                user_id,
                data['business_name'],
                data.get('store_description', f"Welcome to {data['business_name']}! We offer fresh, delicious baked goods made with love."),
                data['business_address'],
                data.get('city', 'Not specified'),
                data['business_phone'],
                json.dumps(opening_hours_data),
                True
            ))
            
            print(f"DEBUG: Store insert affected {cursor.rowcount} rows")
            
            # Commit the transaction
            db.commit()
            print("DEBUG: Transaction committed successfully")
            
            # Now verify the records with fresh queries
            cursor.execute("SELECT user_id, email, role FROM users WHERE user_id = %s", (user_id,))
            created_user = cursor.fetchone()
            print(f"DEBUG: Post-commit user verification: {created_user}")
            
            cursor.execute("SELECT supplier_id, user_id, business_name FROM suppliers WHERE user_id = %s", (user_id,))
            created_supplier = cursor.fetchone()
            print(f"DEBUG: Post-commit supplier verification: {created_supplier}")
            
            cursor.execute("SELECT store_id, owner_id, name FROM stores WHERE owner_id = %s", (user_id,))
            created_store = cursor.fetchone()
            print(f"DEBUG: Post-commit store verification: {created_store}")
            
            # Close cursor
            cursor.close()
            
            # Generate JWT token
            access_token = create_access_token(identity=user_id)
            
            return jsonify({
                'success': True,
                'message': 'Supplier account and store created successfully!',
                'access_token': access_token,
                'user': {
                    'user_id': user_id,
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'supplier',
                    'business_name': data['business_name'],
                    'is_verified': False
                },
                'store': {
                    'store_id': store_id,
                    'name': data['business_name'],
                    'is_active': True
                }
            }), 201
            
        except Exception as e:
            # Rollback on error
            db.rollback()
            cursor.close()
            print(f"Error in supplier registration transaction: {e}")
            import traceback
            traceback.print_exc()
            raise e
            
    except Exception as e:
        print(f"Error in register_supplier: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500
    finally:
        # Clean up connection
        if db:
            try:
                db.close()
            except:
                pass

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user (customer or supplier)"""
    data = request.json
    
    print(f"DEBUG: Login attempt for email: {data.get('email')}")
    
    # Validate required fields
    if 'email' not in data or 'password' not in data:
        return jsonify({
            'success': False,
            'message': 'Email and password are required'
        }), 400
    
    # Check if user exists
    with get_cursor() as cursor:
        sql = """
            SELECT user_id, email, first_name, last_name, password_hash, 
                   role, loyalty_points, is_active
            FROM users
            WHERE email = %s
        """
        cursor.execute(sql, (data['email'],))
        user = cursor.fetchone()
        print(f"DEBUG: User found in login: {user}")
    
    if not user:
        print("DEBUG: User not found")
        return jsonify({
            'success': False,
            'message': 'Invalid email or password'
        }), 401
    
    # Check if account is active
    if not user['is_active']:
        print("DEBUG: User account is not active")
        return jsonify({
            'success': False,
            'message': 'Account is deactivated'
        }), 401
    
    # Verify password
    from utils.auth import check_password
    
    password_valid = check_password(data['password'], user['password_hash'])
    print(f"DEBUG: Password validation result: {password_valid}")
    
    if not password_valid:
        print("DEBUG: Password validation failed")
        return jsonify({
            'success': False,
            'message': 'Invalid email or password'
        }), 401
    
    # Update last login
    db = get_db()
    with get_cursor() as cursor:
        sql = "UPDATE users SET last_login = NOW() WHERE user_id = %s"
        cursor.execute(sql, (user['user_id'],))
    db.commit()
    
    # Generate JWT token
    access_token = create_access_token(identity=user['user_id'])
    
    # Build response
    response_data = {
        'success': True,
        'message': 'Login successful',
        'token': access_token,
        'user': {
            'user_id': user['user_id'],
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'role': user['role'],
            'loyalty_points': user['loyalty_points'] if user['role'] == 'customer' else None
        }
    }
    
    # If user is a supplier, add business info
    if user['role'] == 'supplier':
        with get_cursor() as cursor:
            sql = """
                SELECT business_name, is_verified
                FROM suppliers
                WHERE user_id = %s
            """
            cursor.execute(sql, (user['user_id'],))
            supplier = cursor.fetchone()
            
        if supplier:
            response_data['user']['business_name'] = supplier['business_name']
            response_data['user']['is_verified'] = supplier['is_verified']
    
    print(f"DEBUG: Login successful for user: {user['user_id']}")
    return jsonify(response_data), 200

@auth_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify JWT token and return user details"""
    user_id = get_jwt_identity()
    
    # Get user details
    with get_cursor() as cursor:
        sql = """
            SELECT user_id, email, first_name, last_name, role, loyalty_points
            FROM users
            WHERE user_id = %s AND is_active = TRUE
        """
        cursor.execute(sql, (user_id,))
        user = cursor.fetchone()
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired token'
        }), 401
    
    # Build response
    response_data = {
        'success': True,
        'isAuthenticated': True,
        'user': {
            'user_id': user['user_id'],
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'role': user['role'],
            'loyalty_points': user['loyalty_points'] if user['role'] == 'customer' else None
        }
    }
    
    # If user is a supplier, add business info
    if user['role'] == 'supplier':
        with get_cursor() as cursor:
            sql = """
                SELECT business_name, is_verified
                FROM suppliers
                WHERE user_id = %s
            """
            cursor.execute(sql, (user['user_id'],))
            supplier = cursor.fetchone()
            
        if supplier:
            response_data['user']['business_name'] = supplier['business_name']
            response_data['user']['is_verified'] = supplier['is_verified']
    
    return jsonify(response_data), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset token to user's email"""
    data = request.json
    
    if 'email' not in data:
        return jsonify({
            'success': False,
            'message': 'Email is required'
        }), 400
    
    # Check if user exists
    user = User.get_by_email(data['email'])
    if not user:
        # Don't reveal if email exists for security reasons
        return jsonify({
            'success': True,
            'message': 'If your email is registered, you will receive a password reset link'
        }), 200
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    
    # Store token in database with expiration
    User.set_reset_token(user['user_id'], reset_token)
    
    # TODO: Send email with reset token
    # For now, just return the token in response (for development)
    
    return jsonify({
        'success': True,
        'message': 'If your email is registered, you will receive a password reset link',
        'dev_token': reset_token  # Remove in production
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    data = request.json
    
    if 'token' not in data or 'password' not in data:
        return jsonify({
            'success': False,
            'message': 'Token and new password are required'
        }), 400
    
    # Validate token and get user
    user = User.get_by_reset_token(data['token'])
    if not user:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired token'
        }), 400
    
    # Update password
    User.update_password(user['user_id'], data['password'])
    
    # Clear reset token
    User.clear_reset_token(user['user_id'])
    
    return jsonify({
        'success': True,
        'message': 'Password has been reset successfully'
    }), 200

# Debug endpoint to check if user exists
@auth_bp.route('/debug/check-user/<email>', methods=['GET'])
def debug_check_user(email):
    """Debug endpoint to check if user exists"""
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT user_id, email, role, is_active FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if user:
                return jsonify({
                    'success': True,
                    'user_exists': True,
                    'user': {
                        'user_id': user['user_id'],
                        'email': user['email'],
                        'role': user['role'],
                        'is_active': user['is_active']
                    }
                })
            else:
                return jsonify({
                    'success': True,
                    'user_exists': False,
                    'user': None
                })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })