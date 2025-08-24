from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from utils.auth import role_required
from database.db import get_cursor

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/products', methods=['GET'])
@jwt_required()
@role_required('admin')
def admin_list_products():
    """Admin: list/search products across all stores.
    Query params: search, page, limit, sort(name, price, sale_price, stock, date), order(asc/desc)
    """
    search = request.args.get('search', '', type=str).strip()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    sort = request.args.get('sort', 'date', type=str)
    order = request.args.get('order', 'desc', type=str)
    offset = (page - 1) * limit

    # Map sort keys to SQL columns
    sort_map = {
        'name': 'p.name',
        'price': 'p.price',
        'sale_price': 'p.sale_price',
        'stock': 'p.stock_quantity',
        'date': 'p.date_created'
    }
    sort_col = sort_map.get(sort, 'p.date_created')
    order_sql = 'ASC' if order.lower() == 'asc' else 'DESC'

    where_clauses = []
    params = []
    if search:
        where_clauses.append("(p.name ILIKE %s OR s.name ILIKE %s OR c.name ILIKE %s)")
        like = f"%{search}%"
        params.extend([like, like, like])

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ''

    try:
        with get_cursor() as cursor:
            # Count total
            count_sql = f"""
                SELECT COUNT(*) AS total
                FROM products p
                JOIN stores s ON p.store_id = s.store_id
                JOIN categories c ON p.category_id = c.category_id
                {where_sql}
            """
            cursor.execute(count_sql, tuple(params))
            total = cursor.fetchone()['total']

            # Fetch rows
            data_sql = f"""
                SELECT 
                    p.product_id,
                    p.name AS product_name,
                    p.price,
                    p.sale_price,
                    p.stock_quantity,
                    p.is_active,
                    p.is_featured,
                    p.date_created,
                    s.store_id,
                    s.name AS store_name,
                    s.city AS store_city,
                    c.name AS category_name
                FROM products p
                JOIN stores s ON p.store_id = s.store_id
                JOIN categories c ON p.category_id = c.category_id
                {where_sql}
                ORDER BY {sort_col} {order_sql}
                LIMIT %s OFFSET %s
            """
            cursor.execute(data_sql, tuple(params + [limit, offset]))
            rows = cursor.fetchall()

        return jsonify({
            'success': True,
            'total': total,
            'page': page,
            'limit': limit,
            'products': rows
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
