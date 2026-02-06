# 🏗️ DEV 2: THE ARCHITECT (Database & Auth)

**Your Role:** You are the foundation. You build the database, seed it with realistic test data, and create the invite system that builds the trust graph.

**Your Deliverable:** A Supabase project with tables created, 200+ seeded users, and invite endpoints working.

---

## 🎯 What You're Building

1. **The Database Schema** - 4 tables that store users, trust edges, rumors, and votes
2. **The Invite System** - URLs that create new users and graph edges
3. **The Seed Data** - A realistic social graph with honest users and bot clusters

**Why this matters:** Without your work, the PageRank algorithm has nothing to operate on.

---

## 🛠️ Setup (20 minutes)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it: `rumor-verifier`
4. Choose a region close to you
5. Set a strong database password (save it!)

### Step 2: Get Credentials
After project is created:
1. Go to Settings → API
2. Copy:
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - `anon` public key (looks like `eyJhbGc...`)

**Share these with ALL devs immediately.**

### Step 3: Create Scripts Folder
```bash
cd backend
mkdir scripts
cd scripts
```

---

## 📝 TASK 1: Create Database Tables (15 minutes)

### Option A: Use Supabase SQL Editor (Recommended)

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Paste this SQL:

```sql
-- Table 1: Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT now()
);

-- Table 2: Trust Graph Edges
CREATE TABLE edges (
    source_user UUID REFERENCES users(id) ON DELETE CASCADE,
    target_user UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (source_user, target_user)
);

-- Table 3: Rumors
CREATE TABLE rumors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    is_shadowbanned BOOLEAN DEFAULT false,
    verified_result BOOLEAN NULL,
    trust_score FLOAT DEFAULT 0.0
);

-- Table 4: Votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rumor_id UUID REFERENCES rumors(id) ON DELETE CASCADE,
    vote BOOLEAN NOT NULL,
    prediction FLOAT NOT NULL CHECK (prediction >= 0 AND prediction <= 1),
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, rumor_id)
);

-- Indexes for performance
CREATE INDEX idx_edges_source ON edges(source_user);
CREATE INDEX idx_edges_target ON edges(target_user);
CREATE INDEX idx_votes_rumor ON votes(rumor_id);
CREATE INDEX idx_rumors_author ON rumors(author_id);
```

4. Click "Run"
5. Verify in "Table Editor" that all 4 tables exist

---

## 📝 TASK 2: Seed Realistic Test Data (60 minutes)

**This is your most important task.** The PageRank algorithm needs a realistic graph to work.

**File:** `backend/scripts/seed_database.py`

This script creates:
- 150 "Honest" users in a scale-free network
- 50 "Bot" users in a tight cluster
- 2 "Bridge" connections between honest/bot networks (for testing containment)
- 10 Rumors (5 True, 5 False)
- 350+ votes with realistic patterns (bots lying, honest users telling truth)

