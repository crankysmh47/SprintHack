import trust_engine

e = trust_engine.engine
print("Building graph...")
e.build_trust_graph()
print("Calculating trust ranks...")
e.calculate_trust_ranks()
print(f"Graph nodes: {len(e.graph.nodes())}")
print(f"Graph edges: {len(e.graph.edges())}")
print("Getting visual data...")
result = e.get_graph_visual_data()
print(f"Result nodes: {len(result['nodes'])}")
print(f"Result links: {len(result['links'])}")
if result['nodes']:
    print(f"Sample node: {result['nodes'][0]}")
if result['links']:
    print(f"Sample link: {result['links'][0]}")
