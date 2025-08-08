from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_cursor, get_db
import uuid
from datetime import datetime

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/', methods=['GET'])
@jwt_required()
def get_cart():
    """Get user's cart with items"""
    try:
        user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            # Get or create cart for user
            cursor.execute("SELECT cart_id FROM cart WHERE user_id = %s", (user_id,))
            cart = cursor.fetchone()
            
            if not cart:
                # Create cart if it doesn't exist
                cart_id = str(uuid.uuid4())
                cursor.execute(
                    "INSERT INTO cart (cart_id, user_id, date_created) VALUES (%s, %s, %s)",
                    (cart_id, user_id, datetime.utcnow())
                )
                cart_id = cart_id
            else:
                cart_id = cart['cart_id']
            
            # Get cart items with product details
            cursor.execute("""
                SELECT 
                    ci.cart_item_id,
                    ci.product_id,
                    ci.quantity,
                    ci.date_added,
                    p.name,
                    p.description,
                    p.price,
                    p.sale_price,
                    p.stock_quantity,
                    s.name as store_name,
                    s.store_id,
                    pi.image_url as primary_image_url
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.product_id
                JOIN stores s ON p.store_id = s.store_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
                WHERE ci.cart_id = %s AND p.is_active = true
                ORDER BY ci.date_added DESC
            """, (cart_id,))
            
            cart_items = cursor.fetchall()
            
            # Calculate totals
            total_amount = 0
            total_items = 0
            
            items_list = []
            for item in cart_items:
                effective_price = item['sale_price'] if item['sale_price'] else item['price']
                item_total = float(effective_price) * item['quantity']
                total_amount += item_total
                total_items += item['quantity']
                
                items_list.append({
                    'cart_item_id': item['cart_item_id'],
                    'product_id': item['product_id'],
                    'name': item['name'],
                    'description': item['description'],
                    'price': float(item['price']),
                    'sale_price': float(item['sale_price']) if item['sale_price'] else None,
                    'effective_price': float(effective_price),
                    'quantity': item['quantity'],
                    'item_total': item_total,
                    'stock_quantity': item['stock_quantity'],
                    'store_name': item['store_name'],
                    'store_id': item['store_id'],
                    'image_url': item['primary_image_url'],
                    'date_added': item['date_added'].isoformat() if item['date_added'] else None
                })
        
        return jsonify({
            'success': True,
            'cart': {
                'cart_id': cart_id,
                'items': items_list,
                'total_items': total_items,
                'total_amount': total_amount
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting cart: {e}")
        return jsonify({
            'success': False,
            'message': f'Error getting cart: {str(e)}'
        }), 500

@cart_bp.route('/items', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Add item to cart"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # Validate required fields
        if 'product_id' not in data:
            return jsonify({
                'success': False,
                'message': 'Product ID is required'
            }), 400
        
        product_id = data['product_id']
        quantity = int(data.get('quantity', 1))
        
        if quantity <= 0:
            return jsonify({
                'success': False,
                'message': 'Quantity must be greater than 0'
            }), 400
        
        db = get_db()
        
        with get_cursor() as cursor:
            # Check if product exists and is active
            cursor.execute("""
                SELECT product_id, name, stock_quantity, is_active 
                FROM products 
                WHERE product_id = %s
            """, (product_id,))
            product = cursor.fetchone()
            
            if not product:
                return jsonify({
                    'success': False,
                    'message': 'Product not found'
                }), 404
            
            if not product['is_active']:
                return jsonify({
                    'success': False,
                    'message': 'Product is not available'
                }), 400
            
            if product['stock_quantity'] < quantity:
                return jsonify({
                    'success': False,
                    'message': f'Only {product["stock_quantity"]} items available in stock'
                }), 400
            
            # Get or create cart
            cursor.execute("SELECT cart_id FROM cart WHERE user_id = %s", (user_id,))
            cart = cursor.fetchone()
            
            if not cart:
                cart_id = str(uuid.uuid4())
                cursor.execute(
                    "INSERT INTO cart (cart_id, user_id, date_created) VALUES (%s, %s, %s)",
                    (cart_id, user_id, datetime.utcnow())
                )
            else:
                cart_id = cart['cart_id']
            
            # Check if item already exists in cart
            cursor.execute("""
                SELECT cart_item_id, quantity 
                FROM cart_items 
                WHERE cart_id = %s AND product_id = %s
            """, (cart_id, product_id))
            existing_item = cursor.fetchone()
            
            if existing_item:
                # Update existing item quantity
                new_quantity = existing_item['quantity'] + quantity
                
                if product['stock_quantity'] < new_quantity:
                    return jsonify({
                        'success': False,
                        'message': f'Cannot add {quantity} more items. Only {product["stock_quantity"] - existing_item["quantity"]} more available'
                    }), 400
                
                cursor.execute("""
                    UPDATE cart_items 
                    SET quantity = %s, date_added = %s 
                    WHERE cart_item_id = %s
                """, (new_quantity, datetime.utcnow(), existing_item['cart_item_id']))
                
                cart_item_id = existing_item['cart_item_id']
            else:
                # Add new item to cart
                cart_item_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO cart_items (cart_item_id, cart_id, product_id, quantity, date_added)
                    VALUES (%s, %s, %s, %s, %s)
                """, (cart_item_id, cart_id, product_id, quantity, datetime.utcnow()))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': f'{product["name"]} added to cart successfully',
            'cart_item_id': cart_item_id
        }), 201
        
    except Exception as e:
        db.rollback()
        print(f"Error adding to cart: {e}")
        return jsonify({
            'success': False,
            'message': f'Error adding to cart: {str(e)}'
        }), 500

@cart_bp.route('/items/<item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """Update cart item quantity"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        if 'quantity' not in data:
            return jsonify({
                'success': False,
                'message': 'Quantity is required'
            }), 400
        
        quantity = int(data['quantity'])
        
        if quantity <= 0:
            return jsonify({
                'success': False,
                'message': 'Quantity must be greater than 0'
            }), 400
        
        db = get_db()
        
        with get_cursor() as cursor:
            # Verify user owns this cart item
            cursor.execute("""
                SELECT ci.cart_item_id, ci.product_id, p.name, p.stock_quantity
                FROM cart_items ci
                JOIN cart c ON ci.cart_id = c.cart_id
                JOIN products p ON ci.product_id = p.product_id
                WHERE ci.cart_item_id = %s AND c.user_id = %s
            """, (item_id, user_id))
            
            cart_item = cursor.fetchone()
            
            if not cart_item:
                return jsonify({
                    'success': False,
                    'message': 'Cart item not found'
                }), 404
            
            if cart_item['stock_quantity'] < quantity:
                return jsonify({
                    'success': False,
                    'message': f'Only {cart_item["stock_quantity"]} items available in stock'
                }), 400
            
            # Update quantity
            cursor.execute("""
                UPDATE cart_items 
                SET quantity = %s, date_added = %s 
                WHERE cart_item_id = %s
            """, (quantity, datetime.utcnow(), item_id))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': f'{cart_item["name"]} quantity updated successfully'
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"Error updating cart item: {e}")
        return jsonify({
            'success': False,
            'message': f'Error updating cart item: {str(e)}'
        }), 500

@cart_bp.route('/items/<item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Remove item from cart"""
    try:
        user_id = get_jwt_identity()
        
        db = get_db()
        
        with get_cursor() as cursor:
            # Verify user owns this cart item and get product name
            cursor.execute("""
                SELECT ci.cart_item_id, p.name
                FROM cart_items ci
                JOIN cart c ON ci.cart_id = c.cart_id
                JOIN products p ON ci.product_id = p.product_id
                WHERE ci.cart_item_id = %s AND c.user_id = %s
            """, (item_id, user_id))
            
            cart_item = cursor.fetchone()
            
            if not cart_item:
                return jsonify({
                    'success': False,
                    'message': 'Cart item not found'
                }), 404
            
            # Remove item
            cursor.execute("DELETE FROM cart_items WHERE cart_item_id = %s", (item_id,))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': f'{cart_item["name"]} removed from cart successfully'
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"Error removing from cart: {e}")
        return jsonify({
            'success': False,
            'message': f'Error removing from cart: {str(e)}'
        }), 500

@cart_bp.route('/', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear entire cart"""
    try:
        user_id = get_jwt_identity()
        
        db = get_db()
        
        with get_cursor() as cursor:
            # Get user's cart
            cursor.execute("SELECT cart_id FROM cart WHERE user_id = %s", (user_id,))
            cart = cursor.fetchone()
            
            if cart:
                # Remove all items from cart
                cursor.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart['cart_id'],))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cart cleared successfully'
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"Error clearing cart: {e}")
        return jsonify({
            'success': False,
            'message': f'Error clearing cart: {str(e)}'
        }), 500

@cart_bp.route('/count', methods=['GET'])
@jwt_required()
def get_cart_count():
    """Get total number of items in cart"""
    try:
        user_id = get_jwt_identity()
        
        with get_cursor() as cursor:
            cursor.execute("""
                SELECT COALESCE(SUM(ci.quantity), 0) as total_items
                FROM cart c
                LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
                WHERE c.user_id = %s
            """, (user_id,))
            
            result = cursor.fetchone()
            total_items = result['total_items'] if result else 0
        
        return jsonify({
            'success': True,
            'count': total_items
        }), 200
        
    except Exception as e:
        print(f"Error getting cart count: {e}")
        return jsonify({
            'success': False,
            'message': f'Error getting cart count: {str(e)}'
        }), 500