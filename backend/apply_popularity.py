import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def apply_migration():
    print("🚀 Applying Popularity Migration...")
    try:
        with open("backend/migration_popularity.sql", "r") as f:
            sql = f.read()
            # Split by statement if needed, or run as block. 
            # Supabase Python client doesn't support running raw SQL directly via client unless using an RPC function or similar, 
            # BUT we can trying using the SQL editor approach or just hoping there's an RPC or we use psycopg2 if available.
            # Actually, standard supabase-py doesn't have a generic "query" method for raw SQL unless we use a stored procedure.
            # However, for this environment, I might not have psycopg2 installed. 
            # Let's try to assume I can run it via a dedicated RPC if one exists, OR 
            # honestly, I should just ask the user to run it in SQL Editor.
            # BUT, I can try to use a "hack" if I have a "exec_sql" function defined in DB? No.
            
            # Allow me to create a temporary RPC function ? No.
            print("⚠️ DIRECT SQL EXECUTION NOT SUPPORTED VIA CLIENT LIBRARIES (WITHOUT RPC).")
            print("PLEASE RUN 'backend/migration_popularity.sql' IN SUPABASE SQL EDITOR.")
            
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    apply_migration()
