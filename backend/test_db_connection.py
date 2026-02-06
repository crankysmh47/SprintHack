import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def test_connection():
    print("🔌 Testing Real Database Connection...")
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Error: Missing credentials in .env")
        return

    try:
        supabase = create_client(url, key)
        
        # Test 1: Fetch the Sample User provided by Dev 2
        TEST_USER_ID = "4a1f987a-e66d-459f-8c51-ad40fd10ee69"
        user = supabase.table("users").select("*").eq("id", TEST_USER_ID).execute()
        
        if user.data:
            print(f"✅ User Check Passed: Found User {TEST_USER_ID}")
        else:
            print(f"❌ User Check Failed: User {TEST_USER_ID} not found")

        # Test 2: Fetch the Sample Rumor
        TEST_RUMOR_ID = "912efe5b-403b-4903-b146-927fc9653b25"
        rumor = supabase.table("rumors").select("*").eq("id", TEST_RUMOR_ID).execute()
        
        if rumor.data:
            print(f"✅ Rumor Check Passed: Found Rumor {TEST_RUMOR_ID}")
            print(f"   Content: '{rumor.data[0]['content']}'")
        else:
            print(f"❌ Rumor Check Failed: Rumor {TEST_RUMOR_ID} not found")
            
        print("\n🚀 CONNECTION SUCCESSFUL! Backend is linked to real data.")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_connection()
