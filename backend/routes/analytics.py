from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.auth import role_required
from database.db import get_cursor
import uuid
import json

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/track', methods=['POST'])
def track_event():
    """Track a client event (view/click/add_to_cart/purchase). Anonymous allowed."""
    data = request.get_json() or {}
    event_type = data.get('event_type')
    store_id = data.get('store_id')
    product_id = data.get('product_id')
    user_id = data.get('user_id')  # optional
    metadata = data.get('metadata', {})

    if event_type not in ['view', 'click', 'add_to_cart', 'purchase']:
        return jsonify({"success": False, "message": "Invalid event_type"}), 400

    try:
        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO analytics_events (event_id, user_id, store_id, product_id, event_type, metadata)
                VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                """,
                (str(uuid.uuid4()), user_id, store_id, product_id, event_type, json.dumps(metadata))
            )
        return jsonify({"success": True}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@analytics_bp.route('/supplier/overview', methods=['GET'])
@jwt_required()
def supplier_overview():
    """Supplier analytics rollup for their store."""
    current_user_id = get_jwt_identity()
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT store_id FROM stores WHERE owner_id = %s", (current_user_id,))
            store = cursor.fetchone()
            if not store:
                return jsonify({"success": False, "message": "Store not found"}), 404
            store_id = store['store_id']

            cursor.execute(
                """
                SELECT 
                    COUNT(*) FILTER (WHERE event_type='view') AS views,
                    COUNT(*) FILTER (WHERE event_type='click') AS clicks,
                    COUNT(*) FILTER (WHERE event_type='add_to_cart') AS add_to_cart,
                    COUNT(*) FILTER (WHERE event_type='purchase') AS purchases
                FROM analytics_events
                WHERE store_id = %s AND created_at >= NOW() - INTERVAL '30 days'
                """,
                (store_id,)
            )
            agg = cursor.fetchone() or {}
        return jsonify({"success": True, "analytics": agg})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@analytics_bp.route('/admin/overview', methods=['GET'])
@jwt_required()
@role_required('admin')
def admin_overview():
    """Superadmin global analytics across stores."""
    try:
        with get_cursor() as cursor:
            # Global counts
            cursor.execute("SELECT COUNT(*) AS total_users FROM users")
            users = cursor.fetchone()
            cursor.execute("SELECT COUNT(*) AS total_stores FROM stores")
            stores = cursor.fetchone()
            cursor.execute("SELECT COUNT(*) AS total_products FROM products")
            products = cursor.fetchone()
            cursor.execute("SELECT COUNT(*) AS total_orders FROM orders")
            orders = cursor.fetchone()

            # Events last 30 days
            cursor.execute(
                """
                SELECT 
                    COUNT(*) FILTER (WHERE event_type='view') AS views,
                    COUNT(*) FILTER (WHERE event_type='click') AS clicks,
                    COUNT(*) FILTER (WHERE event_type='add_to_cart') AS add_to_cart,
                    COUNT(*) FILTER (WHERE event_type='purchase') AS purchases
                FROM analytics_events
                WHERE created_at >= NOW() - INTERVAL '30 days'
                """
            )
            events = cursor.fetchone()

            # Top stores by purchases
            cursor.execute(
                """
                SELECT s.store_id, s.name, COUNT(a.event_id) AS purchases
                FROM analytics_events a
                JOIN stores s ON a.store_id = s.store_id
                WHERE a.event_type='purchase' AND a.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY s.store_id, s.name
                ORDER BY purchases DESC
                LIMIT 10
                """
            )
            top_stores = cursor.fetchall()

        return jsonify({
            "success": True,
            "summary": {
                "users": users.get('total_users', 0),
                "stores": stores.get('total_stores', 0),
                "products": products.get('total_products', 0),
                "orders": orders.get('total_orders', 0),
            },
            "events30d": events,
            "topStores": top_stores
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
