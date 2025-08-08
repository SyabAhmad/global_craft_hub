from database.db import get_db, get_cursor
from utils.auth import generate_uuid, hash_password

class User:
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        try:
            with get_cursor() as cursor:
                sql = """
                    SELECT user_id, email, first_name, last_name, phone, address, 
                           city, role, loyalty_points, date_joined, last_login, is_active 
                    FROM users WHERE user_id = %s
                """
                cursor.execute(sql, (user_id,))
                return cursor.fetchone()
        except Exception as e:
            print(f"Error in get_by_id: {e}")
            return None
    
    @staticmethod
    def get_by_email(email):
        """Get user by email - returns full user data including password_hash"""
        try:
            with get_cursor() as cursor:
                sql = "SELECT * FROM users WHERE email = %s"
                cursor.execute(sql, (email,))
                return cursor.fetchone()
        except Exception as e:
            print(f"Error in get_by_email: {e}")
            return None
    
    @staticmethod
    def create(user_data):
        """Create a new user"""
        try:
            db = get_db()
            user_id = generate_uuid()
            
            with db.cursor() as cursor:
                sql = """
                    INSERT INTO users (
                        user_id, email, password_hash, first_name, last_name, 
                        phone, address, city, role
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    user_id,
                    user_data['email'],
                    hash_password(user_data['password']),
                    user_data['first_name'],
                    user_data['last_name'],
                    user_data.get('phone'),
                    user_data.get('address'),
                    user_data.get('city'),
                    user_data.get('role', 'customer')
                ))
                db.commit()
                
                return user_id
        except Exception as e:
            db.rollback()
            print(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def update(user_id, user_data):
        """Update user information"""
        try:
            db = get_db()
            
            # Build the SQL dynamically based on what's provided
            update_fields = []
            values = []
            
            if 'first_name' in user_data:
                update_fields.append("first_name = %s")
                values.append(user_data['first_name'])
            
            if 'last_name' in user_data:
                update_fields.append("last_name = %s")
                values.append(user_data['last_name'])
            
            if 'phone' in user_data:
                update_fields.append("phone = %s")
                values.append(user_data['phone'])
            
            if 'address' in user_data:
                update_fields.append("address = %s")
                values.append(user_data['address'])
            
            if 'city' in user_data:
                update_fields.append("city = %s")
                values.append(user_data['city'])
            
            if 'password' in user_data:
                update_fields.append("password_hash = %s")
                values.append(hash_password(user_data['password']))
            
            if not update_fields:
                return False
            
            values.append(user_id)  # For the WHERE clause
            
            with db.cursor() as cursor:
                sql = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = %s"
                cursor.execute(sql, tuple(values))
                db.commit()
                
                return cursor.rowcount > 0
        except Exception as e:
            db.rollback()
            print(f"Error updating user: {e}")
            return False
    
    @staticmethod
    def update_last_login(user_id):
        """Update user's last login timestamp"""
        try:
            db = get_db()
            with db.cursor() as cursor:
                sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = %s"
                cursor.execute(sql, (user_id,))
                db.commit()
                
                return cursor.rowcount > 0
        except Exception as e:
            db.rollback()
            print(f"Error updating last login: {e}")
            return False
    
    @staticmethod
    def deactivate(user_id):
        """Deactivate a user account"""
        try:
            db = get_db()
            with db.cursor() as cursor:
                sql = "UPDATE users SET is_active = FALSE WHERE user_id = %s"
                cursor.execute(sql, (user_id,))
                db.commit()
                
                return cursor.rowcount > 0
        except Exception as e:
            db.rollback()
            print(f"Error deactivating user: {e}")
            return False
    
    @staticmethod
    def set_reset_token(user_id, token):
        """Set password reset token with expiration"""
        try:
            db = get_db()
            with db.cursor() as cursor:
                # PostgreSQL uses INTERVAL instead of DATE_ADD
                sql = """
                    UPDATE users 
                    SET reset_token = %s, reset_token_expires = NOW() + INTERVAL '1 hour'
                    WHERE user_id = %s
                """
                cursor.execute(sql, (token, user_id))
                db.commit()
                
                return cursor.rowcount > 0
        except Exception as e:
            db.rollback()
            print(f"Error setting reset token: {e}")
            return False

    @staticmethod
    def get_by_reset_token(token):
        """Get user by reset token if token is not expired"""
        try:
            with get_cursor() as cursor:
                sql = """
                    SELECT user_id, email, first_name, last_name 
                    FROM users 
                    WHERE reset_token = %s AND reset_token_expires > NOW()
                """
                cursor.execute(sql, (token,))
                return cursor.fetchone()
        except Exception as e:
            print(f"Error getting user by reset token: {e}")
            return None

    @staticmethod
    def clear_reset_token(user_id):
        """Clear reset token"""
        try:
            db = get_db()
            with db.cursor() as cursor:
                sql = "UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE user_id = %s"
                cursor.execute(sql, (user_id,))
                db.commit()
                
                return cursor.rowcount > 0
        except Exception as e:
            db.rollback()
            print(f"Error clearing reset token: {e}")
            return False

    @staticmethod
    def update_password(user_id, new_password):
        """Update user password"""
        try:
            db = get_db()
            hashed_password = hash_password(new_password)
            
            with db.cursor() as cursor:
                sql = "UPDATE users SET password_hash = %s WHERE user_id = %s"
                cursor.execute(sql, (hashed_password, user_id))
                db.commit()
                
                return cursor.rowcount > 0
        except Exception as e:
            db.rollback()
            print(f"Error updating password: {e}")
            return False