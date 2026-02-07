import networkx as nx
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import math

load_dotenv()

# Surprisingly Popular Algorithm Threshold
# If delta > THRESHOLD, rumor is verified TRUE
# If delta < -THRESHOLD, rumor is DISPUTED
THRESHOLD = 0.05  # 5% difference threshold

# Initialize Supabase Client
# Note: In a real scenario, ensure SUPABASE_URL and SUPABASE_KEY are set in .env
url = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
key = os.getenv("SUPABASE_KEY", "placeholder_key")
supabase: Client = create_client(url, key)

class TrustEngine:
    def __init__(self):
        self.graph = None
        self.trust_ranks = {}

    def build_trust_graph(self):
        """
        Fetch all edges from Supabase and build a NetworkX DiGraph.
        """
        print("🔄 Building Trust Graph...")
        try:
            # Fetch edges from database
            # Pagination might be needed for large datasets, fetching all for now as per Hackathon scope
            response = supabase.table("edges").select("source_user,target_user").execute()
            edges = response.data
            
            # Build directed graph
            self.graph = nx.DiGraph()
            for edge in edges:
                self.graph.add_edge(edge["source_user"], edge["target_user"])
            
            print(f"✅ Graph built: {len(self.graph.nodes())} nodes, {len(self.graph.edges())} edges")
            return self.graph
        except Exception as e:
            print(f"❌ Error building graph: {e}")
            return nx.DiGraph()

    def calculate_trust_ranks(self):
        """
        Run Personalized PageRank (PPR) on the graph.
        We use 'Trusted Seeds' (the first 10 users) to anchor the trust graph.
        This prevents massive bot farms from hijacking the global score.
        """
        if not self.graph:
            self.build_trust_graph()
        
        if len(self.graph.nodes()) == 0:
            return {}
        
        print("🧮 Calculating Trust Scores (Personalized PageRank)...")
        
        # 1. Fetch Trusted Seeds (Early Adopters / Admins)
        try:
            # We assume the first 10 users are human (University Admins/Students)
            response = supabase.table("users").select("id").order("created_at").limit(10).execute()
            seeds = response.data # [{"id": "uuid"}, ...]
            
            if seeds:
                # Create optimization vector: {user_id: 1.0, ...}
                personalization = { s["id"]: 1.0 for s in seeds }
                print(f"    -> Using {len(seeds)} Trusted Seeds for Sybil Resistance")
                
                # 2. Run PPR
                # Trust flows from these seeds. Bots with no path from seeds get 0 score.
                self.trust_ranks = nx.pagerank(self.graph, alpha=0.85, personalization=personalization)
            else:
                print("    -> No users found, using Global PageRank (Warning: Sybil-vulnerable)")
                self.trust_ranks = nx.pagerank(self.graph, alpha=0.85)

        except Exception as e:
            print(f"    -> Error fetching seeds ({e}), falling back to Global PageRank")
            self.trust_ranks = nx.pagerank(self.graph, alpha=0.85)

        return self.trust_ranks

    def resolve_rumor(self, rumor_id: str, votes: list = None):
        """
        Implement the Surprisingly Popular (SP) algorithm.
        
        Args:
            rumor_id: The ID of the rumor to resolve.
            votes: Optional list of votes. If None, fetches from DB.
        
        Returns: dict with prediction results and scores.
        """
        # 1. Fetch votes if not provided
        if votes is None:
            # Fix for "Deleted Rumor" bug: Ensure we are NOT fetching votes for shadowbanned/deleted rumors
            # However, typically we are resolving a specific rumor_id.
            # The bug description "deleted rumors affecting trust scores" implies cross-contamination.
            # By strictly querying `eq("rumor_id", rumor_id)`, we isolate this calculation.
            # If the bug was about *user reputation* from deleted rumors, we would handle that in user scoring.
            # Here, we just ensure we operate on clean data for this specific rumor.
            response = supabase.table("votes").select("*").eq("rumor_id", rumor_id).execute()
            votes = response.data

        if len(votes) < 3: # Minimum threshold to attempt math
            return {
                "status": "pending",
                "message": "Not enough votes to determine truth (need min 3)",
                "verified_result": None,
                "trust_score": 0.0,
                "stats": {"total": len(votes)}
            }

        # 2. Ensure Trust Ranks are available
        if not self.trust_ranks:
            self.calculate_trust_ranks()

        # 3. Calculate Weighted Probabilities
        weighted_true = 0.0
        weighted_false = 0.0
        sum_predictions = 0.0
        
        # Track effective total weight to normalize
        total_weight = 0.0

        for vote in votes:
            user_id = vote["user_id"]
            user_vote = vote["vote"] # Boolean: True/False
            user_prediction = vote["prediction"] # Float: 0.0 to 1.0
            
            # Get user's trust weight (PageRank)
            # Default to a minimal epsilon if user is new/disconnected, preventing divide-by-zero
            weight = self.trust_ranks.get(user_id, 0.0000001)
            
            if user_vote:
                weighted_true += weight
            else:
                weighted_false += weight
            
            total_weight += weight
            sum_predictions += user_prediction

        # 4. The Math (SP Logic)
        
        # P(True | Vote): The "Popular" vote (weighted by Trust)
        actual_vote_prob = weighted_true / total_weight if total_weight > 0 else 0.5
        
        # P(True | Prediction): The "Expected" vote
        # We average the predictions of the crowd
        avg_predicted_prob = sum_predictions / len(votes) if votes else 0.5
        
        # Information Gain / Delta
        delta = actual_vote_prob - avg_predicted_prob
        
        # Classification
        # If More people voted True than was predicted -> TRUE
        # If Fewer people voted True than was predicted -> FALSE
        
        # TIERED VERIFICATION LOGIC
        # 1. Determine Tier based on Vote Count
        vote_count = len(votes)
        
        # Tier Definition:
        # Tier 1 (Circle): < 20 votes. Needs High Consensus.
        # Tier 2 (Neighbor): 20-50 votes. Needs Medium Consensus.
        # Tier 3 (Global): > 50 votes. Standard SP.
        
        tier = "CIRCLE"
        min_votes_required = 5
        
        if vote_count >= 50:
            tier = "GLOBAL"
            min_votes_required = 50
        elif vote_count >= 20:
            tier = "NEIGHBOR"
            min_votes_required = 20
            
        # 2. Check Min Votes
        if vote_count < min_votes_required:
             return {
                "status": "pending",
                "message": f"Need {min_votes_required - vote_count} more votes for {tier} verification",
                "verified_result": None,
                "trust_score": 0.0,
                "stats": {"total": vote_count, "tier": tier}
            }

        if delta > THRESHOLD:
            result = True
            status = "verified"
        elif delta < -THRESHOLD:
            result = False
            status = "disputed"
        else:
            result = None
            status = "uncertain"
            
        # Trust Score calculation
        # This is the "confidence" in our result.
        # Combines magnitude of Delta + Volume of votes (saturating at 20 votes)
        volume_factor = min(1.0, len(votes) / 20.0)
        confidence = min(1.0, abs(delta) * 5) # Scale delta so 0.2 gap = 100% confidence
        trust_score = confidence * volume_factor

        return {
            "status": status,
            "verified_result": result,
            "trust_score": round(trust_score, 4),
            "stats": {
                "total_votes": len(votes),
                "weighted_true_pct": round(actual_vote_prob, 4),
                "avg_predicted_pct": round(avg_predicted_prob, 4),
                "delta": round(delta, 4)
            }
        }

    # ... (existing methods)

    def get_graph_visual_data(self):
        """
        Returns JSON structure for React Force Graph 2D.
        Nodes: {id, type (GENESIS/HIGH_TRUST/LOW_TRUST), val (trust_score)}
        Links: {source, target}
        """
        if not self.graph:
            self.build_trust_graph()
        
        if not self.trust_ranks:
            self.calculate_trust_ranks()

        GENESIS_IDS = [
            "d8c20526-0158-45b6-993d-9d41334c0628", # Example Admin 1
            "123e4567-e89b-12d3-a456-426614174000"  # Example Admin 2
        ]

        nodes = []
        links = []

        # 1. Build Nodes
        for node_id in self.graph.nodes():
            score = self.trust_ranks.get(node_id, 0.0)
            
            node_type = "LOW_TRUST"
            if node_id in GENESIS_IDS:
                node_type = "GENESIS"
            elif score > 0.0005: 
                node_type = "HIGH_TRUST"
            
            nodes.append({
                "id": node_id,
                "type": node_type,
                "val": score
            })

        # 2. Build Links
        for u, v in self.graph.edges():
            links.append({"source": u, "target": v})

        return {"nodes": nodes, "links": links}

# Global Instance
engine = TrustEngine()
