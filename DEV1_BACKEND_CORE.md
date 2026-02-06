# 🧮 DEV 1: THE MATHEMATICIAN (Backend Core Logic)

**Your Role:** You are the brain of the system. You don't touch the UI. You don't care about databases. You receive clean data and return mathematical truth.

**Your Deliverable:** A running FastAPI server on `localhost:8000` with endpoints that implement PageRank and the Surprisingly Popular algorithm.

---

## 🎯 What You're Building

You're implementing **two core algorithms**:

1. **PageRank** - Assigns "trust weights" to users based on the social graph
2. **Surprisingly Popular (SP)** - Determines if a rumor is true/false by comparing actual votes vs. predictions

**Why this matters:** This prevents bot attacks and majority-rule failures.

---

## 🛠️ Setup (15 minutes)

### Step 1: Install Dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install fastapi uvicorn networkx pandas python-dotenv supabase
```

### Step 2: Project Structure
Create these files:
```
backend/
├── main.py          # FastAPI app
├── trust_engine.py  # Your core algorithms
├── .env             # Environment variables
└── requirements.txt # Dependencies
```

### Step 3: Get Database Credentials
**Ask Dev 2 for:**
- Supabase URL
- Supabase API Key

Create `.env`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
```

---

## 📝 TASK 1: Build the Trust Graph (30 minutes)

**File:** `trust_engine.py`

```python
import networkx as nx
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def build_trust_graph():
    """
    Fetch all edges from Supabase and build a NetworkX DiGraph.
    Returns: nx.DiGraph
    """
    # Fetch edges from database
    response = supabase.table("edges").select("*").execute()
    edges = response.data
    
    # Build directed graph
    G = nx.DiGraph()
    for edge in edges:
        G.add_edge(edge["source_user"], edge["target_user"])
    
    print(f"Graph built: {len(G.nodes())} nodes, {len(G.edges())} edges")
    return G

def calculate_trust_ranks(graph):
    """
    Run PageRank on the graph.
    Returns: dict of {user_id: trust_weight}
    """
    if len(graph.nodes()) == 0:
        return {}
    
    # Run PageRank with standard damping factor
    trust_ranks = nx.pagerank(graph, alpha=0.85)
    
    print(f"PageRank calculated for {len(trust_ranks)} users")
    print(f"Top 5 trusted users: {sorted(trust_ranks.items(), key=lambda x: x[1], reverse=True)[:5]}")
    
    return trust_ranks
```

**Test it:**
```python
if __name__ == "__main__":
    graph = build_trust_graph()
    ranks = calculate_trust_ranks(graph)
    print(f"Sample rank: {list(ranks.items())[0]}")
```

**Expected output:**
```
Graph built: 200 nodes, 487 edges
PageRank calculated for 200 users
Top 5 trusted users: [('uuid1', 0.0087), ('uuid2', 0.0081), ...]
```

---

## 📝 TASK 2: Implement the SP Algorithm (45 minutes)

**Add to `trust_engine.py`:**

```python
def resolve_rumor(rumor_id: str, trust_ranks: dict):
    """
    Implement the Surprisingly Popular algorithm.
    
    Logic:
    1. Fetch all votes for this rumor
    2. Weight each vote by the user's PageRank
    3. Calculate actual % who voted TRUE
    4. Calculate average prediction
    5. If actual > predicted → TRUE, else → FALSE
    
    Returns: dict with result and metadata
    """
    # Fetch votes
    response = supabase.table("votes").select("*").eq("rumor_id", rumor_id).execute()
    votes = response.data
    
    if len(votes) < 5:
        return {
            "status": "pending",
            "message": "Not enough votes yet (minimum 5)",
            "verified_result": None,
            "trust_score": 0.0,
            "total_votes": len(votes)
        }
    
    # Calculate weighted votes
    weighted_true = 0.0
    weighted_false = 0.0
    total_prediction = 0.0
    
    for vote in votes:
        user_id = vote["user_id"]
        user_vote = vote["vote"]
        user_prediction = vote["prediction"]
        
        # Get trust weight (default to small value if user not in graph)
        weight = trust_ranks.get(user_id, 0.001)
        
        if user_vote:
            weighted_true += weight
        else:
            weighted_false += weight
        
        total_prediction += user_prediction
    
    total_weight = weighted_true + weighted_false
    
    # Calculate actual percentage (weighted)
    actual_pct_true = weighted_true / total_weight if total_weight > 0 else 0.5
    
    # Calculate average prediction
    avg_prediction = total_prediction / len(votes)
    
    # Surprisingly Popular Logic
    information_gain = actual_pct_true - avg_prediction
    
    if information_gain > 0.05:  # At least 5% more than expected
        result = True
        status = "verified"
    elif information_gain < -0.05:
        result = False
        status = "disputed"
    else:
        result = None
        status = "uncertain"
    
    # Trust score: how confident we are (based on vote count and information gain)
    trust_score = min(1.0, abs(information_gain) * len(votes) / 20)
    
    return {
        "status": status,
        "verified_result": result,
        "trust_score": round(trust_score, 2),
        "total_votes": len(votes),
        "actual_pct_true": round(actual_pct_true, 2),
        "avg_prediction": round(avg_prediction, 2),
        "information_gain": round(information_gain, 2)
    }
```

