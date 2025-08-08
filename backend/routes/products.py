from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_cursor, get_db  # Use your existing database functions
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import uuid

products_bp = Blueprint('products', __name__)

# Configuration for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'products')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_product_image(image_file):
    """Save uploaded image and return the file path"""
    if not image_file or not allowed_file(image_file.filename):
        return None
    
    # Create upload directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Generate unique filename
    filename = secure_filename(image_file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    # Save the file
    image_file.save(file_path)
    
    # Return relative path for database storage
    return f"/uploads/products/{unique_filename}"

@products_bp.route('/manage', methods=['GET'])
@jwt_required()
def get_manage_products():
    """Get products for the authenticated store (for manage products)"""
    try:
        current_user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # First, get the store_id for this user
            store_query = "SELECT store_id FROM stores WHERE owner_id = %s"
            cursor.execute(store_query, (current_user_id,))
            store_result = cursor.fetchone()
            
            if not store_result:
                return jsonify({
                    'success': False,
                    'message': 'Store not found for this user'
                }), 404
            
            store_id = store_result['store_id']
            
            # Get all products for this store with detailed information
            query = """
                SELECT 
                    p.*,
                    s.name as store_name,
                    COUNT(DISTINCT pi.image_id) as image_count,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(DISTINCT r.review_id) as review_count
                FROM products p
                LEFT JOIN stores s ON p.store_id = s.store_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                LEFT JOIN reviews r ON p.product_id = r.product_id
                WHERE p.store_id = %s
                GROUP BY p.product_id, s.name, p.name, p.description, p.price, p.sale_price, 
                         p.stock_quantity, p.is_featured, p.is_active, p.date_created, p.date_updated,
                         p.category_id, p.loyalty_points_earned
                ORDER BY p.date_created DESC
            """
            
            cursor.execute(query, (store_id,))
            products = cursor.fetchall()
            
            # Convert to list of dictionaries and get primary image for each product
            products_list = []
            for product in products:
                # Get the first image for this product
                image_query = """
                    SELECT image_url 
                    FROM product_images 
                    WHERE product_id = %s 
                    ORDER BY is_primary DESC, image_id ASC 
                    LIMIT 1
                """
                cursor.execute(image_query, (product['product_id'],))
                image_result = cursor.fetchone()
                
                # Convert product to dict format
                product_dict = {
                    'product_id': product['product_id'],
                    'name': product['name'],
                    'description': product['description'],
                    'price': float(product['price']),
                    'sale_price': float(product['sale_price']) if product['sale_price'] else None,
                    'stock_quantity': product['stock_quantity'],
                    'is_featured': product['is_featured'],
                    'is_active': product['is_active'],
                    'status': 'active' if product['is_active'] else 'inactive',
                    'date_created': product['date_created'],
                    'date_updated': product['date_updated'],
                    'category_id': product['category_id'],
                    'loyalty_points_earned': product['loyalty_points_earned'],
                    'store_name': product['store_name'],
                    'image_count': product['image_count'],
                    'avg_rating': float(product['avg_rating']),
                    'review_count': product['review_count'],
                    'primary_image': image_result['image_url'] if image_result else None
                }
                
                products_list.append(product_dict)
            
            return jsonify({
                'success': True,
                'products': products_list,
                'total': len(products_list)
            })
    
    except Exception as e:
        print(f"Error fetching store products: {e}")
        return jsonify({
            'success': False,
            'message': 'Error fetching products',
            'error': str(e)
        }), 500

# Handle both / and without trailing slash for POST
@products_bp.route('', methods=['POST'], strict_slashes=False)
@products_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_product():
    """Create a new product"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user is a supplier
        with get_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            
            if not user or user['role'] != 'supplier':
                return jsonify({
                    'success': False,
                    'message': 'Only suppliers can add products'
                }), 403
        
        # Get supplier's store
        with get_cursor() as cursor:
            cursor.execute("SELECT store_id FROM stores WHERE owner_id = %s", (user_id,))
            store = cursor.fetchone()
            
            if not store:
                return jsonify({
                    'success': False,
                    'message': 'You need to create a store first'
                }), 400
            
            store_id = store['store_id']
        
        # Get form data
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        price = request.form.get('price')
        sale_price = request.form.get('sale_price')
        category_id = request.form.get('category_id')
        stock_quantity = request.form.get('stock_quantity')
        is_featured = request.form.get('is_featured', 'false').lower() == 'true'
        is_active = request.form.get('is_active', 'true').lower() == 'true'
        loyalty_points_earned = request.form.get('loyalty_points_earned', '0')
        
        # Validate required fields
        if not all([name, description, price, category_id, stock_quantity]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Validate numeric fields
        try:
            price = float(price)
            stock_quantity = int(stock_quantity)
            loyalty_points_earned = int(loyalty_points_earned)
            
            if sale_price:
                sale_price = float(sale_price)
                if sale_price >= price:
                    return jsonify({
                        'success': False,
                        'message': 'Sale price must be less than regular price'
                    }, 400)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid numeric values'
            }), 400
        
        # Handle image upload
        image_url = None
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename:
                image_url = save_product_image(image_file)
                if not image_url:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid image file'
                    }), 400
        
        # Generate product ID
        product_id = str(uuid.uuid4())
        
        # Insert product into database (without image_url column)
        db = get_db()
        with db.cursor() as cursor:
            sql = """
                INSERT INTO products (
                    product_id, store_id, category_id, name, description, 
                    price, sale_price, stock_quantity,
                    is_featured, is_active, loyalty_points_earned, date_created
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                product_id, store_id, category_id, name, description,
                price, sale_price, stock_quantity,
                is_featured, is_active, loyalty_points_earned, datetime.utcnow()
            ))
            
            # If image was uploaded, add it to product_images table
            if image_url:
                image_id = str(uuid.uuid4())
                image_sql = """
                    INSERT INTO product_images (
                        image_id, product_id, image_url, is_primary, display_order
                    ) VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(image_sql, (image_id, product_id, image_url, True, 0))
            
            db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product added successfully',
            'product': {
                'product_id': product_id,
                'name': name,
                'price': price
            }
        }), 201
        
    except Exception as e:
        # Rollback on error
        db = get_db()
        db.rollback()
        print(f"Error creating product: {e}")
        return jsonify({
            'success': False,
            'message': f'Error creating product: {str(e)}'
        }), 500

# Handle both / and without trailing slash for GET
@products_bp.route('', methods=['GET'], strict_slashes=False)
@products_bp.route('/', methods=['GET'], strict_slashes=False)
def get_products():
    """Get all products with pagination and filtering"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 12, type=int)
        category_id = request.args.get('category_id')
        store_id = request.args.get('store_id')
        search = request.args.get('search', '').strip()
        sort = request.args.get('sort', 'date_desc')
        is_featured = request.args.get('is_featured')
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build WHERE clause
        where_conditions = ["p.is_active = true"]
        params = []
        
        if category_id:
            where_conditions.append("p.category_id = %s")
            params.append(category_id)
        
        if store_id:
            where_conditions.append("p.store_id = %s")
            params.append(store_id)
        
        if search:
            where_conditions.append("(p.name ILIKE %s OR p.description ILIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])
        
        if is_featured == 'true':
            where_conditions.append("p.is_featured = true")
        
        where_clause = " AND ".join(where_conditions)
        
        # Build ORDER BY clause
        if sort == 'price_asc':
            order_clause = "p.price ASC"
        elif sort == 'price_desc':
            order_clause = "p.price DESC"
        elif sort == 'name_asc':
            order_clause = "p.name ASC"
        elif sort == 'name_desc':
            order_clause = "p.name DESC"
        else:  # date_desc (default)
            order_clause = "p.date_created DESC"
        
        with get_cursor() as cursor:
            # Get total count
            count_sql = f"""
                SELECT COUNT(*) as total
                FROM products p
                WHERE {where_clause}
            """
            cursor.execute(count_sql, params)
            total = cursor.fetchone()['total']
            
            # Get products with store, category info, and primary image
            sql = f"""
                SELECT 
                    p.product_id, p.name, p.description, p.price, p.sale_price,
                    p.stock_quantity, p.is_featured, p.loyalty_points_earned,
                    p.date_created, p.date_updated,
                    c.name as category_name,
                    s.name as store_name, s.store_id,
                    pi.image_url as primary_image_url
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN stores s ON p.store_id = s.store_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                WHERE {where_clause}
                ORDER BY {order_clause}
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(sql, params + [limit, offset])
            products = cursor.fetchall()
            
            # Convert to list of dictionaries
            products_list = []
            for product in products:
                products_list.append({
                    'product_id': product['product_id'],
                    'name': product['name'],
                    'description': product['description'],
                    'price': float(product['price']),
                    'sale_price': float(product['sale_price']) if product['sale_price'] else None,
                    'stock_quantity': product['stock_quantity'],
                    'image_url': product['primary_image_url'],  # Primary image from product_images table
                    'is_featured': product['is_featured'],
                    'loyalty_points_earned': product['loyalty_points_earned'],
                    'date_created': product['date_created'],
                    'date_updated': product['date_updated'],
                    'category_name': product['category_name'],
                    'store_name': product['store_name'],
                    'store_id': product['store_id']
                })
        
        return jsonify({
            'success': True,
            'products': products_list,
            'pagination': {
                'total': total,
                'page': page,
                'limit': limit,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({
            'success': False,
            'message': f'Error fetching products: {str(e)}'
        }), 500

@products_bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        with get_cursor() as cursor:
            # Updated query to include the primary image
            cursor.execute("""
                SELECT 
                    p.product_id,
                    p.name,
                    p.description,
                    p.price,
                    p.sale_price,
                    p.stock_quantity,
                    p.is_featured,
                    p.is_active,
                    p.date_created,
                    p.date_updated,
                    p.category_id,
                    c.name as category_name,
                    p.store_id,
                    s.name as store_name,
                    s.description as store_description,
                    s.address as store_address,
                    s.phone as store_phone,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.review_id) as review_count,
                    pi.image_url as image_url
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN stores s ON p.store_id = s.store_id
                LEFT JOIN reviews r ON p.product_id = r.product_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                WHERE p.product_id = %s AND p.is_active = true
                GROUP BY p.product_id, c.name, s.name, s.description, s.address, s.phone, pi.image_url
            """, (product_id,))
            
            product_data = cursor.fetchone()
            
            if not product_data:
                return jsonify({
                    'success': False,
                    'message': 'Product not found'
                }), 404
            
            # Handle both dict and tuple returns
            if isinstance(product_data, dict):
                product = product_data
            else:
                # Convert tuple to dict
                columns = [desc[0] for desc in cursor.description]
                product = dict(zip(columns, product_data))
            
            # Convert to proper format
            product_response = {
                'product_id': product['product_id'],
                'name': product['name'],
                'description': product['description'],
                'price': float(product['price']),
                'sale_price': float(product['sale_price']) if product['sale_price'] else None,
                'stock_quantity': product['stock_quantity'],
                'is_featured': product['is_featured'],
                'is_active': product['is_active'],
                'date_created': product['date_created'].isoformat() if product['date_created'] else None,
                'date_updated': product['date_updated'].isoformat() if product['date_updated'] else None,
                'category_id': product['category_id'],
                'category_name': product['category_name'],
                'store_id': product['store_id'],
                'store_name': product['store_name'],
                'store_description': product['store_description'],
                'store_address': product['store_address'],
                'store_phone': product['store_phone'],
                'avg_rating': float(product['avg_rating']) if product['avg_rating'] else 0.0,
                'review_count': product['review_count'] if product['review_count'] else 0,
                'image_url': product['image_url']  # This is the key addition
            }
            
        return jsonify({
            'success': True,
            'product': product_response
        }), 200
        
    except Exception as e:
        print(f"Error getting product: {e}")
        return jsonify({
            'success': False,
            'message': f'Error getting product: {str(e)}'
        }), 500

@products_bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update a product"""
    try:
        user_id = get_jwt_identity()
        
        # Check if user owns this product
        with get_cursor() as cursor:
            sql = """
                SELECT p.*, s.owner_id 
                FROM products p
                JOIN stores s ON p.store_id = s.store_id
                WHERE p.product_id = %s
            """
            cursor.execute(sql, (product_id,))
            product = cursor.fetchone()
            
            if not product:
                return jsonify({
                    'success': False,
                    'message': 'Product not found'
                }), 404
            
            if product['owner_id'] != user_id:
                return jsonify({
                    'success': False,
                    'message': 'You can only update your own products'
                }), 403
        
        # Check if request has files (FormData) or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle FormData (with potential file upload)
            data = request.form.to_dict()
            image_file = request.files.get('image')
        else:
            # Handle JSON data
            data = request.json or {}
            image_file = None
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        updatable_fields = {
            'name': 'name',
            'description': 'description',
            'price': 'price',
            'sale_price': 'sale_price',
            'stock_quantity': 'stock_quantity',
            'is_featured': 'is_featured',
            'is_active': 'is_active',
            'loyalty_points_earned': 'loyalty_points_earned',
            'category_id': 'category_id'
        }
        
        for field, column in updatable_fields.items():
            if field in data and data[field] != '':
                update_fields.append(f"{column} = %s")
                
                # Handle boolean conversion for checkboxes from FormData
                if field in ['is_featured', 'is_active']:
                    if isinstance(data[field], str):
                        values.append(data[field].lower() in ['true', '1', 'on'])
                    else:
                        values.append(bool(data[field]))
                else:
                    values.append(data[field])
        
        if not update_fields:
            return jsonify({
                'success': False,
                'message': 'No valid fields to update'
            }), 400
        
        # Handle image upload if provided
        image_url = None
        if image_file and image_file.filename:
            image_url = save_product_image(image_file)
            if not image_url:
                return jsonify({
                    'success': False,
                    'message': 'Invalid image file'
                }), 400
        
        # Add updated timestamp
        update_fields.append("date_updated = CURRENT_TIMESTAMP")
        values.append(product_id)  # For WHERE clause
        
        # Execute update
        db = get_db()
        with db.cursor() as cursor:
            sql = f"UPDATE products SET {', '.join(update_fields)} WHERE product_id = %s"
            cursor.execute(sql, values)
            
            # Handle image update if new image was uploaded
            if image_url:
                # First, delete existing images for this product
                cursor.execute('DELETE FROM product_images WHERE product_id = %s', (product_id,))
                
                # Add new image
                image_id = str(uuid.uuid4())
                image_sql = """
                    INSERT INTO product_images (
                        image_id, product_id, image_url, is_primary, display_order
                    ) VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(image_sql, (image_id, product_id, image_url, True, 0))
            
            db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully'
        }), 200
        
    except Exception as e:
        db = get_db()
        db.rollback()
        print(f"Error updating product: {e}")
        return jsonify({
            'success': False,
            'message': f'Error updating product: {str(e)}'
        }), 500

@products_bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete product with proper foreign key handling"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify the product belongs to the user's store
        with get_cursor() as cursor:
            verify_query = """
                SELECT p.product_id, p.name
                FROM products p 
                JOIN stores s ON p.store_id = s.store_id 
                WHERE p.product_id = %s AND s.owner_id = %s
            """
            cursor.execute(verify_query, (product_id, current_user_id))
            verify_result = cursor.fetchone()
            
            if not verify_result:
                return jsonify({
                    'success': False,
                    'message': 'Product not found or you do not have permission to delete it'
                }), 403
            
            product_name = verify_result['name']
            
            # Check if product has been ordered
            cursor.execute("""
                SELECT COUNT(*) as order_count 
                FROM order_items 
                WHERE product_id = %s
            """, (product_id,))
            order_check = cursor.fetchone()
            
            if order_check['order_count'] > 0:
                # Product has orders - don't delete, just deactivate
                return jsonify({
                    'success': False,
                    'message': f'Cannot delete "{product_name}" because it has been ordered by customers. You can deactivate it instead.',
                    'can_deactivate': True,
                    'order_count': order_check['order_count']
                }), 400
        
        # If no orders, proceed with deletion
        db = get_db()
        with db.cursor() as cursor:
            try:
                # Start transaction
                db.autocommit = False
                
                # Delete in correct order due to foreign key constraints
                # 1. Delete product images
                cursor.execute('DELETE FROM product_images WHERE product_id = %s', (product_id,))
                
                # 2. Delete reviews
                cursor.execute('DELETE FROM reviews WHERE product_id = %s', (product_id,))
                
                # 3. Delete from wishlists
                cursor.execute('DELETE FROM wishlist_items WHERE product_id = %s', (product_id,))
                
                # 4. Delete from carts
                cursor.execute('DELETE FROM cart_items WHERE product_id = %s', (product_id,))
                
                # 5. Finally delete the product
                cursor.execute('DELETE FROM products WHERE product_id = %s', (product_id,))
                
                # Commit transaction
                db.commit()
                
                return jsonify({
                    'success': True,
                    'message': f'Product "{product_name}" deleted successfully'
                })
                
            except Exception as e:
                # Rollback transaction on error
                db.rollback()
                raise e
            finally:
                db.autocommit = True
    
    except Exception as e:
        print(f"Error deleting product: {e}")
        return jsonify({
            'success': False,
            'message': 'Error deleting product',
            'error': str(e)
        }), 500

@products_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_product_stats():
    """Get product statistics for the authenticated store"""
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
            
            # Get product statistics
            stats_query = """
                SELECT 
                    COUNT(*) as total_products,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
                    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_products,
                    COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
                    COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 1 END) as low_stock,
                    COALESCE(SUM(price * stock_quantity), 0) as total_value,
                    COALESCE(AVG(price), 0) as avg_price
                FROM products 
                WHERE store_id = %s
            """
            
            cursor.execute(stats_query, (store_id,))
            stats = cursor.fetchone()
            
            return jsonify({
                'success': True,
                'stats': stats
            })
    
    except Exception as e:
        print(f"Error fetching product stats: {e}")
        return jsonify({
            'success': False,
            'message': 'Error fetching product stats',
            'error': str(e)
        }), 500

@products_bp.route('/<product_id>/status', methods=['PATCH'])
@jwt_required()
def update_product_status(product_id):
    """Update product status (activate/deactivate)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        status = data['status']
        
        if status not in ['active', 'inactive']:
            return jsonify({
                'success': False,
                'message': 'Invalid status. Must be "active" or "inactive"'
            }), 400
        
        # Verify the product belongs to the user's store
        with get_cursor() as cursor:
            verify_query = """
                SELECT p.product_id 
                FROM products p 
                JOIN stores s ON p.store_id = s.store_id 
                WHERE p.product_id = %s AND s.owner_id = %s
            """
            cursor.execute(verify_query, (product_id, current_user_id))
            verify_result = cursor.fetchone()
            
            if not verify_result:
                return jsonify({
                    'success': False,
                    'message': 'Product not found or you do not have permission to modify it'
                }), 403
        
        # Update the product status
        db = get_db()
        with db.cursor() as cursor:
            update_query = """
                UPDATE products 
                SET is_active = %s, date_updated = %s 
                WHERE product_id = %s
            """
            is_active = status == 'active'
            cursor.execute(update_query, (is_active, datetime.now(), product_id))
            db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product status updated successfully'
        })
    
    except Exception as e:
        db = get_db()
        db.rollback()
        print(f"Error updating product status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error updating product status',
            'error': str(e)
        }), 500

@products_bp.route('/<product_id>/delete-check', methods=['GET'])
@jwt_required()
def check_delete_product(product_id):
    """Check if a product can be safely deleted"""
    try:
        current_user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # Verify ownership
            verify_query = """
                SELECT p.product_id 
                FROM products p 
                JOIN stores s ON p.store_id = s.store_id 
                WHERE p.product_id = %s AND s.owner_id = %s
            """
            cursor.execute(verify_query, (product_id, current_user_id))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Product not found'}), 404
            
            # Check for orders
            cursor.execute("""
                SELECT COUNT(*) as order_count 
                FROM order_items 
                WHERE product_id = %s
            """, (product_id,))
            order_result = cursor.fetchone()
            
            return jsonify({
                'success': True,
                'has_orders': order_result['order_count'] > 0,
                'order_count': order_result['order_count'],
                'can_delete': order_result['order_count'] == 0
            })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error checking product deletion status'
        }), 500