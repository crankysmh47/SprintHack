from trust_engine import engine

print("Testing trust engine directly...")
print("1. Building graph...")
graph = engine.build_trust_graph()
print(f"   Nodes in graph: {len(graph.nodes()) if graph else 0}")
print(f"   Edges in graph: {len(graph.edges()) if graph else 0}")

print("\n2. Calculating trust ranks...")
ranks = engine.calculate_trust_ranks()
print(f"   Trust ranks calculated: {len(ranks) if ranks else 0}")

print("\n3. Getting visual data...")
data = engine.get_graph_visual_data()
print(f"   Nodes returned: {len(data['nodes'])}")
print(f"   Links returned: {len(data['links'])}")

if data['nodes']:
    print(f"\n4. Sample data:")
    print(f"   First node: {data['nodes'][0]}")
if data['links']:
    print(f"   First link: {data['links'][0]}")
