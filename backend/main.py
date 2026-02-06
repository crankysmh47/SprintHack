from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
import os
import networkx as nx
from dotenv import load_dotenv
from supabase import create_client
import bcrypt
import jwt
from datetime import datetime, timedelta

# Import our Math Engine and Crypto
from .trust_engine import engine
from .crypto_utils import verify_signature

load_dotenv()

app = FastAPI(title="Rumor Verification API - Professional V2")

# --- CONFIG ---
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_hackathon_key_12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Allow CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
url = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
key = os.getenv("SUPABASE_KEY", "placeholder_key")
supabase = create_client(url, key)

# --- MODELS ---

class RegisterRequest(BaseModel):
    username: str
    password: str
    invite_code: str
    # Optional Crypto Fields for Roaming
    public_key: Optional[str] = None
    encrypted_priv_key: Optional[dict] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class VoteRequest(BaseModel):
    rumor_id: str
    vote: bool
    prediction: float
    signature: Optional[str] = None
    public_key: Optional[str] = None

class RumorRequest(BaseModel):
    author_id: Optional[str] = None # Optional now, extracted from Token
    content: str

# --- AUTH MIDDLEWARE ---

def get_current_user_id(token: str = Depends(oauth2_scheme)):
    """
    Validates JWT and returns User ID.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "active", "version": "v2_professional"}

# 1. REGISTER
@app.post("/api/register")
def register(req: RegisterRequest):
    print(f"📝 Register Attempt: {req.username} code='{req.invite_code}'")
    try:
        # A. Validate Invite Code
        inviter_res = supabase.table("users").select("id, trust_score").eq("invite_code", req.invite_code).execute()
        
        if not inviter_res.data:
            # CHECK FOR GENESIS BYPASS (For first user)
            if req.invite_code == "GENESIS":
                inviter_id = None # No parent
                print("✅ GENESIS Bypass Accepted")
            else:
                print(f"❌ Invalid Code: {req.invite_code}")
                raise HTTPException(status_code=400, detail="Invalid Invite Code")
        else:
            inviter_id = inviter_res.data[0]['id']
            print(f"✅ Inviter Found: {inviter_id}")

        # B. Check Username
        existing = supabase.table("users").select("id").eq("username", req.username).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Username taken")

        # C. Hash Password
        hashed = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # D. Create User
        user_data = {
            "username": req.username,
            "password_hash": hashed,
            "invited_by": inviter_id,
            "trust_score": 0.5, # Default starting score
            "public_key": req.public_key,
            "encrypted_priv_key": req.encrypted_priv_key
        }
        res = supabase.table("users").insert(user_data).execute()
        new_user = res.data[0]
        new_user_id = new_user['id']

        # E. Record Invite & Create Edges (if not Genesis)
        if inviter_id:
            supabase.table("invites").insert({
                "inviter_id": inviter_id, 
                "invitee_id": new_user_id
            }).execute()
            
            # Edges
            edges = [
                {"source_user": inviter_id, "target_user": new_user_id, "edge_weight": inviter_res.data[0]['trust_score']},
                {"source_user": new_user_id, "target_user": inviter_id, "edge_weight": 0.5}
            ]
            supabase.table("edges").insert(edges).execute()
            engine.build_trust_graph() # Refresh graph

        # F. Generate Token
        token = jwt.encode({
            "user_id": new_user_id,
            "username": new_user['username'],
            "exp": datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        }, SECRET_KEY, algorithm=ALGORITHM)

        return {
            "message": "Welcome to the Verified Network",
            "token": token,
            "user_id": new_user_id,
            "invite_code": new_user['invite_code']
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Register Error: {e}")
        raise HTTPException(status_code=500, detail="Registration System Failure")

# 2. LOGIN
@app.post("/api/login")
def login(req: LoginRequest):
    # A. Fetch User
    res = supabase.table("users").select("*").eq("username", req.username).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    
    user = res.data[0]

    # B. Verify Password
    # Handle legacy plaintext passwords from V1 (if any exist)
    if user['password_hash'] == req.password:
        pass
    elif not bcrypt.checkpw(req.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    # C. Update Last Login (Async)
    supabase.table("users").update({"last_login": datetime.utcnow().isoformat()}).eq("id", user['id']).execute()

    # D. Issue Token
    token = jwt.encode({
        "user_id": user['id'],
        "username": user['username'],
        "exp": datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    }, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "token": token,
        "user_id": user['id'],
        "username": user['username'],
        "trust_score": user['trust_score'],
        "invite_code": user['invite_code'],
        "public_key": user.get('public_key'),
        "encrypted_priv_key": user.get('encrypted_priv_key')
    }

# 3. WEIGHTED VOTE
@app.post("/api/vote")
def cast_vote(vote: VoteRequest, user_id: str = Depends(get_current_user_id)):
    """
    Cast a vote. The weight is determined by the User's CURRENT trust score.
    """
    try:
        # A. Get User's Trust Score
        user_res = supabase.table("users").select("trust_score").eq("id", user_id).execute()
        trust_score = user_res.data[0]['trust_score']

        # B. Insert Vote
        data = {
            "user_id": user_id,
            "rumor_id": vote.rumor_id,
            "vote": vote.vote,
            "prediction": vote.prediction,
            "vote_weight": trust_score # SNAPSHOT of trust at time of vote
        }
        res = supabase.table("votes").insert(data).execute()

        # C. Trigger Analysis (Background)
        # Note: DB triggers handle trust updates, but we still run the algorithm for the Rumor Result
        update_rumor_status(vote.rumor_id)

        return {"message": "Vote Weighted & Recorded", "weight_applied": trust_score}

    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="You already voted on this rumor")
        print(f"Vote Error: {e}")
        raise HTTPException(status_code=500, detail="Vote Failed")

# 4. VERIFY RUMOR (Admin/Oracle Trigger)
@app.post("/api/verify-rumor/{rumor_id}")
def verify_rumor_endpoint(rumor_id: str, verified_as: bool):
    """
    Manually marks a rumor as TRUE/FALSE.
    This fires the DB TRG_VERIFY_RUMOR trigger which updates all trust scores.
    """
    supabase.table("rumors").update({
        "verified_result": verified_as,
        "verification_date": datetime.utcnow().isoformat()
    }).eq("id", rumor_id).execute()

    return {"message": "Verification Signal Broadcast. Trust Scores Updating..."}

# 5. FEED & RUMORS
@app.get("/api/feed")
def get_feed(user_id: Optional[str] = None):
    # Retrieve rumors.
    res = supabase.table("rumors").select("*").order("created_at", desc=True).limit(50).execute()
    return {"rumors": res.data}

@app.post("/api/rumor")
def create_rumor(rumor: RumorRequest, user_id: str = Depends(get_current_user_id)):
    res = supabase.table("rumors").insert({
        "author_id": user_id,
        "content": rumor.content
    }).execute()
    return {"message": "Rumor Posted", "id": res.data[0]['id']}

# 6. USER PROFILE
@app.get("/api/me")
def get_me(user_id: str = Depends(get_current_user_id)):
    res = supabase.table("users").select("*").eq("id", user_id).execute()
    u = res.data[0]
    return {
        "username": u['username'],
        "trust_score": u['trust_score'],
        "invite_code": u['invite_code'],
        "stats": {
            "cast": u.get('total_votes_cast', 0),
            "correct": u.get('correct_votes', 0)
        }
    }

# --- INTERNAL HELPERS ---
def update_rumor_status(rumor_id: str):
    # Call the math engine
    engine.resolve_rumor(rumor_id)