```python
import os
from supabase import create_client
import random
from dotenv import load_dotenv

load_dotenv()

# YOU MUST SET THESE IN your .env file
# SUPABASE_URL=...
# SUPABASE_KEY=...

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def create_users(count):
    """Create N users and return their IDs."""
    users = []
    for i in range(count):
        response = supabase.table("users").insert({}).execute()
        user_id = response.data[0]["id"]
        users.append(user_id)
        if i % 50 == 0:
            print(f"Created {i}/{count} users...")
    print(f"✓ Created {count} users")
    return users

def create_scale_free_graph(users, edges_per_node=3):
    """
    Create a scale-free network (Barabási-Albert model).
    This mimics real social networks where some users have many connections.
    """
    edges = []
    
    # Start with a small fully connected core
    core_size = 5
    for i in range(core_size):
        for j in range(i + 1, core_size):
            edges.append((users[i], users[j]))
            edges.append((users[j], users[i]))  # Reciprocal
    
    # Add remaining users with preferential attachment
    for i in range(core_size, len(users)):
        # New user connects to existing users with preference for high-degree nodes
        targets = random.sample(users[:i], min(edges_per_node, i))
        for target in targets:
            edges.append((users[i], target))
            # 70% chance of reciprocal connection
            if random.random() < 0.7:
                edges.append((target, users[i]))
    
    return edges

def insert_edges(edges):
    """Insert edges in batches."""
    batch_size = 100
    for i in range(0, len(edges), batch_size):
        batch = edges[i:i + batch_size]
        edge_dicts = [{"source_user": src, "target_user": tgt} for src, tgt in batch]
        supabase.table("edges").insert(edge_dicts).execute()
        print(f"Inserted edges {i}-{i+len(batch)}/{len(edges)}")
    print(f"✓ Inserted {len(edges)} edges")

def create_bot_cluster(bot_users):
    """Create a tightly connected bot cluster (Sybil attack simulation)."""
    edges = []
    # Bots all connect to each other
    for i in range(len(bot_users)):
        for j in range(i + 1, len(bot_users)):
            edges.append((bot_users[i], bot_users[j]))
            edges.append((bot_users[j], bot_users[i]))
    return edges

def create_bridge(honest_users, bot_users, num_bridges=2):
    """Create a few connections between honest users and bots."""
    edges = []
    for _ in range(num_bridges):
        honest = random.choice(honest_users)
        bot = random.choice(bot_users)
        edges.append((honest, bot))
    return edges

def seed_rumors(users):
    """Create 10 test rumors."""
    test_rumors = [
        "The library will be open 24/7 during finals week",
        "Free pizza in the student center tomorrow at noon",
        "The dean is resigning next month",
        "New parking structure opening in September",
        "Tuition increasing by 15% next year",
        "Campus WiFi getting upgraded this summer",
        "New CS professor hired from Google",
        "Gym membership becoming free for all students",
        "Cafeteria switching to all organic food",
        "Spring break extended by one week"
    ]
    
    rumor_ids = []
    for content in test_rumors:
        author = random.choice(users)
        response = supabase.table("rumors").insert({
            "content": content,
            "author_id": author
        }).execute()
        rumor_ids.append(response.data[0]["id"])
    
    print(f"✓ Created {len(test_rumors)} test rumors")
    return rumor_ids

def seed_votes(honest_users, bot_users, rumor_ids):
    """Create realistic votes on rumors."""
    votes = []
    
    # Rumor 0-4: True rumors (honest users vote TRUE, bots vote FALSE to attack)
    for rumor_id in rumor_ids[:5]:
        # Honest users vote TRUE (with realistic predictions)
        for user in random.sample(honest_users, min(15, len(honest_users))):
            votes.append({
                "user_id": user,
                "rumor_id": rumor_id,
                "vote": True,
                "prediction": random.uniform(0.6, 0.9)
            })
        
        # Bots vote FALSE (trying to spread misinformation)
        for user in random.sample(bot_users, min(20, len(bot_users))):
            votes.append({
                "user_id": user,
                "rumor_id": rumor_id,
                "vote": False,
                "prediction": random.uniform(0.3, 0.6)
            })
    
    # Rumor 5-9: False rumors (honest users vote FALSE, bots vote TRUE)
    for rumor_id in rumor_ids[5:]:
        # Honest users vote FALSE
        for user in random.sample(honest_users, min(15, len(honest_users))):
            votes.append({
                "user_id": user,
                "rumor_id": rumor_id,
                "vote": False,
                "prediction": random.uniform(0.6, 0.9)
            })
        
        # Bots vote TRUE
        for user in random.sample(bot_users, min(20, len(bot_users))):
            votes.append({
                "user_id": user,
                "rumor_id": rumor_id,
                "vote": True,
                "prediction": random.uniform(0.3, 0.6)
            })
    
    # Insert in batches
    batch_size = 100
    for i in range(0, len(votes), batch_size):
        try:
            batch = votes[i:i + batch_size]
            supabase.table("votes").insert(batch).execute()
            print(f"Inserted votes {i}-{i+len(batch)}/{len(votes)}")
        except Exception as e:
            print(f"Error inserting batch: {e}")
    
    print(f"✓ Created {len(votes)} votes")

def main():
    print("🌱 Starting database seeding...")
    
    # Step 1: Create users
    print("\n📊 Creating users...")
    honest_users = create_users(150)  # Honest network
    bot_users = create_users(50)      # Bot farm
    
    # Step 2: Create honest network (scale-free)
    print("\n🕸️ Creating honest user network...")
    honest_edges = create_scale_free_graph(honest_users, edges_per_node=4)
    insert_edges(honest_edges)
    
    # Step 3: Create bot cluster (fully connected)
    print("\n🤖 Creating bot cluster...")
    bot_edges = create_bot_cluster(bot_users)
    insert_edges(bot_edges)
    
    # Step 4: Create bridges (2 connections between honest and bots)
    print("\n🌉 Creating bridges...")
    bridge_edges = create_bridge(honest_users, bot_users, num_bridges=2)
    insert_edges(bridge_edges)
    
    # Step 5: Create test rumors
    print("\n📰 Creating test rumors...")
    rumor_ids = seed_rumors(honest_users + bot_users)
    
    # Step 6: Seed votes
    print("\n🗳️ Creating test votes...")
    seed_votes(honest_users, bot_users, rumor_ids)
    
    print("\n✅ Database seeding complete!")
    print(f"   Total users: {len(honest_users) + len(bot_users)}")
    print(f"   Total edges: {len(honest_edges) + len(bot_edges) + len(bridge_edges)}")
    print(f"   Total rumors: {len(rumor_ids)}")
    print(f"\n📋 First rumor ID for testing: {rumor_ids[0]}")
    print(f"   Sample user ID: {honest_users[0]}")

if __name__ == "__main__":
    main()
```