**Test it manually:**
```python
# After Dev 2 seeds the database with test votes
graph = build_trust_graph()
ranks = calculate_trust_ranks(graph)
result = resolve_rumor("some-rumor-uuid", ranks)
print(result)
```

---

## 📝 TASK 3: Create the FastAPI Endpoints (30 minutes)

**File:** `main.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from trust_engine import build_trust_graph, calculate_trust_ranks, resolve_rumor
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Cache PageRank (recalculate every 10 minutes in production)
trust_ranks_cache = {}

class VoteRequest(BaseModel):
    user_id: str
    rumor_id: str
    vote: bool
    prediction: float

@app.get("/")
def read_root():
    return {"message": "Truth Engine API v1.0"}

@app.post("/api/vote")
def submit_vote(request: VoteRequest):
    """Submit a vote on a rumor."""
    try:
        # Insert vote into database
        supabase.table("votes").insert({
            "user_id": request.user_id,
            "rumor_id": request.rumor_id,
            "vote": request.vote,
            "prediction": request.prediction
        }).execute()
        
        # Get updated vote count
        response = supabase.table("votes").select("*").eq("rumor_id", request.rumor_id).execute()
        vote_count = len(response.data)
        
        return {
            "message": "Vote recorded",
            "current_votes": vote_count
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/status/{rumor_id}")
def get_rumor_status(rumor_id: str):
    """Get the verification status of a rumor."""
    # Rebuild graph and recalculate PageRank
    graph = build_trust_graph()
    trust_ranks = calculate_trust_ranks(graph)
    
    # Run SP algorithm
    result = resolve_rumor(rumor_id, trust_ranks)
    
    # Update database if status changed
    if result["verified_result"] is not None:
        supabase.table("rumors").update({
            "verified_result": result["verified_result"],
            "trust_score": result["trust_score"]
        }).eq("id", rumor_id).execute()
    
    return result

@app.get("/api/debug/pagerank")
def debug_pagerank():
    """Debug endpoint to see PageRank values."""
    graph = build_trust_graph()
    ranks = calculate_trust_ranks(graph)
    
    # Return top 10 users
    top_users = sorted(ranks.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_users": len(ranks),
        "top_10": [{"user_id": uid, "rank": rank} for uid, rank in top_users]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🧪 Testing Your Work

### Test 1: Server Starts
```bash
python main.py
```
Expected: `Uvicorn running on http://0.0.0.0:8000`

### Test 2: Debug PageRank
Visit: `http://localhost:8000/api/debug/pagerank`

Expected output:
```json
{
    "total_users": 200,
    "top_10": [
        {"user_id": "uuid1", "rank": 0.0087},
        ...
    ]
}
```

### Test 3: Vote Submission (use Postman or curl)
```bash
curl -X POST http://localhost:8000/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "valid-uuid-from-dev2",
    "rumor_id": "valid-rumor-uuid",
    "vote": true,
    "prediction": 0.8
  }'
```

### Test 4: Check Status
```bash
curl http://localhost:8000/api/status/valid-rumor-uuid
```

---

## 📊 What to Expect at Integration (Hour 4)

**Dev 3 will call:**
- `POST /api/vote` when user swipes
- `GET /api/status/{rumor_id}` to show verification badges

**Dev 4 will:**
- Wrap your endpoints in `api.ts`
- Handle errors if your server is down

**Your job during integration:**
- Watch the console logs
- If PageRank returns empty dict, check that Dev 2 seeded the edges table
- If SP always returns "pending", check that votes are being inserted

---

## 🚨 Common Issues

**Issue:** PageRank returns empty dict  
**Fix:** Dev 2 hasn't seeded the edges table yet

**Issue:** `supabase.table()` raises auth error  
**Fix:** Check that `.env` has correct URL and Key from Dev 2

**Issue:** Frontend can't reach your API  
**Fix:** Make sure CORS is enabled (it is in the code above)

**Issue:** SP algorithm always says "uncertain"  
**Fix:** Lower the threshold from 0.05 to 0.02 in the `resolve_rumor` function

---

## 📦 Your Deliverable Checklist

- [ ] FastAPI server running on `localhost:8000`
- [ ] `POST /api/vote` endpoint works
- [ ] `GET /api/status/{rumor_id}` returns SP algorithm results
- [ ] `GET /api/debug/pagerank` shows top users
- [ ] Code is commented and pushed to Git
- [ ] `.env.example` file created (without real credentials)

---

## 💡 Optimization Ideas (If You Have Extra Time)

1. **Cache PageRank:** Recalculate only every 10 minutes, not on every request
2. **Add logging:** Use Python's `logging` module to track algorithm decisions
3. **Bot detection:** Add a simple heuristic to flag users who vote >50 times/hour

---

**Questions?** Check `SHARED_CONTRACT.md` or ask in the group chat.
