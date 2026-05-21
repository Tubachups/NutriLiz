# backend/admin.py
from flask import Blueprint, jsonify, request
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.services.tables_db import TablesDB
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


def get_appwrite_admin_tabledb():
    """Initialize Appwrite TablesDB service for admin table operations."""
    return TablesDB(get_appwrite_admin_client())


def _row_to_payload(row_obj):
    """Flatten Appwrite table rows so custom columns are easy to read."""
    if hasattr(row_obj, 'to_dict'):
        row = row_obj.to_dict()
    elif isinstance(row_obj, dict):
        row = row_obj
    else:
        return {}

    data = row.get('data')
    if isinstance(data, dict):
        payload = dict(data)
        for key, value in row.items():
            if key not in payload:
                payload[key] = value
        return payload

    return row


def _rows_to_plain_dicts(result):
    """Normalize Appwrite list_rows responses across SDK return shapes."""
    if hasattr(result, 'rows'):
        raw_rows = getattr(result, 'rows') or []
    elif isinstance(result, dict):
        raw_rows = result.get('rows', []) or []
    else:
        raw_rows = []

    rows = []
    for raw in raw_rows:
        payload = _row_to_payload(raw)
        if payload:
            rows.append(payload)
    return rows

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
        payload = result.model_dump()
        payload['limit'] = limit
        payload['offset'] = offset

        return jsonify(payload)
    except Exception as e:
        print(f"Error listing users: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>')
def get_user(user_id):
    """Get a specific user - Admin only"""
    print(f"DEBUG: Attempting to fetch user with ID: {user_id}")
    
    is_admin, _ = check_admin_authorization()
    if not is_admin:
        print(f"WARNING: Unauthorized access attempt for user ID: {user_id}")
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        client = get_appwrite_admin_client()
        users = Users(client)
        user = users.get(user_id)
        
        print(f"SUCCESS: Successfully retrieved data for user ID: {user_id}")
        return jsonify(user.model_dump())
    except Exception as e:
        print(f"ERROR: Failed to fetch user ID {user_id}. Reason: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/scan-history')
def get_user_scan_history(user_id):
    """Get a user's product scan history - Admin only"""
    print(f"DEBUG: scan-history route hit for user_id={user_id}")
    is_admin, _ = check_admin_authorization()
    if not is_admin:
        print(f"WARNING: Unauthorized scan-history access for user_id={user_id}")
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        tabledb = get_appwrite_admin_tabledb()

        # Database and table IDs
        database_id = os.getenv('APPWRITE_DATABASE_ID')
        table_id = (
            os.getenv('APPWRITE_SCAN_HISTORY_TABLE_ID')
            or os.getenv('APPWRITE_SCAN_HISTORY_COLLECTION_ID')
            or 'lists_prod'
        )

        print(f"DEBUG: querying scan-history database_id={database_id} table_id={table_id} user_id={user_id}")

        result = tabledb.list_rows(
            database_id=database_id,
            table_id=table_id,
            queries=[
                Query.equal('userId', [user_id]),
                Query.limit(100)
            ]
        )
        payload = result.model_dump()
        rows = _rows_to_plain_dicts(result)
        print(f"DEBUG: scan-history rows fetched count={len(rows)} total={payload.get('total')}")

        # Format the response
        history = []
        for row in rows:
            history.append({
                '$id': row.get('$id') or row.get('$sequence'),
                'barcode': row.get('barcode', ''),
                'productName': row.get('productName') or row.get('name', 'Unknown Product'),
                'brand': row.get('brand', ''),
                'image': row.get('image', ''),
                'nutriscore': row.get('nutriscore', ''),
                'scannedAt': row.get('scannedAt') or row.get('$createdAt', ''),
            })

        history.sort(key=lambda item: item.get('scannedAt') or '', reverse=True)
        
        return jsonify({
            'history': history,
            'total': payload.get('total', len(history))
        })
    except Exception as e:
        print(f"Error fetching scan history: {e}")
        return jsonify({'error': str(e)}), 500
