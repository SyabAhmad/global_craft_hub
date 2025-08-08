from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth import role_required
from database.db import get_cursor, get_db  # Use your existing database functions
from datetime import datetime, date
import uuid

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('', methods=['GET'])
@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_orders():
    """Get orders for the current user with pagination"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        print(f"DEBUG: Getting orders for user: {user_id}, page: {page}, limit: {limit}")
        
        offset = (page - 1) * limit
        
        with get_cursor() as cursor:
            # First, let's check if there are ANY orders in the database
            cursor.execute("SELECT COUNT(*) as total FROM orders")
            all_orders = cursor.fetchone()
            print(f"DEBUG: Total orders in database: {all_orders['total'] if all_orders else 0}")
            
            # Check orders for this specific user
            cursor.execute("SELECT COUNT(*) as total FROM orders WHERE user_id = %s", (user_id,))
            total_result = cursor.fetchone()
            total_orders = total_result['total'] if total_result else 0
            
            print(f"DEBUG: Total orders count for user {user_id}: {total_orders}")
            
            # If we have orders, fetch them
            if total_orders > 0:
                cursor.execute("""
                    SELECT 
                        o.order_id,
                        o.total_amount,
                        o.status,
                        o.payment_status,
                        o.payment_method,
                        o.shipping_address,
                        o.shipping_city,
                        o.shipping_phone,
                        o.order_notes,
                        o.date_created,
                        o.date_updated,
                        s.name as store_name
                    FROM orders o
                    LEFT JOIN stores s ON o.store_id = s.store_id
                    WHERE o.user_id = %s
                    ORDER BY o.date_created DESC
                    LIMIT %s OFFSET %s
                """, (user_id, limit, offset))
                
                orders = cursor.fetchall()
                print(f"DEBUG: Raw orders from DB: {orders}")
            else:
                orders = []
            
            # Convert to list of dictionaries
            orders_list = []
            for order in orders:
                order_data = dict(order) if isinstance(order, dict) else dict(order)
                
                orders_list.append({
                    'order_id': order_data['order_id'],
                    'total_amount': float(order_data['total_amount']),
                    'status': order_data['status'],
                    'payment_status': order_data['payment_status'],
                    'payment_method': order_data['payment_method'],
                    'shipping_address': order_data['shipping_address'],
                    'shipping_city': order_data['shipping_city'],
                    'shipping_phone': order_data['shipping_phone'],
                    'order_notes': order_data['order_notes'],
                    'date_created': order_data['date_created'].isoformat() if order_data['date_created'] else None,
                    'date_updated': order_data['date_updated'].isoformat() if order_data['date_updated'] else None,
                    'store_name': order_data['store_name']
                })
            
            total_pages = (total_orders + limit - 1) // limit if total_orders > 0 else 1
            
        print(f"DEBUG: Found {len(orders_list)} orders for user")
        print(f"DEBUG: Orders list: {orders_list}")
        
        return jsonify({
            'success': True,
            'orders': orders_list,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_orders': total_orders,
                'limit': limit
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting user orders: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error getting orders: {str(e)}'
        }), 500

@orders_bp.route('/supplier', methods=['GET'])
@jwt_required()
def get_supplier_orders():
    """Get orders for the supplier's store - this should be used by suppliers"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        print(f"DEBUG: Getting supplier orders for user: {user_id}, page: {page}, limit: {limit}")
        
        offset = (page - 1) * limit
        
        with get_cursor() as cursor:
            # First, get the supplier's store
            cursor.execute("""
                SELECT store_id, name FROM stores 
                WHERE owner_id = %s AND is_active = TRUE
            """, (user_id,))
            
            store = cursor.fetchone()
            print(f"DEBUG: Supplier store: {store}")
            
            if not store:
                return jsonify({
                    'success': True,
                    'orders': [],
                    'pagination': {
                        'current_page': page,
                        'total_pages': 1,
                        'total_orders': 0,
                        'limit': limit
                    },
                    'message': 'No store found for this supplier'
                }), 200
            
            store_id = store['store_id']
            
            # Get total count of orders for this store
            cursor.execute("""
                SELECT COUNT(*) as total FROM orders 
                WHERE store_id = %s
            """, (store_id,))
            
            total_result = cursor.fetchone()
            total_orders = total_result['total'] if total_result else 0
            
            print(f"DEBUG: Total orders for store {store_id}: {total_orders}")
            
            # Get orders for this store
            if total_orders > 0:
                cursor.execute("""
                    SELECT 
                        o.order_id,
                        o.total_amount,
                        o.status,
                        o.payment_status,
                        o.payment_method,
                        o.shipping_address,
                        o.shipping_city,
                        o.shipping_phone,
                        o.order_notes,
                        o.date_created,
                        o.date_updated,
                        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                        u.email as customer_email,
                        s.name as store_name
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.user_id
                    LEFT JOIN stores s ON o.store_id = s.store_id
                    WHERE o.store_id = %s
                    ORDER BY o.date_created DESC
                    LIMIT %s OFFSET %s
                """, (store_id, limit, offset))
                
                orders = cursor.fetchall()
                print(f"DEBUG: Raw supplier orders from DB: {orders}")
            else:
                orders = []
            
            # Convert to list of dictionaries
            orders_list = []
            for order in orders:
                order_data = dict(order) if isinstance(order, dict) else dict(order)
                
                orders_list.append({
                    'order_id': order_data['order_id'],
                    'total_amount': float(order_data['total_amount']),
                    'status': order_data['status'],
                    'payment_status': order_data['payment_status'],
                    'payment_method': order_data['payment_method'],
                    'shipping_address': order_data['shipping_address'],
                    'shipping_city': order_data['shipping_city'],
                    'shipping_phone': order_data['shipping_phone'],
                    'order_notes': order_data['order_notes'],
                    'date_created': order_data['date_created'].isoformat() if order_data['date_created'] else None,
                    'date_updated': order_data['date_updated'].isoformat() if order_data['date_updated'] else None,
                    'customer_name': order_data['customer_name'] or 'Unknown Customer',
                    'customer_email': order_data['customer_email'] or '',
                    'store_name': order_data['store_name'] or store['name']
                })
            
            total_pages = (total_orders + limit - 1) // limit if total_orders > 0 else 1
            
        print(f"DEBUG: Found {len(orders_list)} supplier orders")
        print(f"DEBUG: Supplier orders list: {orders_list}")
        
        return jsonify({
            'success': True,
            'orders': orders_list,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_orders': total_orders,
                'limit': limit
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting supplier orders: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error getting supplier orders: {str(e)}'
        }), 500

