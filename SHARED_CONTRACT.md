\# 📜 THE SHARED CONTRACT - READ THIS FIRST

**This is the Bible. If everyone follows this exactly, integration will work.**

---

## 🎯 Project Overview (30-Second Version)

We're building a **decentralized rumor verification system** where:
- Students post anonymous rumors about campus events
- Other students vote True/False on rumors
- **Math** (not admins) determines which rumors are credible
- **Graph theory** prevents bot attacks
- **No central authority** controls the truth

---

## 🗄️ DATABASE SCHEMA (Supabase)

### Table: `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT now()
);
```

### Table: `edges` (The Trust Graph)
```sql
CREATE TABLE edges (
    source_user UUID REFERENCES users(id),
    target_user UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (source_user, target_user)
);
```
**What this means:** If User A invites User B, there's an edge from A → B. This creates the "web of trust."

### Table: `rumors`
```sql
CREATE TABLE rumors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    is_shadowbanned BOOLEAN DEFAULT false,
    verified_result BOOLEAN NULL,
    trust_score FLOAT DEFAULT 0.0
);
```
**Key fields:**
- `is_shadowbanned`: If true, only the author's friends can see it (it failed verification)
- `verified_result`: NULL = pending, TRUE = verified true, FALSE = verified false
- `trust_score`: The confidence score (0.0 to 1.0)

### Table: `votes`
```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    rumor_id UUID REFERENCES rumors(id),
    vote BOOLEAN NOT NULL,
    prediction FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, rumor_id)
);
```
**Key fields:**
- `vote`: TRUE = "I think this rumor is true", FALSE = "I think it's false"
- `prediction`: 0.0 to 1.0 = "What % of people do I think will vote TRUE?"

---

## 🔌 API ENDPOINTS (FastAPI)

**Base URL:** `http://localhost:8000`

### 1. Create New User (Invite System)
```http
POST /api/join?invite_code={inviter_user_id}
```
**Response:**
```json
{
    "user_id": "uuid-of-new-user",
    "message": "Welcome! You were invited by user X"
}
```
**What happens:** Creates a new user + an edge from inviter → new user.

---

### 2. Get Feed (Personalized Rumors)
```http
GET /api/feed?user_id={current_user_id}
```
**Response:**
```json
{
    "rumors": [
        {
            "id": "rumor-uuid",
            "content": "The cafeteria is serving pizza tomorrow!",
            "verified_result": null,
            "trust_score": 0.0,
            "distance": 1
        }
    ]
}
```
**Logic:** Only returns rumors within graph distance ≤ 2 from the user (unless viral).

---

### 3. Submit Vote
```http
POST /api/vote
Content-Type: application/json

{
    "user_id": "uuid",
    "rumor_id": "uuid",
    "vote": true,
    "prediction": 0.75
}
```
**Response:**
```json
{
    "message": "Vote recorded",
    "current_votes": 12
}
```

---

### 4. Get Rumor Status (After Voting)
```http
GET /api/status/{rumor_id}
```
**Response:**
```json
{
    "rumor_id": "uuid",
    "verified_result": true,
    "trust_score": 0.87,
    "total_votes": 25,
    "status": "verified"
}
```
**Possible status values:** `"pending"`, `"verified"`, `"disputed"`, `"shadowbanned"`

---

### 5. Post New Rumor
```http
POST /api/rumor
Content-Type: application/json

{
    "author_id": "user-uuid",
    "content": "String of the rumor text"
}
```
**Response:**
```json
{
    "rumor_id": "uuid",
    "message": "Rumor posted successfully"
}
```

---

## 🧮 THE MATH (Simplified for Hackathon)

### Phase 1: Calculate User Trust (PageRank)
```python
import networkx as nx

# Build graph from edges table
G = nx.DiGraph()
G.add_edges_from([(source, target) for source, target in edges])

# Run PageRank
trust_ranks = nx.pagerank(G, alpha=0.85)
# Result: { user_id: weight } where weights sum to 1.0
```

### Phase 2: Resolve Rumor (Surprisingly Popular Algorithm)
```python
def resolve_rumor(votes, trust_ranks):
    weighted_true = 0
    weighted_false = 0
    avg_prediction = 0
    
    for vote in votes:
        weight = trust_ranks.get(vote.user_id, 0.01)  # Default tiny weight for unknown users
        
        if vote.vote == True:
            weighted_true += weight
        else:
            weighted_false += weight
        
        avg_prediction += vote.prediction
    
    total_weight = weighted_true + weighted_false
    actual_pct_true = weighted_true / total_weight if total_weight > 0 else 0
    avg_prediction = avg_prediction / len(votes) if votes else 0.5
    
    # Surprisingly Popular Logic
    if actual_pct_true > avg_prediction:
        return True  # More people said TRUE than expected → probably true
    else:
        return False  # Fewer people said TRUE than expected → probably false
```

---

## 🎨 UI/UX FLOW (Frontend)

### The Swipe Interface
```
┌─────────────────────────────────┐
│  "The cafeteria is serving      │
│   pizza tomorrow!"              │
│                                 │
│  [Swipe Left = FALSE]           │
│  [Swipe Right = TRUE]           │
└─────────────────────────────────┘

After swipe, show slider:

How confident are you?
├────────●────────────┤
0%   Most people    100%
     will agree
```

**Translation to API:**
- Swipe Right → `vote: true`
- Slider at 75% → `prediction: 0.75`

---

## 📦 WHAT EACH DEV DELIVERS

| Dev | Deliverable | Format |
|-----|-------------|--------|
| **Dev 1** | Backend API (FastAPI) | Running server on `localhost:8000` |
| **Dev 2** | Supabase DB + Seed Data | Connection URL + API Key |
| **Dev 3** | Frontend UI (Next.js) | Running app on `localhost:3000` |
| **Dev 4** | API Integration Layer | `api.ts` file + state management |

---

## ⏱️ TIMELINE (5 Hours)

**Hour 1:** Setup & Foundation  
**Hour 2:** Core Logic  
**Hour 3:** Algorithm Implementation  
**Hour 4:** Integration (EXPECT BUGS)  
**Hour 5:** Demo Polish

---

## 🚨 CRITICAL RULES

1. **DO NOT** change the database schema without telling everyone.
2. **DO NOT** change API endpoint paths without updating this doc.
3. **DO** test your part with mock data before integration.
4. **DO** commit your code every hour with clear messages.

---

## 🧪 TESTING STRATEGY

**Synthetic Test Data** (Dev 2 creates this):
- 200 "honest" users connected in a realistic social graph
- 50 "bot" users connected only to each other
- 10 test rumors (5 true, 5 false)

**Integration Test** (Hour 4):
1. Frontend posts a rumor
2. Backend receives it and returns rumor ID
3. Frontend displays it in the feed
4. User swipes + predicts
5. Backend runs PageRank + SP algorithm
6. Frontend shows "Verified ✓" or "Disputed ✗"

---

## 📞 COMMUNICATION PROTOCOL

**If you're blocked:**
1. Check this doc first
2. Check the other dev's guide
3. Post in the group chat: "Blocked on X, need Y from Dev Z"

**If you need to change the contract:**
1. Propose it in the group chat
2. Get approval from ALL devs
3. Update this doc
4. Notify everyone

---

**Version:** 1.0  
**Last Updated:** Sprint Start  
**Next Review:** Hour 3
