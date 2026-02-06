import networkx as nx
import random
import matplotlib.pyplot as plt
import statistics

def run_sybil_proof():
    print("🛡️  RUNNING SYBIL RESISTANCE PROOF 🛡️")
    print("=======================================")
    
    # 1. Setup Parameters
    NUM_HONEST = 50
    NUM_BOTS = 1000  # Massive attack: 20x more bots than humans
    NUM_BRIDGES = 1  # Only 1 foolish honest user trusts a bot
    
    print(f"Scenario:")
    print(f"- Honest Users: {NUM_HONEST}")
    print(f"- Bot Farm: {NUM_BOTS} (Fully connected internal trust)")
    print(f"- Bridge Links (Honest->Bot): {NUM_BRIDGES}")
    
    G = nx.DiGraph()
    
    # 2. Build Honest Network (Scale-Free-ish)
    print("\n[1/4] Building Honest Network...")
    honest_ids = [f"H_{i}" for i in range(NUM_HONEST)]
    G.add_nodes_from(honest_ids)
    
    # Random realistic connections (avg degree ~4)
    for u in honest_ids:
        # Connect to 4 random other honest users
        targets = random.sample(honest_ids, 4)
        for t in targets:
            if u != t:
                G.add_edge(u, t)
                
    # 3. Build Sybil (Bot) Farm
    # Bots trust each other perfectly to maximize their own scores
    print(f"[2/4] Building Bot Farm of {NUM_BOTS} nodes...")
    bot_ids = [f"B_{i}" for i in range(NUM_BOTS)]
    G.add_nodes_from(bot_ids)
    
    # Bots form a dense cluster (Ring + Random) to trap score
    for i in range(NUM_BOTS):
        # Ring connection (guarantees connectivity)
        next_bot = bot_ids[(i + 1) % NUM_BOTS]
        G.add_edge(bot_ids[i], next_bot)
        # Random internal connections
        G.add_edge(bot_ids[i], random.choice(bot_ids))
        
    # 4. The Attack Vector (The Bridges)
    print(f"[3/4] Creating {NUM_BRIDGES} bridge(s) from Honest -> Bot...")
    # This represents a real user getting duped into trusting a bot
    for _ in range(NUM_BRIDGES):
        victim = random.choice(honest_ids)
        attacker = random.choice(bot_ids)
        G.add_edge(victim, attacker)
        print(f"    -> User {victim} trusted Bot {attacker}")
        
    # 5. The Math (Personalized PageRank)
    print("\n[4/4] Calculating Personalized PageRank...")
    
    # CRITICAL FIX: Use Trusted Seeds
    # We assume the first 5 honest users are "Trusted Seeds" (e.g., admins, professors)
    # This anchors the trust graph so random jumps land on HONEST people, not bots.
    seeds = {honest_ids[i]: 1.0 for i in range(5)}
    
    # Run PPR
    ranks = nx.pagerank(G, alpha=0.85, personalization=seeds)
    
    # 6. Analysis
    honest_scores = [ranks[u] for u in honest_ids]
    bot_scores = [ranks[u] for u in bot_ids]
    
    avg_honest = statistics.mean(honest_scores)
    avg_bot = statistics.mean(bot_scores)
    
    total_honest_power = sum(honest_scores)
    total_bot_power = sum(bot_scores)
    
    print("\n🏆 RESULTS 🏆")
    print("---------------------------------------")
    print(f"Avg Honest Trust Score: {avg_honest:.6f}")
    print(f"Avg Bot Trust Score:    {avg_bot:.6f}")
    print(f"Diff Factor:            Honest users are {avg_honest/avg_bot:.1f}x more trusted")
    print("---------------------------------------")
    print(f"Total Network Authority: 1.00")
    print(f"Total Honest Influence:  {total_honest_power:.4f} ({(total_honest_power)*100:.1f}%)")
    print(f"Total Bot Influence:     {total_bot_power:.4f} ({(total_bot_power)*100:.1f}%)")
    
    print("\n📢 CONCLUSION:")
    if total_bot_power < 0.10:
        print("✅ PROOF SUCCESSFUL: Even with 1000 bots vs 50 humans, bots hold < 10% power.")
        print("   The PageRank 'Cut' logic successfully isolated the Sybil cluster.")
    else:
        print("❌ PROOF FAILED: Bots have too much power.")

if __name__ == "__main__":
    run_sybil_proof()
