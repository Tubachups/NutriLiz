import os
import json
from flask import Flask
from admin import admin_bp  # Assumes your blueprint file is named admin.py

# 1. Setup minimal Flask app context for testing
app = Flask(__name__)
app.register_blueprint(admin_bp)

# 2. Setup constants
ADMIN_ID = '6980441d000875ac5c3e'
HEADERS = {'X-User-ID': ADMIN_ID}

def verify_environment():
    """Ensure required Appwrite variables are present."""
    required_vars = [
        'APPWRITE_ENDPOINT',
        'APPWRITE_PROJECT_ID',
        'APPWRITE_API_KEY',
        'APPWRITE_DATABASE_ID'
    ]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}\n"
                               f"Please ensure they are exported or loaded via python-dotenv.")

def run_integration_tests():
    """Execute sequence of endpoint tests."""
    verify_environment()
    client = app.test_client()
    
    print("\n=== 1. Testing GET /api/admin/users ===")
    response = client.get('/api/admin/users', headers=HEADERS)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.get_data(as_text=True)}")
        return

    users_data = response.json
    # Note: Appwrite Python SDK model_dump() usually nests results under 'users'
    users_list = users_data.get('users', []) 
    print(f"Success: Retrieved {len(users_list)} users (Limit: {users_data.get('limit')}, Offset: {users_data.get('offset')}).")

    if not users_list:
        print("Abort: No users found in the database to run specific user tests.")
        return
    # print(f"Sample User: {json.dumps(users_list[0], indent=2)}")
    # Extract the first user ID to dynamically test the next endpoints
    target_user_id = users_list[0]['id']
    print(f"{target_user_id} will be used for subsequent tests.")
    print(f"\n=== 2. Testing GET /api/admin/users/{target_user_id} ===")
    user_response = client.get(f'/api/admin/users/{target_user_id}', headers=HEADERS)
    print(f"Status Code: {user_response.status_code}")
    
    if user_response.status_code == 200:
        print(f"Success: Retrieved user data for ID '{target_user_id}'.")
    else:
        print(f"Error: {user_response.get_data(as_text=True)}")

    print(f"\n=== 3. Testing GET /api/admin/users/{target_user_id}/scan-history ===")
    history_response = client.get(f'/api/admin/users/{target_user_id}/scan-history', headers=HEADERS)
    print(f"Status Code: {history_response.status_code}")
    
    if history_response.status_code == 200:
        history_data = history_response.json
        print(f"Success: Retrieved {history_data.get('total', 0)} scan history records.")
        if history_data.get('history'):
            print(f"Sample Record: {json.dumps(history_data['history'][0], indent=2)}")
    else:
        print(f"Error: {history_response.get_data(as_text=True)}")

if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    
    run_integration_tests()