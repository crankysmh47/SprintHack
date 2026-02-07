import os
from dotenv import load_dotenv
from supabase import create_client
import networkx as nx

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

print("COMPREHENSIVE GRAPH DEBUG")
print("="*60)

# 1. Check users
print("\n1. CHECKING USERS...")
users = supabase.table("users").select("id, username, invited_by").execute()
print(f"Total users: {len(users.data)}")
if users.data:
    print(f"Sample user: {users.data[0]}")
    genesis_users = [u for u in users.data if u.get('invited_by') is None]
    print(f"Genesis users (invited_by=NULL): {len(genesis_users)}")
    if genesis_users:
        print(f"Genesis user IDs: {[u['id'] for u in genesis_users[:3]]}")

# 2. Check edges
print("\n2. CHECKING EDGES...")
edges = supabase.table("edges").select("source_user, target_user").execute()
print(f"Total edges: {len(edges.data)}")
if edges.data:
    print(f"Sample edge: {edges.data[0]}")

# 3. Try building graph
print("\n3. BUILDING NETWORKX GRAPH...")
try:
    G = nx.DiGraph()
    for edge in edges.data:
        G.add_edge(edge["source_user"], edge["target_user"])
    print(f"SUCCESS - Graph built")
    print(f"Nodes: {len(G.nodes())}")
    print(f"Edges: {len(G.edges())}")
except Exception as e:
    print(f"ERROR building graph: {e}")

# 4. Try PageRank
print("\n4. CALCULATING PAGERANK...")
try:
    if len(G.nodes()) > 0:
        genesis_ids = set([u["id"] for u in users.data if u.get('invited_by') is None])
        if genesis_ids:
            personalization = {gid: 1.0 for gid in genesis_ids}
            trust_ranks = nx.pagerank(G, alpha=0.85, personalization=personalization)
            print(f"SUCCESS - PageRank calculated with {len(genesis_ids)} seeds")
        else:
            trust_ranks = nx.pagerank(G, alpha=0.85)
            print(f"SUCCESS - PageRank calculated (global)")
            
        # Count node types
        high_trust_count = sum(1 for score in trust_ranks.values() if score > 0.0005)
        print(f"High trust nodes: {high_trust_count}")
    else:
        print(f"WARNING - Graph is empty")
except Exception as e:
    print(f"ERROR calculating PageRank: {e}")

# 5. Simulate get_graph_visual_data
print("\n5. SIMULATING get_graph_visual_data()...")
try:
    nodes = []
    links = []
    
    genesis_ids_set = set([u["id"] for u in users.data if u.get('invited_by') is None])
    
    for node_id in G.nodes():
        score = trust_ranks.get(node_id, 0.0)
        node_type = "LOW_TRUST"
        if node_id in genesis_ids_set:
            node_type = "GENESIS"
        elif score > 0.0005:
            node_type = "HIGH_TRUST"
        
        nodes.append({
            "id": node_id,
            "type": node_type,
            "val": score
        })
    
    for u, v in G.edges():
        links.append({"source": u, "target": v})
    
    print(f"Result nodes: {len(nodes)}")
    print(f"Result links: {len(links)}")
    
    # Count by type
    genesis_count = sum(1 for n in nodes if n['type'] == 'GENESIS')
    high_count = sum(1 for n in nodes if n['type'] == 'HIGH_TRUST')
    low_count = sum(1 for n in nodes if n['type'] == 'LOW_TRUST')
    print(f"GENESIS: {genesis_count}, HIGH_TRUST: {high_count}, LOW_TRUST: {low_count}")
    
except Exception as e:
    print(f"ERROR simulating visual data: {e}")

print("\nDEBUG COMPLETE")

