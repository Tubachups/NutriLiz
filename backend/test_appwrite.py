import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException

# Load environment variables
load_dotenv()

# Initialize client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

databases = Databases(client)

# Get IDs from environment variables
DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID')
COLLECTION_ID = os.getenv('APPWRITE_COLLECTION_ID')

def print_all_rows():
    try:
        nutriliz_db = databases.list_documents(DATABASE_ID, COLLECTION_ID)

        if not nutriliz_db['documents']:
            print("⚠️ No documents found in this collection.")
            return

        print("\n📋 All Documents in Collection:\n")
        for doc in nutriliz_db['documents']:
            print("──────────────────────────────")
            for key, value in doc.items():
                print(f"{key}: {value}")
            print("──────────────────────────────\n")

    except AppwriteException as e:
        print(f"❌ Error fetching documents: {e}")

if __name__ == "__main__":
    print_all_rows()