@orders_bp.route('/<order_id>', methods=['GET'])
@jwt_required()
def get_order_details(order_id):
    """Get detailed order information by ID"""
    try:
        user_id = get_jwt_identity()
        
        print(f"DEBUG: Getting order details for order_id: {order_id}, user_id: {user_id}")
        
        with get_cursor() as cursor:
            # Get order details with items
            cursor.execute("""
                SELECT 
                    o.order_id,
                    o.total_amount,
                    o.status,
                    o.payment_status,
                    o.payment_method,
                    o.shipping_address,
                    o.shipping_city,
                    o.shipping_phone,
                    o.order_notes,
                    o.date_created,
                    o.date_updated,
                    o.loyalty_points_earned,
                    o.loyalty_points_used,
                    s.name as store_name,
                    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                    u.email as customer_email
                FROM orders o
                LEFT JOIN stores s ON o.store_id = s.store_id
                LEFT JOIN users u ON o.user_id = u.user_id
                WHERE o.order_id = %s AND (o.user_id = %s OR s.owner_id = %s)
            """, (order_id, user_id, user_id))
            
            order = cursor.fetchone()
            
            print(f"DEBUG: Order query result: {order}")
            
            if not order:
                return jsonify({
                    'success': False,
                    'message': 'Order not found or access denied'
                }), 404
            
            # Convert to dict if needed
            order_data = dict(order) if isinstance(order, dict) else dict(order)
            
            # Get order items
            cursor.execute("""
                SELECT 
                    oi.quantity,
                    oi.unit_price,
                    oi.total_price,
                    p.name as product_name,
                    p.description
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = %s
            """, (order_id,))
            
            items = cursor.fetchall()
            
            print(f"DEBUG: Order items query result: {items}")
            
            # Convert items to list of dicts
            items_list = []
            for item in items:
                item_data = dict(item) if isinstance(item, dict) else dict(item)
                items_list.append({
                    'quantity': item_data['quantity'],
                    'unit_price': float(item_data['unit_price']),
                    'total_price': float(item_data['total_price']),
                    'product_name': item_data['product_name'],
                    'description': item_data['description']
                })
            
            # Build complete order object
            order_details = {
                'order_id': order_data['order_id'],
                'total_amount': float(order_data['total_amount']),
                'status': order_data['status'],
                'payment_status': order_data['payment_status'],
                'payment_method': order_data['payment_method'],
                'shipping_address': order_data['shipping_address'],
                'shipping_city': order_data['shipping_city'],
                'shipping_phone': order_data['shipping_phone'],
                'order_notes': order_data['order_notes'] or '',
                'date_created': order_data['date_created'].isoformat() if order_data['date_created'] else None,
                'date_updated': order_data['date_updated'].isoformat() if order_data['date_updated'] else None,
                'store_name': order_data['store_name'] or 'Unknown Store',
                'customer_name': order_data['customer_name'] or 'Unknown Customer',
                'customer_email': order_data['customer_email'] or '',
                'loyalty_points_earned': order_data.get('loyalty_points_earned', 0),
                'loyalty_points_used': order_data.get('loyalty_points_used', 0),
                'items': items_list
            }
            
            print(f"DEBUG: Final order details: {order_details}")
        
        return jsonify({
            'success': True,
            'order': order_details
        }), 200
        
    except Exception as e:
        print(f"Error getting order details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error getting order details: {str(e)}'
        }), 500

