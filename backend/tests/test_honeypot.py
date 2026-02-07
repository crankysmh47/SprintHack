from fastapi.testclient import TestClient
from backend.main import app, supabase
import uuid
import time
import jwt
import os

client = TestClient(app)

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_hackathon_key_12345")
ALGORITHM = "HS256"

def test_honeypot_logic():
    print("🐝 HONEYPOT MECHANISM TEST")
    print("========================")

    # 1. Setup: Create a "Bot" User
    bot_username = f"spambot_{uuid.uuid4().hex[:6]}"
    print(f"[1/4] Registering Bot User: {bot_username}")
    
    # Insert directly to DB to simulate a user
    user_data = {
        "username": bot_username,
        "password_hash": "hashed_pass",
        "trust_score": 0.5,
        "invite_code": "BOT_CODE"
    }
    
    try:
        res = supabase.table("users").insert(user_data).execute()
        bot_id = res.data[0]['id']
        print(f"    -> Bot Created: {bot_id}")
    except Exception as e:
        print(f"    ❌ Failed to create bot user: {e}")
        return

    # Generate a token for the bot
    token = jwt.encode({
        "user_id": bot_id,
        "username": bot_username,
        "exp": time.time() + 3600
    }, SECRET_KEY, algorithm=ALGORITHM)
    
    auth_header = {"Authorization": f"Bearer {token}"}

    # 2. Setup: Create a Trap Rumor
    print("[2/4] Creating Trap Rumor...")
    try:
        rumor_res = supabase.table("rumors").insert({
            "content": f"This is a honeypot trap rumor {uuid.uuid4().hex[:4]}",
            "author_id": bot_id, 
            "is_trap": True
        }).execute()
        trap_rumor_id = rumor_res.data[0]['id']
        print(f"    -> Trap Rumor Created: {trap_rumor_id}")
    except Exception as e:
        print(f"    ❌ Failed to create trap rumor. Did you run the migration? Error: {e}")
        return

    # 3. Action: Bot votes on Trap Rumor
    print("[3/4] Bot attempting to vote on Trap Rumor...")
    vote_payload = {
        "rumor_id": trap_rumor_id,
        "vote": True,
        "prediction": 1.0
    }
    
    response = client.post("/api/vote", json=vote_payload, headers=auth_header)
    
    # Check Gaslighting: Should return 200 OK
    print(f"    -> API Response Status: {response.status_code}")
    print(f"    -> API Response Body: {response.json()}")
    
    if response.status_code == 200:
        print("    ✅ Gaslighting Successful (Bot received 200 OK)")
    else:
        print(f"    ❌ FAILED: API should return 200, got {response.status_code}")

    # 4. Verification: Check API/DB for Ban
    print("[4/4] Verifying Ban Status...")
    user_res = supabase.table("users").select("is_banned, trust_score").eq("id", bot_id).execute()
    user_data = user_res.data[0]
    
    is_banned = user_data.get('is_banned')
    trust_score = user_data.get('trust_score')
    
    print(f"    -> Bot Status: is_banned={is_banned}, trust_score={trust_score}")
    
    if is_banned is True and trust_score == -1.0:
        print("    ✅ SUCCESS: Bot was banned and trust score nuked.")
    else:
        print("    ❌ FAILED: Bot was not banned correctly.")

if __name__ == "__main__":
    test_honeypot_logic()
