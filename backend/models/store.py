from database.db import get_db
from utils.auth import generate_uuid

class Store:
    @staticmethod
    def get_all(page=1, limit=10):
        """Get all stores with pagination"""
        db = get_db()
        offset = (page - 1) * limit
        
        with db.cursor() as cursor:
            # Get total count
            cursor.execute("SELECT COUNT(*) as count FROM stores WHERE is_active = TRUE")
            total = cursor.fetchone()['count']
            
            # Get stores
            sql = """
                SELECT store_id, owner_id, name, description, address, city, 
                phone, email, logo_url, hero_image_url, date_created, avg_rating 
                FROM stores 
                WHERE is_active = TRUE 
                ORDER BY name 
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, (limit, offset))
            stores = cursor.fetchall()
            
            return stores, total
    
    @staticmethod
    def get_by_id(store_id):
        """Get store by ID"""
        db = get_db()
        with db.cursor() as cursor:
            sql = """
                SELECT store_id, owner_id, name, description, address, city, 
                phone, email, logo_url, hero_image_url, opening_hours, 
                date_created, avg_rating 
                FROM stores 
                WHERE store_id = %s AND is_active = TRUE
            """
            cursor.execute(sql, (store_id,))
            return cursor.fetchone()
    
    @staticmethod
    def get_by_owner(owner_id):
        """Get stores owned by a user"""
        db = get_db()
        with db.cursor() as cursor:
            sql = """
                SELECT store_id, name, description, address, city, 
                phone, email, logo_url, hero_image_url, date_created, avg_rating 
                FROM stores 
                WHERE owner_id = %s AND is_active = TRUE
            """
            cursor.execute(sql, (owner_id,))
            return cursor.fetchall()
    
    @staticmethod
    def create(store_data):
        """Create a new store"""
        db = get_db()
        store_id = generate_uuid()
        
        with db.cursor() as cursor:
            sql = """
                INSERT INTO stores (
                    store_id, owner_id, name, description, address, city, 
                    phone, email, logo_url, hero_image_url, opening_hours
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                store_id,
                store_data['owner_id'],
                store_data['name'],
                store_data.get('description'),
                store_data['address'],
                store_data['city'],
                store_data['phone'],
                store_data.get('email'),
                store_data.get('logo_url'),
                store_data.get('hero_image_url'),
                store_data.get('opening_hours')
            ))
            db.commit()
            
            return store_id
    
    @staticmethod
    def update(store_id, store_data):
        """Update store information"""
        db = get_db()
        
        # Build the SQL dynamically based on what's provided
        update_fields = []
        values = []
        
        field_mapping = {
            'name': 'name',
            'description': 'description',
            'address': 'address',
            'city': 'city',
            'phone': 'phone',
            'email': 'email',
            'logo_url': 'logo_url',
            'hero_image_url': 'hero_image_url',
            'opening_hours': 'opening_hours'
        }
        
        for key, field in field_mapping.items():
            if key in store_data:
                update_fields.append(f"{field} = %s")
                values.append(store_data[key])
        
        if not update_fields:
            return False
        
        values.append(store_id)  # For the WHERE clause
        
        with db.cursor() as cursor:
            sql = f"UPDATE stores SET {', '.join(update_fields)} WHERE store_id = %s"
            cursor.execute(sql, tuple(values))
            db.commit()
            
            return cursor.rowcount > 0
    
    @staticmethod
    def delete(store_id):
        """Soft delete a store (mark as inactive)"""
        db = get_db()
        with db.cursor() as cursor:
            sql = "UPDATE stores SET is_active = FALSE WHERE store_id = %s"
            cursor.execute(sql, (store_id,))
            db.commit()
            
            return cursor.rowcount > 0