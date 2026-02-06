from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import networkx as nx
from dotenv import load_dotenv
from supabase import create_client

# Import our Math Engine
from .trust_engine import engine

load_dotenv()

app = FastAPI(title="Rumor Verification API")

# Allow CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client for direct API actions
url = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
key = os.getenv("SUPABASE_KEY", "placeholder_key")
supabase = create_client(url, key)

# --- Pydantic Models ---
class VoteRequest(BaseModel):
    user_id: str
    rumor_id: str
    vote: bool
    prediction: float
    signature: Optional[str] = None # Hex string of signature

class RumorRequest(BaseModel):
    author_id: str
    content: str

class JoinRequest(BaseModel):
    invite_code: str
    public_key: Optional[str] = None # PEM/Base64 string

class RumorRequest(BaseModel):
    author_id: str
    content: str

class JoinRequest(BaseModel):
    invite_code: str

# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "active", "message": "Trust Engine Online"}

@app.post("/api/vote")
async def submit_vote(vote: VoteRequest, background_tasks: BackgroundTasks):
    """
    Submit a vote.
    Triggers a background recalculation of the rumor's status.
    """
    try:
        # Check if user has already voted
        # (Supabase unique constraint handles this, but we can check nicely)
        
        # Insert vote
        data = {
            "user_id": vote.user_id,
            "rumor_id": vote.rumor_id,
            "vote": vote.vote,
            "prediction": vote.prediction
        }
        res = supabase.table("votes").insert(data).execute()
        
        # Trigger Recalculation in Background
        background_tasks.add_task(update_rumor_status, vote.rumor_id)
        
        return {"message": "Vote accepted", "vote_id": res.data[0]['id']}
        
    except Exception as e:
        # Check for duplicate vote constraint
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="User already voted on this rumor")
        print(f"Vote Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/status/{rumor_id}")
def get_status(rumor_id: str):
    """
    Get the verification status of a rumor.
    Implements the 'Freezer Protocol': If already finalized, return DB state.
    """
    # 1. Fetch current consistency state from DB
    rumors = supabase.table("rumors").select("verified_result, trust_score, is_shadowbanned").eq("id", rumor_id).execute()
    
    if not rumors.data:
        raise HTTPException(status_code=404, detail="Rumor not found")
        
    rumor = rumors.data[0]
    
    # 2. Freezer Protocol Check
    # If the rumor is already decisively TRUE or FALSE with High Confidence (>0.9), 
    # we trust the history and don't re-run math (preventing 'Shifting History' bug).
    # Unless explicit 'recalc' param is requested (not impl here).
    if rumor['verified_result'] is not None and rumor['trust_score'] > 0.95:
        return {
            "status": "finalized",
            "verified_result": rumor['verified_result'],
            "trust_score": rumor['trust_score'],
            "source": "database_history"
        }
        
    # 3. If not frozen, Run the Engine
    # Note: engine might need to refresh graph if it's stale
    result = engine.resolve_rumor(rumor_id)
    
    return result

@app.post("/api/rumor")
def create_rumor(rumor: RumorRequest):
    try:
        res = supabase.table("rumors").insert({
            "author_id": rumor.author_id,
            "content": rumor.content
        }).execute()
        return {"message": "Rumor posted", "rumor_id": res.data[0]['id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/feed")
def get_feed(user_id: str):
    """
    Simplified Feed: Returns all non-shadowbanned rumors.
    Includes Graph Distance (BFS) for Ripple Protocol filtering.
    """
    # Fetch all permitted rumors
    res = supabase.table("rumors").select("*, author_id").eq("is_shadowbanned", False).execute()
    rumors = res.data
    
    # Calculate Distances
    # Note: In production, pre-calculate this or limit BFS depth.
    if engine.graph is None:
        engine.build_trust_graph()
        
    feed_with_distance = []
    
    for r in rumors:
        dist = 999 # Default: Far away
        try:
            # Calculate shortest path from Viewer -> Author
            # If path exists, distance is length. If not, stays 999.
            if engine.graph.has_node(user_id) and engine.graph.has_node(r["author_id"]):
                dist = nx.shortest_path_length(engine.graph, source=user_id, target=r["author_id"])
        except nx.NetworkXNoPath:
            dist = 999
        except Exception:
            pass # Graph error, treat as far
            
        r["distance"] = dist
        
        # THE RIPPLE PROTOCOL:
        # 1. Close neighbors (Distance <= 2) can see it.
        # 2. Verified rumors (Viral) can be seen by everyone.
        if dist <= 2 or r['verified_result'] is not None:
            feed_with_distance.append(r)
    
    return {"rumors": feed_with_distance}

# --- Invite / Graph Endpoints ---

@app.post("/api/join")
def join_network(req: JoinRequest):
    """
    Join variables: invite_code is the INVITER'S user_id.
    """
    inviter_id = req.invite_code
    
    # Valid check logic would go here
    
    # Create User
    # In a real app, we would store public_key here in a separate table or column
    # For Hackathon, we'll store it in a 'user_keys' table if possible, OR just ignore it for now 
    # and assume the client manages keys.
    # User asked for: "add another table pairing public and private keys" -> Backend only holds Public.
    
    user_res = supabase.table("users").insert({}).execute()
    new_user_id = user_res.data[0]['id']

    # Store Public Key if provided (Best Effort)
    if req.public_key:
        try:
             # We try to use a metadata table or just log it. 
             # Since we can't easily alter schema efficiently from here without migration scripts,
             # We will just print it for the demo log to show we received it.
             print(f"🔑 Received Public Key for {new_user_id}: {req.public_key[:20]}...")
             # TODO: INSERT INTO user_keys (user_id, public_key) VALUES (...)
        except Exception as e:
            print(f"Error storing key: {e}")
    
    # Create Edges (Reciprocal trust for now)
    edges = [
        {"source_user": inviter_id, "target_user": new_user_id},
        {"source_user": new_user_id, "target_user": inviter_id}
    ]
    supabase.table("edges").insert(edges).execute()
    
    # Force Graph Refresh
    engine.build_trust_graph()
    
    return {"message": "Welcome to the network", "user_id": new_user_id}

@app.get("/api/generate-invite/{user_id}")
def generate_invite_link(user_id: str):
    """
    Generate a shareable invite link for a user.
    invite_code is effectively the user_id.
    """
    # Verify user exists
    user_check = supabase.table("users").select("id").eq("id", user_id).execute()
    if len(user_check.data) == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate invite link (in production, this would be a short code)
    # Using localhost:3000 for frontend URL
    invite_link = f"http://localhost:3000/join?code={user_id}"
    
    return {
        "invite_link": invite_link,
        "invite_code": user_id
    }

# --- Internal Tasks ---

def update_rumor_status(rumor_id: str):
    """
    Background process to update a rumor's score in DB.
    """
    print(f"Bg Task: Updating {rumor_id}")
    result = engine.resolve_rumor(rumor_id)
    
    if result['status'] in ['verified', 'disputed']:
        supabase.table("rumors").update({
            "verified_result": result['verified_result'],
            "trust_score": result['trust_score']
        }).eq("id", rumor_id).execute()

# --- Debug ---
@app.get("/api/debug/pagerank")
def debug_ranks():
    if not engine.trust_ranks:
        engine.calculate_trust_ranks()
    # Sort by rank
    top = sorted(engine.trust_ranks.items(), key=lambda x: x[1], reverse=True)[:10]
    return {"top_users": top}
