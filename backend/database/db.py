import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import Error
from contextlib import contextmanager
import os
from dotenv import load_dotenv
from flask import g

load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'sweet_indulgence'),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db():
    """Get database connection"""
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        connection.autocommit = False  # We want to control transactions
        print(f"DEBUG: PostgreSQL connection established successfully")
        return connection
    except Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        raise

@contextmanager
def get_cursor():
    """Context manager for database cursor with automatic cleanup"""
    connection = None
    cursor = None
    try:
        connection = get_db()
        cursor = connection.cursor(cursor_factory=RealDictCursor)
        print(f"DEBUG: Cursor created successfully")
        yield cursor
        # Commit after successful execution
        connection.commit()
        print(f"DEBUG: Transaction committed successfully")
    except Exception as e:
        # Rollback on error
        if connection:
            connection.rollback()
            print(f"DEBUG: Transaction rolled back due to error: {e}")
        print(f"Database error: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
            print(f"DEBUG: Cursor closed")
        if connection:
            connection.close()
            print(f"DEBUG: Connection closed")

def init_app(app):
    """Initialize database with Flask app"""
    app.teardown_appcontext(close_db)
    
    # Test connection on startup
    with app.app_context():
        if test_connection():
            print("Database connection successful on startup")
        else:
            print("Warning: Database connection failed on startup")

def close_db(error):
    """Close database connection"""
    # This function is called by Flask's teardown_appcontext
    # Since we're using connection pooling through get_db(),
    # individual connections are closed automatically
    pass

def test_connection():
    """Test database connection and basic operations"""
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            print(f"Database test successful: {result}")
            return True
    except Exception as e:
        print(f"Database test failed: {e}")
        return False

def init_db():
    """Initialize database with schema"""
    try:
        with get_cursor() as cursor:
            # Read and execute schema
            with open('database/schema.sql', 'r') as file:
                schema = file.read()
            
            cursor.execute(schema)
            print("Database initialized successfully")
            
    except Error as e:
        print(f"Error initializing database: {e}")
        raise

# Test the connection when the module is imported
if __name__ == "__main__":
    print("Testing PostgreSQL connection...")
    test_connection()