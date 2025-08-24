from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database.db import init_app, test_connection, close_db, get_cursor
from routes.auth import auth_bp
from routes.users import users_bp
from routes.stores import stores_bp
from routes.products import products_bp
from routes.categories import categories_bp
from routes.wishlist import wishlist_bp
from routes.orders import orders_bp 
from routes.cart import cart_bp
from routes.analytics import analytics_bp
from routes.admin import admin_bp
from utils.auth import hash_password


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
    
    # Ensure superadmin exists if configured
    def ensure_superadmin():
        import os
        admin_email = os.getenv('SUPERADMIN_EMAIL')
        admin_password = os.getenv('SUPERADMIN_PASSWORD')
        if not admin_email or not admin_password:
            return
        first_name = os.getenv('SUPERADMIN_FIRST_NAME', 'Super')
        last_name = os.getenv('SUPERADMIN_LAST_NAME', 'Admin')
        try:
            with get_cursor() as cursor:
                cursor.execute("SELECT user_id, role FROM users WHERE email = %s", (admin_email,))
                row = cursor.fetchone()
                if not row:
                    import uuid
                    user_id = str(uuid.uuid4())
                    cursor.execute(
                        """
                        INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, is_active, date_joined)
                        VALUES (%s, %s, %s, %s, %s, 'admin', TRUE, NOW())
                        """,
                        (user_id, admin_email, hash_password(admin_password), first_name, last_name)
                    )
                    print(f"Created superadmin user: {admin_email}")
                elif row['role'] != 'admin':
                    cursor.execute("UPDATE users SET role = 'admin' WHERE email = %s", (admin_email,))
                    print(f"Upgraded user to superadmin: {admin_email}")
        except Exception as e:
            print(f"Failed to ensure superadmin: {e}")

    ensure_superadmin()

    # Ensure analytics schema exists
    def ensure_analytics_schema():
        try:
            with get_cursor() as cursor:
                # Create enum type if not exists
                cursor.execute("SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type'")
                if cursor.fetchone() is None:
                    cursor.execute("CREATE TYPE analytics_event_type AS ENUM ('view','click','add_to_cart','purchase')")

                # Create table if not exists
                cursor.execute("SELECT to_regclass('public.analytics_events') AS tbl")
                row = cursor.fetchone()
                if not row or not row.get('tbl'):
                    cursor.execute(
                        """
                        CREATE TABLE analytics_events (
                            event_id VARCHAR(36) PRIMARY KEY,
                            user_id VARCHAR(36),
                            store_id VARCHAR(36),
                            product_id VARCHAR(36),
                            event_type analytics_event_type NOT NULL,
                            metadata JSONB,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
                            FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
                            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
                        )
                        """
                    )
        except Exception as e:
            print(f"Failed to ensure analytics schema: {e}")

    ensure_analytics_schema()
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(stores_bp, url_prefix='/api/stores')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(wishlist_bp, url_prefix='/api/wishlist')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
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