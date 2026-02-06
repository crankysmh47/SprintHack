from dotenv import load_dotenv
from supabase import create_client
import os

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def fix_genesis():
    print("🛠️ Attempting to insert GENESIS user...")
    
    # Check first
    res = supabase.table("users").select("id").eq("username", "genesis").execute()
    if res.data:
        print("✅ GENESIS user already exists! ID:", res.data[0]['id'])
        return

    # Insert
    try:
        user_data = {
            "username": "genesis",
            "password_hash": "genesis_hash_placeholder",
            "trust_score": 1.0,
            "invite_code": "GENESIS"
        }
        res = supabase.table("users").insert(user_data).execute()
        print("✅ SUCCESS! Created GENESIS user.")
        print("User Data:", res.data)
        
    except Exception as e:
        print("❌ FAILED:", e)

if __name__ == "__main__":
    fix_genesis()
