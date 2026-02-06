import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"Connecting to {url}...")
supabase = create_client(url, key)

def check_db():
    print("\n--- CHECKING USERS ---")
    users = supabase.table("users").select("*").execute()
    for u in users.data:
        print(f"User: {u.get('username')} | ID: {u.get('id')} | InviteCode: {u.get('invite_code')}")
    
    if not users.data:
        print("❌ NO USERS FOUND! Migration might have failed to seed data.")
        
    print("\n--- CHECKING INVITES ---")
    try:
        invites = supabase.table("invites").select("*").execute()
        print(f"Invites count: {len(invites.data)}")
    except Exception as e:
        print(f"❌ Error querying invites table: {e}")

if __name__ == "__main__":
    check_db()
