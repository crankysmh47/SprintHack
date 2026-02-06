import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Use credentials provided in chat if not in env, falling back to placeholders
url = os.environ.get("SUPABASE_URL", "https://mqkybokawooworfcacnb.supabase.co")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xa3lib2thd29vd29yZmNhY25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTA0MjIsImV4cCI6MjA4NTk2NjQyMn0.xFkyd_phq-LCmtdpUj7mCqsGDS5m0WVHSmw5RYF2skM")

supabase: Client = create_client(url, key)

def apply_migration():
    print("🚀 Applying Comments Migration...")
    
    with open("backend/migration_comments.sql", "r") as f:
        sql = f.read()

    # Split into statements if needed, but Supabase RPC/Run might handle block
    # Actually, supabase-py doesn't have a direct 'query' method for raw SQL usually exposed easily unless enabled.
    # But usually creating a function via SQL editor is the way, OR using the 'rpc' interface if a generic exec function exists.
    # However, for an agent hack, we might check if we can run it via a postgres driver or if we have to ask the user.
    # Let's try to assume we cannot run raw SQL via the JS/Python client easily without a stored procedure.
    # BUT, the user said "Run this in your Supabase SQL Editor". 
    # Let's check if we can use a library like `psycopg2` if available or just ask the user.
    # Checking `requirements.txt` would be good.
    
    # Wait, the user has `python` running.
    # If I can't run raw SQL, I should ask the user.
    # But I see `backend/main.py` uses `supabase`.
    
    # Strategy: Print instructions if direct exec is not possible.
    print("⚠️ Supabase Client does not support raw SQL execution directly from client-side without a helper function.")
    print("Please copy content of backend/migration_comments.sql to your Supabase SQL Editor.")

if __name__ == "__main__":
    apply_migration()
