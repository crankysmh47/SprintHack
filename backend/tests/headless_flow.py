from fastapi.testclient import TestClient
from backend.main import app, supabase, engine
import time
import uuid

# Initialize Test Client
client = TestClient(app)

def run_headless_test():
    print("🧪 HEADLESS INTEGRATION TEST: The Ripple Protocol")
    print("===============================================")

    # 1. SETUP: Create 3 Users
    # User A (Poster)
    # User B (Friend of A)
    # User C (Stranger, Distance > 2)
    
    print("[1/5] Setting up Test Users (A, B, C)...")
    
    # Helper to clean create user
    def create_test_user(name):
        res = supabase.table("users").insert({}).execute()
        uid = res.data[0]['id']
        print(f"    -> Created {name}: {uid}")
        return uid

    user_a = create_test_user("User A (Poster)")
    user_b = create_test_user("User B (Friend)")
    user_c = create_test_user("User C (Stranger)")

    # 2. SETUP: Create Graph Connections (A <-> B)
    print("\n[2/5] Connecting A <-> B (Trust Edge)...")
    edges = [
        {"source_user": user_a, "target_user": user_b},
        {"source_user": user_b, "target_user": user_a}
    ]
    supabase.table("edges").insert(edges).execute()
    
    # Force Engine to Rebuild Graph
    print("    -> Rebuilding Engine Graph...")
    engine.build_trust_graph()

    # 3. ACTION: User A posts a Rumor
    print("\n[3/5] User A posts a Rumor...")
    rumor_content = f"Headless Test Rumor {uuid.uuid4().hex[:8]}"
    res = client.post("/api/rumor", json={
        "author_id": user_a,
        "content": rumor_content
    })
    assert res.status_code == 200
    rumor_id = res.json()['rumor_id']
    print(f"    -> Rumor Posted: {rumor_id}")

    # 4. VERIFICATION: The Ripple Protocol
    # User B (Friend) should see it (Distance 1)
    # User C (Stranger) should NOT see it (Distance Infinity)
    
    print("\n[4/5] Checking Feeds (The Ripple Protocol)...")
    
    # Check B
    res_b = client.get(f"/api/feed?user_id={user_b}")
    feed_b = res_b.json()['rumors']
    found_b = any(r['id'] == rumor_id for r in feed_b)
    
    # Check C
    res_c = client.get(f"/api/feed?user_id={user_c}")
    feed_c = res_c.json()['rumors']
    found_c = any(r['id'] == rumor_id for r in feed_c)
    
    print(f"    -> User B (Friend) sees rumor? {found_b} (Expected: True)")
    print(f"    -> User C (Stranger) sees rumor? {found_c} (Expected: False)")
    
    if found_b and not found_c:
        print("    ✅ PASS: Ripple Protocol successfully quarantined the rumor to the local cluster.")
    else:
        print("    ❌ FAIL: Logic error in Distance Filtering.")
        return

    # 5. ACTION: Make it Viral (Verify It)
    print("\n[5/5] Testing Viral Upgrade (Verification Bypass)...")
    print("    -> Injecting votes to Verify the rumor...")
    
    # We cheat and update DB directly to simulate mass voting result
    supabase.table("rumors").update({
        "verified_result": True,
        "trust_score": 0.99
    }).eq("id", rumor_id).execute()
    
    print("    -> Rumor is now VERIFIED. Checking User C's feed again...")
    
    # Check C again
    res_c_new = client.get(f"/api/feed?user_id={user_c}")
    feed_c_new = res_c_new.json()['rumors']
    found_c_new = any(r['id'] == rumor_id for r in feed_c_new)
    
    print(f"    -> User C sees rumor now? {found_c_new} (Expected: True)")
    
    if found_c_new:
        print("    ✅ PASS: Viral Protocol worked. Verified rumor broke containment.")
    else:
        print("    ❌ FAIL: Limit did not lift.")

if __name__ == "__main__":
    try:
        run_headless_test()
    except Exception as e:
        print(f"\n❌ TEST CRASHED: {e}")
