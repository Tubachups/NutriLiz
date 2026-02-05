# backend/admin.py
from flask import Blueprint, jsonify, request
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.services.databases import Databases
from appwrite.query import Query
import os

# Create Blueprint for admin routes
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Admin user IDs - add your admin user ID here
ADMIN_USER_IDS = ['6980441d000875ac5c3e']

def get_appwrite_admin_client():
    """Initialize Appwrite client for admin operations"""
    client = Client()
    client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
    client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
    client.set_key(os.getenv('APPWRITE_API_KEY'))
    return client

def check_admin_authorization():
    """Check if the requesting user is an admin"""
    requesting_user_id = request.headers.get('X-User-ID')
    if requesting_user_id not in ADMIN_USER_IDS:
        return False, requesting_user_id
    return True, requesting_user_id

@admin_bp.route('/users')
def list_users():
    """List all users with pagination - Admin only"""
    is_admin, user_id = check_admin_authorization()
    if not is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Get pagination params
        limit = request.args.get('limit', 12, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Initialize Appwrite Users service
        client = get_appwrite_admin_client()
        users = Users(client)
        
        # List users - use Query for pagination
        queries = [
            Query.limit(limit),
            Query.offset(offset)
        ]
        result = users.list(queries=queries)
        
        return jsonify({
            'users': result['users'],
            'total': result['total'],
            'limit': limit,
            'offset': offset
        })
    except Exception as e:
        print(f"Error listing users: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>')
def get_user(user_id):
    """Get a specific user - Admin only"""
    is_admin, _ = check_admin_authorization()
    if not is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        client = get_appwrite_admin_client()
        users = Users(client)
        user = users.get(user_id)
        return jsonify(user)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/scan-history')
def get_user_scan_history(user_id):
    """Get a user's product scan history - Admin only"""
    is_admin, _ = check_admin_authorization()
    if not is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        client = get_appwrite_admin_client()
        databases = Databases(client)
        
        # Database and collection IDs
        database_id = os.getenv('APPWRITE_DATABASE_ID')
        collection_id = 'lists_prod'  # Product history collection
        
        # Query the product history collection for this user
        result = databases.list_documents(
            database_id=database_id,
            collection_id=collection_id,
            queries=[
                Query.equal('userId', user_id),
                Query.order_desc('scannedAt'),
                Query.limit(100)
            ]
        )
        
        # Format the response
        history = []
        for doc in result['documents']:
            history.append({
                '$id': doc['$id'],
                'barcode': doc.get('barcode', ''),
                'productName': doc.get('name', 'Unknown Product'),
                'brand': doc.get('brand', ''),
                'image': doc.get('image', ''),
                'nutriscore': doc.get('nutriscore', ''),
                'scannedAt': doc.get('scannedAt', ''),
            })
        
        return jsonify({
            'history': history,
            'total': result['total']
        })
    except Exception as e:
        print(f"Error fetching scan history: {e}")
        return jsonify({'error': str(e)}), 500