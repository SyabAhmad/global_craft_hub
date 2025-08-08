from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from database.db import get_cursor, get_db
import uuid
from datetime import datetime
import json

stores_bp = Blueprint('stores', __name__)

@stores_bp.route('', methods=['POST'], strict_slashes=False)
@stores_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_store():
    """Create a new store for a supplier"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        print(f"DEBUG: Creating store for user_id: {user_id}")
        print(f"DEBUG: Store data received: {data}")
        
        # Validate required fields
        required_fields = ['name', 'description', 'address', 'city', 'phone']
        for field in required_fields:
            if field not in data or not data[field] or not str(data[field]).strip():
                return jsonify({
                    'success': False,
                    'message': f'Missing or empty required field: {field}'
                }), 400
        
        # Use the context manager but handle the database connection manually for transaction control
        db = get_db()
        
        with get_cursor() as cursor:
            # Check if user is a supplier
            cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            print(f"DEBUG: User found: {user}")
            
            if not user or user['role'] != 'supplier':  # This works with RealDictRow
                return jsonify({
                    'success': False,
                    'message': 'Only suppliers can create stores'
                }), 403
            
            # Check if supplier already has a store
            cursor.execute("SELECT store_id FROM stores WHERE owner_id = %s", (user_id,))
            existing_store = cursor.fetchone()
            print(f"DEBUG: Existing store: {existing_store}")
            
            if existing_store:
                return jsonify({
                    'success': False,
                    'message': 'You already have a store. Please update your existing store instead.'
                }), 409
            
            # Create store - using correct column names from schema
            store_id = str(uuid.uuid4())
            print(f"DEBUG: Generated store_id: {store_id}")
            
            # Prepare opening hours as JSON (matching schema JSONB field)
            opening_hours_data = {
                "general": data.get('operating_hours', '').strip()
            }
            if not opening_hours_data["general"]:
                opening_hours_data = {
                    "Monday": "9:00 AM - 6:00 PM",
                    "Tuesday": "9:00 AM - 6:00 PM", 
                    "Wednesday": "9:00 AM - 6:00 PM",
                    "Thursday": "9:00 AM - 6:00 PM",
                    "Friday": "9:00 AM - 6:00 PM",
                    "Saturday": "10:00 AM - 4:00 PM",
                    "Sunday": "Closed"
                }

            # Prepare values - using actual schema column names
            sql = """
                INSERT INTO stores (
                    store_id, owner_id, name, description, address, city, 
                    phone, email, logo_url, hero_image_url, opening_hours, is_active
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            values = (
                store_id,
                user_id,
                data['name'].strip(),
                data['description'].strip(),
                data['address'].strip(),
                data['city'].strip(),
                data['phone'].strip(),
                data.get('email', '').strip() if data.get('email') else None,
                data.get('logo_url', '').strip() if data.get('logo_url') else None,
                data.get('banner_url', '').strip() if data.get('banner_url') else None,
                json.dumps(opening_hours_data),
                data.get('is_active', True)
            )
            
            print(f"DEBUG: SQL: {sql}")
            print(f"DEBUG: Values: {values}")
            
            # Execute the insert
            cursor.execute(sql, values)
            print(f"DEBUG: Insert executed, affected rows: {cursor.rowcount}")
            
            # Verify the store was created BEFORE committing
            cursor.execute("SELECT store_id, name, description, is_active, owner_id FROM stores WHERE store_id = %s", (store_id,))
            created_store = cursor.fetchone()
            print(f"DEBUG: Verification BEFORE commit - Created store: {created_store}")
            
            # Check all stores for this user BEFORE committing
            cursor.execute("SELECT store_id, name, owner_id FROM stores WHERE owner_id = %s", (user_id,))
            all_user_stores_before = cursor.fetchall()
            print(f"DEBUG: All stores for user BEFORE commit: {all_user_stores_before}")
            
        # Commit the transaction after the cursor context is closed
        db.commit()
        print("DEBUG: Transaction committed")
        
        # Verify again AFTER committing with a fresh cursor
        with get_cursor() as cursor:
            cursor.execute("SELECT store_id, name, description, is_active, owner_id FROM stores WHERE store_id = %s", (store_id,))
            created_store_after = cursor.fetchone()
            print(f"DEBUG: Verification AFTER commit - Created store: {created_store_after}")
            
            # Check all stores for this user AFTER committing
            cursor.execute("SELECT store_id, name, owner_id FROM stores WHERE owner_id = %s", (user_id,))
            all_user_stores_after = cursor.fetchall()
            print(f"DEBUG: All stores for user AFTER commit: {all_user_stores_after}")
            
            # Check total stores in database
            cursor.execute("SELECT COUNT(*) as total FROM stores")
            total_stores = cursor.fetchone()
            print(f"DEBUG: Total stores in database: {total_stores}")
            
            # List all stores with their owners
            cursor.execute("SELECT store_id, name, owner_id FROM stores")
            all_stores_debug = cursor.fetchall()
            print(f"DEBUG: All stores in database: {all_stores_debug}")
        
        if created_store_after:
            return jsonify({
                'success': True,
                'message': 'Store created successfully',
                'store': {
                    'store_id': created_store_after['store_id'],
                    'name': created_store_after['name'],
                    'description': created_store_after['description'],
                    'is_active': created_store_after['is_active']
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': 'Store creation failed - could not verify creation after commit'
            }), 500
                
    except Exception as e:
        print(f"ERROR: Exception in create_store: {e}")
        print(f"ERROR: Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        
        # Rollback the transaction if an error occurred
        try:
            db.rollback()
            print("DEBUG: Transaction rolled back due to error")
        except:
            pass
            
        return jsonify({
            'success': False,
            'message': f'Error creating store: {str(e)}'
        }), 500

@stores_bp.route('/check', methods=['GET'])
@jwt_required()
def check_store():
    """Check if the current supplier has a store"""
    try:
        user_id = get_jwt_identity()
        print(f"DEBUG: Checking store for user_id: {user_id}")
        
        with get_cursor() as cursor:
            # Check if user is a supplier
            cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            print(f"DEBUG: User in check_store: {user}")
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            if user['role'] != 'supplier':
                return jsonify({
                    'success': False,
                    'message': 'Not a supplier account'
                }), 403
            
            # Check if supplier has a store with more detailed debugging
            cursor.execute("SELECT store_id, name, owner_id FROM stores WHERE owner_id = %s", (user_id,))
            store = cursor.fetchone()
            print(f"DEBUG: Store found in check: {store}")
            
            # Also count all stores for this user
            cursor.execute("SELECT COUNT(*) as count FROM stores WHERE owner_id = %s", (user_id,))
            store_count = cursor.fetchone()
            print(f"DEBUG: Store count for user in check: {store_count}")
            
            # List all stores in the database for debugging
            cursor.execute("SELECT store_id, name, owner_id FROM stores ORDER BY date_created DESC LIMIT 10")
            all_stores = cursor.fetchall()
            print(f"DEBUG: All stores in database (most recent 10): {all_stores}")
            
            # Check the specific user ID format
            print(f"DEBUG: Searching for owner_id: '{user_id}' (length: {len(user_id)})")
            
            # Try a different query to see if there are any case sensitivity issues
            cursor.execute("SELECT store_id, name, owner_id FROM stores WHERE LOWER(owner_id) = LOWER(%s)", (user_id,))
            store_case_insensitive = cursor.fetchone()
            print(f"DEBUG: Store found with case-insensitive search: {store_case_insensitive}")
        
        store_data = None
        if store:
            store_data = {
                'store_id': store['store_id'],
                'name': store['name']
            }
        
        return jsonify({
            'success': True,
            'hasStore': store is not None,
            'store': store_data
        }), 200
        
    except Exception as e:
        print(f"Error checking store: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error checking store: {str(e)}'
        }), 500

# Add a debugging endpoint to see all stores
@stores_bp.route('/debug/all', methods=['GET'])
@jwt_required()
def debug_all_stores():
    """Debug endpoint to see all stores"""
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT store_id, name, owner_id, is_active, date_created FROM stores ORDER BY date_created DESC")
            all_stores = cursor.fetchall()
            
            return jsonify({
                'success': True,
                'stores': [{'store_id': s['store_id'], 'name': s['name'], 'owner_id': s['owner_id'], 'is_active': s['is_active'], 'date_created': s['date_created'].isoformat() if s['date_created'] else None} for s in all_stores]
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Add a simple endpoint to force a database sync
@stores_bp.route('/debug/sync-check', methods=['GET'])
@jwt_required()
def debug_sync_check():
    """Check database synchronization"""
    try:
        user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # Force a fresh query
            cursor.execute("SELECT store_id, name, owner_id, date_created FROM stores WHERE owner_id = %s ORDER BY date_created DESC", (user_id,))
            user_stores = cursor.fetchall()
            
            cursor.execute("SELECT COUNT(*) as total FROM stores")
            total_count = cursor.fetchone()
            
            return jsonify({
                'success': True,
                'user_id': user_id,
                'user_stores': [{'store_id': s['store_id'], 'name': s['name'], 'owner_id': s['owner_id'], 'date_created': s['date_created'].isoformat() if s['date_created'] else None} for s in user_stores],
                'total_stores_in_db': total_count['total'] if total_count else 0
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@stores_bp.route('/test-db', methods=['GET'])
@jwt_required()
def test_db_connection():
    """Test database connection and table structure"""
    try:
        user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # Test basic query
            cursor.execute("SELECT 1 as test")
            test_result = cursor.fetchone()
            print(f"DEBUG: Test query result: {test_result}")
            
            # Check if stores table exists (PostgreSQL syntax)
            cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores')")
            table_exists = cursor.fetchone()
            print(f"DEBUG: Stores table exists: {table_exists}")
            
            # Get table structure (PostgreSQL syntax)
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'stores'
                ORDER BY ordinal_position
            """)
            table_structure = cursor.fetchall()
            print(f"DEBUG: Table structure: {table_structure}")
            
            # Count existing stores
            cursor.execute("SELECT COUNT(*) FROM stores")
            store_count = cursor.fetchone()
            print(f"DEBUG: Existing stores count: {store_count}")
            
            # Test user exists
            cursor.execute("SELECT user_id, role FROM users WHERE user_id = %s", (user_id,))
            user_info = cursor.fetchone()
            print(f"DEBUG: Current user: {user_info}")
        
        return jsonify({
            'success': True,
            'test_result': test_result['test'] if test_result else None,
            'table_exists': list(table_exists.values())[0] if table_exists else False,
            'table_structure': [{'column_name': row['column_name'], 'data_type': row['data_type'], 'is_nullable': row['is_nullable']} for row in table_structure],
            'store_count': list(store_count.values())[0] if store_count else 0,
            'current_user': {'user_id': user_info['user_id'], 'role': user_info['role']} if user_info else None
        })
        
    except Exception as e:
        print(f"ERROR in test_db: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

# SINGLE ROUTE for store details - works for both authenticated and public access
@stores_bp.route('/<store_id>', methods=['GET'])
def get_store_details(store_id):
    """Get detailed store information by store ID - Works for both authenticated and public access"""
    try:
        print(f"DEBUG: Received request for store_id: {store_id}")
        
        # Try to get JWT token, but don't require it
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            print(f"DEBUG: User authenticated: {user_id}")
        except:
            print("DEBUG: No authentication provided, continuing as public user")
            pass  # No token or invalid token, continue as public user
        
        with get_cursor() as cursor:
            # Get store information
            sql = """
                SELECT s.store_id, s.owner_id, s.name, s.description, s.address, s.city, 
                       s.phone, s.email, s.logo_url, s.hero_image_url, s.opening_hours, 
                       s.is_active, s.date_created, s.avg_rating
                FROM stores s
                WHERE s.store_id = %s AND s.is_active = true
            """
            cursor.execute(sql, (store_id,))
            result = cursor.fetchone()
            
            print(f"DEBUG: Store query result: {result}")
            
            if not result:
                return jsonify({
                    'success': False,
                    'message': 'Store not found'
                }), 404
            
            # Parse opening hours from JSONB
            opening_hours = result['opening_hours']
            if opening_hours:
                if isinstance(opening_hours, str):
                    try:
                        opening_hours = json.loads(opening_hours)
                    except:
                        opening_hours = {"general": opening_hours}
            else:
                opening_hours = {
                    "Monday": "9:00 AM - 6:00 PM",
                    "Tuesday": "9:00 AM - 6:00 PM",
                    "Wednesday": "9:00 AM - 6:00 PM",
                    "Thursday": "9:00 AM - 6:00 PM",
                    "Friday": "9:00 AM - 6:00 PM",
                    "Saturday": "10:00 AM - 4:00 PM",
                    "Sunday": "Closed"
                }
            
            # Prepare store data
            store_data = {
                'store_id': result['store_id'],
                'owner_id': result['owner_id'],
                'name': result['name'],
                'description': result['description'],
                'address': result['address'],
                'city': result['city'],
                'phone': result['phone'],
                'email': result['email'],
                'logo_url': result['logo_url'],
                'hero_image_url': result['hero_image_url'],
                'opening_hours': opening_hours,
                'is_active': result['is_active'],
                'date_created': result['date_created'].isoformat() if result['date_created'] else None,
                'avg_rating': float(result['avg_rating']) if result['avg_rating'] else 0.0
            }
            
            print(f"DEBUG: Returning store data: {store_data}")
            
            return jsonify({
                'success': True,
                'store': store_data
            }), 200
            
    except Exception as e:
        print(f"Error fetching store details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error fetching store details: {str(e)}'
        }), 500

@stores_bp.route('/<store_id>', methods=['PUT'])
@jwt_required()
def update_store(store_id):
    """Update store information"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        db = get_db()
        
        with get_cursor() as cursor:
            # Verify ownership
            sql = "SELECT owner_id FROM stores WHERE store_id = %s"
            cursor.execute(sql, (store_id,))
            store = cursor.fetchone()
            
            if not store:
                return jsonify({
                    'success': False,
                    'message': 'Store not found'
                }), 404
            
            if store['owner_id'] != user_id:
                return jsonify({
                    'success': False,
                    'message': 'You can only update your own store'
                }), 403
            
            # Build update query - using correct column names
            update_fields = []
            values = []
            
            # Fields that can be updated (matching actual schema)
            updatable_fields = {
                'name': 'name',
                'description': 'description',
                'address': 'address',
                'city': 'city',
                'phone': 'phone',
                'email': 'email',
                'logo_url': 'logo_url',
                'banner_url': 'hero_image_url',
                'opening_hours': 'opening_hours',
                'is_active': 'is_active'
            }
            
            for field, column in updatable_fields.items():
                if field in data:
                    update_fields.append(f"{column} = %s")
                    if field == 'opening_hours':
                        # Convert to JSON
                        values.append(json.dumps(data[field]))
                    else:
                        values.append(data[field])
            
            if not update_fields:
                return jsonify({
                    'success': False,
                    'message': 'No valid fields to update'
                }), 400
            
            values.append(store_id)
            
            # Execute update
            sql = f"UPDATE stores SET {', '.join(update_fields)} WHERE store_id = %s"
            cursor.execute(sql, values)
            
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Store updated successfully'
        }), 200
            
    except Exception as e:
        try:
            db.rollback()
        except:
            pass
        print(f"Error updating store: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error updating store: {str(e)}'
        }), 500

@stores_bp.route('/test', methods=['GET'])
def test_stores():
    return jsonify({
        'success': True,
        'message': 'Stores endpoint is working'
    })

@stores_bp.route('/schema', methods=['GET'])
def get_store_schema():
    """Get the actual database schema for debugging"""
    try:
        with get_cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'stores'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            return jsonify({
                'success': True,
                'schema': [{'column_name': row['column_name'], 'data_type': row['data_type'], 'is_nullable': row['is_nullable'], 'column_default': row['column_default']} for row in columns]
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@stores_bp.route('/top-stores', methods=['GET'])
def get_top_stores():
    """Get top stores by product count"""
    try:
        limit = request.args.get('limit', 5, type=int)
        # Add a reasonable maximum limit
        limit = min(limit, 500)  # Prevent excessive queries
        
        with get_cursor() as cursor:
            # Get stores with their product count, ordered by product count desc
            sql = """
                SELECT s.store_id, s.name, s.description, s.address, s.city, 
                       s.phone, s.email, s.logo_url, s.hero_image_url, 
                       s.avg_rating, s.date_created,
                       COUNT(p.product_id) as product_count
                FROM stores s
                LEFT JOIN products p ON s.store_id = p.store_id AND p.is_active = true
                WHERE s.is_active = true
                GROUP BY s.store_id, s.name, s.description, s.address, s.city, 
                         s.phone, s.email, s.logo_url, s.hero_image_url, 
                         s.avg_rating, s.date_created
                ORDER BY product_count DESC, s.date_created DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            stores = cursor.fetchall()
            
            # Convert to list of dictionaries
            stores_list = []
            for store in stores:
                stores_list.append({
                    'store_id': store['store_id'],
                    'name': store['name'],
                    'description': store['description'],
                    'address': store['address'],
                    'city': store['city'],
                    'phone': store['phone'],
                    'email': store['email'],
                    'logo_url': store['logo_url'],
                    'hero_image_url': store['hero_image_url'],
                    'avg_rating': float(store['avg_rating']) if store['avg_rating'] else 0.0,
                    'date_created': store['date_created'].isoformat() if store['date_created'] else None,
                    'product_count': store['product_count']
                })
            
            return jsonify({
                'success': True,
                'stores': stores_list,
                'total': len(stores_list)
            }), 200
            
    except Exception as e:
        print(f"Error fetching top stores: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error fetching stores: {str(e)}'
        }), 500

@stores_bp.route('/test-api/<store_id>', methods=['GET'])
def test_store_api(store_id):
    """Test endpoint to debug store API issues"""
    try:
        print(f"TEST: Received request for store_id: {store_id}")
        
        with get_cursor() as cursor:
            # Simple test query
            cursor.execute("SELECT COUNT(*) as count FROM stores WHERE is_active = true")
            total_stores = cursor.fetchone()
            print(f"TEST: Total active stores: {total_stores}")
            
            # Test specific store query
            cursor.execute("SELECT store_id, name, city FROM stores WHERE store_id = %s", (store_id,))
            store_result = cursor.fetchone()
            print(f"TEST: Store query result: {store_result}")
            
            # Test all stores to see what's available
            cursor.execute("SELECT store_id, name, city FROM stores WHERE is_active = true LIMIT 5")
            all_stores = cursor.fetchall()
            print(f"TEST: All active stores: {all_stores}")
            
            return jsonify({
                'success': True,
                'message': 'Test successful',
                'store_id_requested': store_id,
                'total_active_stores': total_stores['count'] if total_stores else 0,
                'store_found': store_result is not None,
                'store_data': dict(store_result) if store_result else None,
                'sample_stores': [dict(store) for store in all_stores]
            })
            
    except Exception as e:
        print(f"TEST ERROR: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })