from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database.db import init_app, test_connection, close_db
from routes.auth import auth_bp
from routes.users import users_bp
from routes.stores import stores_bp
from routes.products import products_bp
from routes.categories import categories_bp
from routes.wishlist import wishlist_bp
from routes.orders import orders_bp 
from routes.cart import cart_bp


import os

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # or set a timedelta
    
    # Initialize extensions
    CORS(app)
    jwt = JWTManager(app)
    
    # Initialize database
    init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(stores_bp, url_prefix='/api/stores')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(wishlist_bp, url_prefix='/api/wishlist')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    
    # Add static file serving for uploads
    @app.route('/uploads/<path:subfolder>/<filename>')
    def serve_uploaded_file(subfolder, filename):
        """Serve uploaded files"""
        try:
            # Construct the full path to the uploads directory
            uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
            return send_from_directory(uploads_dir, f"{subfolder}/{filename}")
        except Exception as e:
            print(f"Error serving file: {e}")
            return "File not found", 404
    
    @app.route('/')
    def home():
        return {
            'message': 'Sweet Indulgence API',
            'status': 'running'
        }
    
    @app.route('/api/health')
    def health_check():
        try:
            # Test database connection
            db_status = test_connection()
            return {
                'status': 'healthy' if db_status else 'unhealthy',
                'database': 'connected' if db_status else 'disconnected'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }, 500
    
    # Register the function to close the database connection
    app.teardown_appcontext(close_db)

    return app

if __name__ == '__main__':
    app = create_app()
    print("Starting Sweet Indulgence API...")
    app.run(debug=True, host='0.0.0.0', port=5000)