---

## 📝 TASK 3: Create Invite System (30 minutes)

**Add to backend `main.py` (Coordinate with Dev 1):**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import secrets

class JoinRequest(BaseModel):
    invite_code: str

@app.post("/api/join")
def join_with_invite(request: JoinRequest):
    """
    Create a new user and connect them to the inviter.
    invite_code is the inviter's user ID.
    """
    inviter_id = request.invite_code
    
    # Verify inviter exists
    inviter_check = supabase.table("users").select("id").eq("id", inviter_id).execute()
    if len(inviter_check.data) == 0:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # Create new user
    new_user = supabase.table("users").insert({}).execute()
    new_user_id = new_user.data[0]["id"]
    
    # Create edge: inviter → new_user
    supabase.table("edges").insert({
        "source_user": inviter_id,
        "target_user": new_user_id
    }).execute()
    
    # Also create reciprocal edge (optional, makes graph symmetric)
    supabase.table("edges").insert({
        "source_user": new_user_id,
        "target_user": inviter_id
    }).execute()
    
    return {
        "user_id": new_user_id,
        "message": f"Welcome! You were invited by {inviter_id[:8]}..."
    }

@app.get("/api/generate-invite/{user_id}")
def generate_invite_link(user_id: str):
    """Generate a shareable invite link for a user."""
    # Verify user exists
    user_check = supabase.table("users").select("id").eq("id", user_id).execute()
    if len(user_check.data) == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate invite link (in production, this would be a short code)
    invite_link = f"http://localhost:3000/join?code={user_id}"
    
    return {
        "invite_link": invite_link,
        "invite_code": user_id
    }
```

---

## 📝 TASK 4: Create the POST Rumor & Feed Endpoints (30 minutes)

**Add to `main.py` (Coordinate with Dev 1):**

```python
class RumorRequest(BaseModel):
    author_id: str
    content: str

@app.post("/api/rumor")
def post_rumor(request: RumorRequest):
    """Create a new rumor."""
    # Verify author exists
    author_check = supabase.table("users").select("id").eq("id", request.author_id).execute()
    if len(author_check.data) == 0:
        raise HTTPException(status_code=404, detail="Author not found")
    
    # Insert rumor
    rumor = supabase.table("rumors").insert({
        "content": request.content,
        "author_id": request.author_id
    }).execute()
    
    rumor_id = rumor.data[0]["id"]
    
    return {
        "rumor_id": rumor_id,
        "message": "Rumor posted successfully"
    }

@app.get("/api/feed")
def get_feed(user_id: str):
    """
    Get personalized feed for a user.
    SIMPLIFIED: Returns all rumors that are NOT shadowbanned.
    TODO V2: Implement graph distance filtering.
    """
    # Fetch all rumors that aren't shadowbanned
    rumors = supabase.table("rumors").select("*").eq("is_shadowbanned", False).execute()
    
    # Format for frontend
    feed_items = []
    for rumor in rumors.data:
        feed_items.append({
            "id": rumor["id"],
            "content": rumor["content"],
            "verified_result": rumor["verified_result"],
            "trust_score": rumor["trust_score"],
            "distance": 1  # Placeholder
        })
    
    return {"rumors": feed_items}
```

---

## 🧪 Testing Your Work

### Test 1: Tables Exist
Go to Supabase dashboard → Table Editor. You should see 4 tables correctly defined.

### Test 2: Seed Data
Run the script:
```bash
python scripts/seed_database.py
```
Check table row counts in Supabase:
- `users`: 200 rows
- `edges`: ~3000 rows
- `rumors`: 10 rows
- `votes`: ~350 rows

### Test 3: Invite System
```bash
# Use a user ID from seed output
curl http://localhost:8000/api/generate-invite/YOUR_USER_ID
```
It should return an invite link.

### Test 4: Post Rumor
```bash
curl -X POST http://localhost:8000/api/rumor \
  -H "Content-Type: application/json" \
  -d '{"author_id": "USER_ID", "content": "Test rumor"}'
```

---

## 📦 Your Deliverable Checklist

- [ ] Supabase project created
- [ ] 4 tables created with correct keys
- [ ] Seed script run successfully
- [ ] Invite endpoints implemented in `main.py`
- [ ] Rumor & Feed endpoints implemented in `main.py`
- [ ] `.env` shared with team

---

**Questions?** Check `SHARED_CONTRACT.md` or ask in the group chat.