@orders_bp.route('', methods=['POST'])
@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    """Create a new order"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        print(f"DEBUG: Starting order creation for user: {user_id}")
        print(f"DEBUG: Order data received: {data}")
        
        # Validate required fields
        required_fields = ['items', 'total_amount', 'shipping_address', 'shipping_city', 'shipping_phone']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        with get_cursor() as cursor:
            # Check if user exists (but don't restrict by role yet)
            cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
            user_result = cursor.fetchone()
            
            if not user_result:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            user_role = user_result['role']
            print(f"DEBUG: User role: {user_role}")
            
            # Get the store_id from the first product
            first_item = data['items'][0]
            print(f"DEBUG: Looking up store for product: {first_item['product_id']}")
            
            cursor.execute("""
                SELECT p.store_id, s.owner_id, s.name as store_name 
                FROM products p 
                JOIN stores s ON p.store_id = s.store_id 
                WHERE p.product_id = %s
            """, (first_item['product_id'],))
            store_result = cursor.fetchone()
            
            if not store_result:
                return jsonify({
                    'success': False,
                    'message': 'Product not found'
                }), 404
            
            store_id = store_result['store_id']
            store_owner_id = store_result['owner_id']
            store_name = store_result['store_name']
            
            print(f"DEBUG: Store ID: {store_id}, Owner ID: {store_owner_id}")
            print(f"DEBUG: Current user ID: {user_id}")
            
            # NOW check if user is trying to order from their own store
            if store_owner_id == user_id:
                return jsonify({
                    'success': False,
                    'message': f'You cannot order products from your own store "{store_name}". Please order from other stores.'
                }), 403
            
            # Verify all products belong to the same store AND user doesn't own any of them
            for item in data['items']:
                cursor.execute("""
                    SELECT p.store_id, s.owner_id 
                    FROM products p 
                    JOIN stores s ON p.store_id = s.store_id 
                    WHERE p.product_id = %s
                """, (item['product_id'],))
                product_store = cursor.fetchone()
                
                if not product_store:
                    return jsonify({
                        'success': False,
                        'message': f'Product {item["product_id"]} not found'
                    }), 404
                
                if product_store['store_id'] != store_id:
                    return jsonify({
                        'success': False,
                        'message': 'All products must be from the same store'
                    }), 400
                
                # Double-check ownership for each product
                if product_store['owner_id'] == user_id:
                    return jsonify({
                        'success': False,
                        'message': f'You cannot order products from your own store "{store_name}"'
                    }), 403
        
        # Generate order ID
        order_id = str(uuid.uuid4())
        print(f"DEBUG: Generated order ID: {order_id}")
        
        # Get customer details
        customer_name = data.get('customer_name', 'Customer')
        customer_email = data.get('customer_email', '')
        payment_method = data.get('payment_method', 'Credit Card')
        order_notes = data.get('order_notes', '')
        
        db = get_db()
        with db.cursor() as cursor:
            print(f"DEBUG: Creating order for store: {store_id}")
            
            # Create the order
            cursor.execute("""
                INSERT INTO orders (
                    order_id, user_id, store_id, total_amount, status, payment_status,
                    payment_method, shipping_address, shipping_city, shipping_phone,
                    order_notes, date_created, date_updated
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (
                order_id, user_id, store_id, data['total_amount'], 'pending', 'paid',
                payment_method, data['shipping_address'], data['shipping_city'], 
                data['shipping_phone'], order_notes
            ))
            
            print(f"DEBUG: Order inserted, affected rows: {cursor.rowcount}")
            
            # Create order items
            for i, item in enumerate(data['items']):
                order_item_id = str(uuid.uuid4())
                unit_price = item['unit_price']
                quantity = item['quantity']
                total_price = unit_price * quantity
                
                print(f"DEBUG: Inserting order item {i+1}: {order_item_id}")
                
                cursor.execute("""
                    INSERT INTO order_items (
                        order_item_id, order_id, product_id, quantity, unit_price, total_price
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    order_item_id, order_id, item['product_id'], 
                    quantity, unit_price, total_price
                ))
                
                print(f"DEBUG: Order item {i+1} inserted, affected rows: {cursor.rowcount}")
                
                # Update product stock
                cursor.execute("""
                    UPDATE products 
                    SET stock_quantity = stock_quantity - %s 
                    WHERE product_id = %s AND stock_quantity >= %s
                """, (quantity, item['product_id'], quantity))
                
                print(f"DEBUG: Stock update affected rows: {cursor.rowcount}")
                
                if cursor.rowcount == 0:
                    return jsonify({
                        'success': False,
                        'message': f'Insufficient stock for product {item["product_id"]}'
                    }), 400
        
        db.commit()
        print(f"DEBUG: Order creation completed successfully: {order_id}")
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'order_id': order_id,
            'order': {
                'order_id': order_id,
                'total_amount': data['total_amount'],
                'status': 'pending',
                'payment_status': 'paid',
                'date_created': 'now'
            }
        }), 201
        
    except Exception as e:
        db = get_db()
        db.rollback()
        print(f"ERROR: Order creation failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error creating order: {str(e)}'
        }), 500

@orders_bp.route('/<order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """Update order status (supplier only)"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        with get_cursor() as cursor:
            # Verify user owns the store for this order
            cursor.execute("""
                SELECT o.order_id 
                FROM orders o
                JOIN stores s ON o.store_id = s.store_id
                WHERE o.order_id = %s AND s.owner_id = %s
            """, (order_id, user_id))
            
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Order not found or access denied'
                }), 403
            
            # Update order status
            cursor.execute("""
                UPDATE orders 
                SET status = %s, date_updated = CURRENT_TIMESTAMP
                WHERE order_id = %s
            """, (new_status, order_id))
        
        return jsonify({
            'success': True,
            'message': 'Order status updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating order status: {e}")
        return jsonify({
            'success': False,
            'message': f'Error updating order status: {str(e)}'
        }), 500

@orders_bp.route('/store/<store_id>', methods=['GET'])
@jwt_required()
def get_store_orders(store_id):
    """Get orders for a specific store (supplier only) - Legacy endpoint"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        print(f"DEBUG: Getting store orders for store: {store_id}, user: {user_id}")
        
        # Verify user owns this store
        with get_cursor() as cursor:
            cursor.execute("""
                SELECT store_id FROM stores 
                WHERE store_id = %s AND owner_id = %s
            """, (store_id, user_id))
            
            store = cursor.fetchone()
            if not store:
                return jsonify({
                    'success': False,
                    'message': 'Store not found or you do not have permission to view its orders'
                }), 403
            
            offset = (page - 1) * limit
            
            # Get total count of store orders
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM orders o
                WHERE o.store_id = %s
            """, (store_id,))
            
            total_result = cursor.fetchone()
            total_orders = total_result['total'] if total_result else 0
            
            # Get store orders with customer info
            cursor.execute("""
                SELECT 
                    o.order_id,
                    o.total_amount,
                    o.status,
                    o.payment_status,
                    o.payment_method,
                    o.shipping_address,
                    o.shipping_city,
                    o.shipping_phone,
                    o.order_notes,
                    o.date_created,
                    o.date_updated,
                    CONCAT(u.first_name, ' ', u.last_name) as customer_name,
                    u.email as customer_email
                FROM orders o
                JOIN users u ON o.user_id = u.user_id
                WHERE o.store_id = %s
                ORDER BY o.date_created DESC
                LIMIT %s OFFSET %s
            """, (store_id, limit, offset))
            
            orders = cursor.fetchall()
            
            # Convert to list of dictionaries
            orders_list = []
            for order in orders:
                order_data = dict(order) if isinstance(order, dict) else dict(order)
                
                orders_list.append({
                    'order_id': order_data['order_id'],
                    'total_amount': float(order_data['total_amount']),
                    'status': order_data['status'],
                    'payment_status': order_data['payment_status'],
                    'payment_method': order_data['payment_method'],
                    'shipping_address': order_data['shipping_address'],
                    'shipping_city': order_data['shipping_city'],
                    'shipping_phone': order_data['shipping_phone'],
                    'order_notes': order_data['order_notes'],
                    'date_created': order_data['date_created'].isoformat() if order_data['date_created'] else None,
                    'date_updated': order_data['date_updated'].isoformat() if order_data['date_updated'] else None,
                    'customer_name': order_data['customer_name'],
                    'customer_email': order_data['customer_email']
                })
            
            total_pages = (total_orders + limit - 1) // limit
            
        print(f"DEBUG: Found {len(orders_list)} store orders")
        
        return jsonify({
            'success': True,
            'orders': orders_list,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_orders': total_orders,
                'limit': limit
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting store orders: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error getting store orders: {str(e)}'
        }), 500

@orders_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_order_stats():
    """Get order statistics for the authenticated store"""
    try:
        current_user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # Get the store_id for this user
            store_query = "SELECT store_id FROM stores WHERE owner_id = %s"
            cursor.execute(store_query, (current_user_id,))
            store_result = cursor.fetchone()
            
            if not store_result:
                return jsonify({
                    'success': False,
                    'message': 'Store not found for this user'
                }), 404
            
            store_id = store_result['store_id']
            
            # First, let's check what enum values exist for order_status
            cursor.execute("""
                SELECT unnest(enum_range(NULL::order_status)) as status_value
            """)
            enum_values = cursor.fetchall()
            print(f"DEBUG: Available order_status enum values: {[row['status_value'] for row in enum_values]}")
            
            # Get order statistics using the correct enum values
            # Common enum values are usually: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
            stats_query = """
                SELECT 
                    COUNT(DISTINCT o.order_id) as total_orders,
                    COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id END) as pending_orders,
                    COUNT(DISTINCT CASE WHEN o.status = 'processing' THEN o.order_id END) as processing_orders,
                    COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.order_id END) as shipped_orders,
                    COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as delivered_orders,
                    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.order_id END) as cancelled_orders,
                    COALESCE(SUM(CASE WHEN o.status IN ('delivered', 'shipped') THEN oi.total_price END), 0) as total_revenue,
                    COUNT(DISTINCT CASE WHEN DATE(o.date_created) = CURRENT_DATE THEN o.order_id END) as orders_today
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.product_id
                WHERE p.store_id = %s
            """
            
            cursor.execute(stats_query, (store_id,))
            stats = cursor.fetchone()
            
            # Convert to the format expected by the frontend
            formatted_stats = {
                'total_orders': stats['total_orders'] or 0,
                'pending_orders': stats['pending_orders'] or 0,
                'processing_orders': stats['processing_orders'] or 0,
                'completed_orders': (stats['delivered_orders'] or 0) + (stats['shipped_orders'] or 0),  # Combined shipped + delivered
                'cancelled_orders': stats['cancelled_orders'] or 0,
                'total_revenue': float(stats['total_revenue'] or 0),
                'orders_today': stats['orders_today'] or 0
            }
            
            return jsonify({
                'success': True,
                'stats': formatted_stats
            })
    
    except Exception as e:
        print(f"Error fetching order stats: {e}")
        return jsonify({
            'success': False,
            'message': 'Error fetching order stats',
            'error': str(e)
        }), 500

@orders_bp.route('/test-db', methods=['POST'])
@jwt_required()
def test_database_operations():
    """Test endpoint to verify database operations"""
    try:
        user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # Test insert
            test_order_id = 'test-order-123'
            cursor.execute("""
                INSERT INTO orders (
                    order_id, user_id, store_id, total_amount, status, payment_status,
                    payment_method, shipping_address, shipping_city, shipping_phone,
                    order_notes, date_created, date_updated
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                test_order_id, user_id, 'test-store', 100.00, 'pending', 'paid',
                'Test', 'Test Address', 'Test City', '1234567890', 'Test order'
            ))
            
            print(f"DEBUG: Test order inserted, affected rows: {cursor.rowcount}")
            
            # Test select
            cursor.execute("SELECT * FROM orders WHERE order_id = %s", (test_order_id,))
            result = cursor.fetchone()
            print(f"DEBUG: Test order retrieved: {result}")
            
            # Clean up
            cursor.execute("DELETE FROM orders WHERE order_id = %s", (test_order_id,))
            print(f"DEBUG: Test order deleted, affected rows: {cursor.rowcount}")
            
        return jsonify({
            'success': True,
            'message': 'Database test completed successfully',
            'result': result
        }), 200
        
    except Exception as e:
        print(f"ERROR: Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Database test failed: {str(e)}'
        }), 500