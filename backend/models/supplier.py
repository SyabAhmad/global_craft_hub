from database.db import get_db
from utils.auth import generate_uuid
import json

class Supplier:
    @staticmethod
    def get_by_user_id(user_id):
        """Get supplier by user ID"""
        db = get_db()
        with db.cursor() as cursor:
            sql = """
                SELECT supplier_id, user_id, business_name, business_address, 
                business_phone, tax_id, is_verified, verification_documents, 
                date_registered 
                FROM suppliers 
                WHERE user_id = %s
            """
            cursor.execute(sql, (user_id,))
            return cursor.fetchone()
    
    @staticmethod
    def get_by_id(supplier_id):
        """Get supplier by supplier ID"""
        db = get_db()
        with db.cursor() as cursor:
            sql = """
                SELECT supplier_id, user_id, business_name, business_address, 
                business_phone, tax_id, is_verified, verification_documents, 
                date_registered 
                FROM suppliers 
                WHERE supplier_id = %s
            """
            cursor.execute(sql, (supplier_id,))
            return cursor.fetchone()
    
    @staticmethod
    def create(supplier_data):
        """Create a new supplier"""
        db = get_db()
        supplier_id = generate_uuid()
        
        # Convert verification_documents to JSON if provided
        verification_docs = None
        if supplier_data.get('verification_documents'):
            if isinstance(supplier_data['verification_documents'], dict):
                verification_docs = json.dumps(supplier_data['verification_documents'])
            elif isinstance(supplier_data['verification_documents'], str):
                verification_docs = supplier_data['verification_documents']
        
        with db.cursor() as cursor:
            sql = """
                INSERT INTO suppliers (
                    supplier_id, user_id, business_name, business_address, 
                    business_phone, tax_id, verification_documents
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                supplier_id,
                supplier_data['user_id'],
                supplier_data['business_name'],
                supplier_data['business_address'],
                supplier_data['business_phone'],
                supplier_data.get('tax_id'),
                verification_docs
            ))
            # No commit here as we're handling transactions at a higher level
            
            return supplier_id
    
    @staticmethod
    def update(supplier_id, supplier_data):
        """Update supplier information"""
        db = get_db()
        
        # Build the SQL dynamically based on what's provided
        update_fields = []
        values = []
        
        field_mapping = {
            'business_name': 'business_name',
            'business_address': 'business_address',
            'business_phone': 'business_phone',
            'tax_id': 'tax_id'
        }
        
        for key, field in field_mapping.items():
            if key in supplier_data:
                update_fields.append(f"{field} = %s")
                values.append(supplier_data[key])
        
        # Handle verification documents separately
        if 'verification_documents' in supplier_data:
            update_fields.append("verification_documents = %s")
            if isinstance(supplier_data['verification_documents'], dict):
                values.append(json.dumps(supplier_data['verification_documents']))
            else:
                values.append(supplier_data['verification_documents'])
        
        if not update_fields:
            return False
        
        values.append(supplier_id)  # For the WHERE clause
        
        with db.cursor() as cursor:
            sql = f"UPDATE suppliers SET {', '.join(update_fields)} WHERE supplier_id = %s"
            cursor.execute(sql, tuple(values))
            db.commit()
            
            return cursor.rowcount > 0
    
    @staticmethod
    def verify(supplier_id, verified=True):
        """Set verification status for a supplier"""
        db = get_db()
        with db.cursor() as cursor:
            sql = "UPDATE suppliers SET is_verified = %s WHERE supplier_id = %s"
            cursor.execute(sql, (verified, supplier_id))
            db.commit()
            
            return cursor.rowcount > 0