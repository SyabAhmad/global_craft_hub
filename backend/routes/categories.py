from flask import Blueprint, request, jsonify
from database.db import get_cursor

categories_bp = Blueprint('categories', __name__)

# Handle both / and without trailing slash for GET
@categories_bp.route('', methods=['GET'], strict_slashes=False)
@categories_bp.route('/', methods=['GET'], strict_slashes=False)
def get_categories():
    """Get all categories"""
    try:
        with get_cursor() as cursor:
            sql = "SELECT category_id, name, description FROM categories ORDER BY name"
            cursor.execute(sql)
            categories = cursor.fetchall()
            
            categories_list = []
            for category in categories:
                categories_list.append({
                    'category_id': category['category_id'],
                    'name': category['name'],
                    'description': category['description']
                })
        
        return jsonify({
            'success': True,
            'categories': categories_list
        }), 200
        
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({
            'success': False,
            'message': f'Error fetching categories: {str(e)}'
        }), 500