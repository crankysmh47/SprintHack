"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Copy, RefreshCw, ShieldCheck, Activity } from "lucide-react";

// Dynamically import ForceGraph to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="text-cyan-500">Initializing Matrix...</div>,
});

export default function DashboardPage() {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [stats, setStats] = useState({ total: 0, highTrust: 0, lowTrust: 0, avgTrust: 0 });
    const [loading, setLoading] = useState(true);
    const fgRef = useRef();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/graph");
            const graphData = await res.json();
            setData(graphData);

            // Calculate Stats
            const total = graphData.nodes.length;
            const highTrust = graphData.nodes.filter((n: any) => n.type === "HIGH_TRUST" || n.type === "GENESIS").length;
            const lowTrust = graphData.nodes.filter((n: any) => n.type === "LOW_TRUST").length;
            const totalScore = graphData.nodes.reduce((acc: number, n: any) => acc + (n.val || 0), 0);
            const avgTrust = total > 0 ? (totalScore / total).toFixed(4) : 0;

            setStats({ total, highTrust, lowTrust, avgTrust: Number(avgTrust) });
        } catch (e) {
            console.error("Failed to fetch graph data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden font-mono text-xs">
            {/* HEADER / OVERLAY */}
            <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none select-none">
                <h1 className="text-2xl font-bold text-cyan-500 mb-2 uppercase tracking-widest shadow-neon">
                    Trust Network // God Mode
                </h1>
                <div className="space-y-2 bg-black/80 p-4 border border-cyan-900/50 backdrop-blur-sm rounded-lg text-cyan-100/80 w-64">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><Activity size={14} /> Total Nodes</span>
                        <span className="font-bold text-white">{stats.total}</span>
                    </div>

                    <div className="flex justify-between items-center text-green-400">
                        <span className="flex items-center gap-2"><ShieldCheck size={14} /> High Trust</span>
                        <span className="font-bold">{stats.highTrust}</span>
                    </div>

                    <div className="flex justify-between items-center text-red-400">
                        <span className="flex items-center gap-2">⚠️ Low Trust</span>
                        <span className="font-bold">{stats.lowTrust}</span>
                    </div>

                    <div className="h-px bg-cyan-900/50 my-2" />

                    <div className="flex justify-between items-center">
                        <span>Avg Trust Score</span>
                        <span className="font-bold text-cyan-300">{stats.avgTrust}</span>
                    </div>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="absolute top-6 right-6 z-10 flex gap-4">
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-950/50 border border-cyan-700 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200 transition-all rounded uppercase text-xs tracking-wider backdrop-blur-md"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    {loading ? "Syncing..." : "Refresh Graph"}
                </button>
            </div>

            {/* GRAPH CANVAS */}
            <div className="w-full h-full">
                {/* @ts-ignore */}
                <ForceGraph2D
                    ref={fgRef}
                    graphData={data}
                    backgroundColor="#000000"
                    nodeLabel={(node: any) => \`[\${node.type}] \${node.id} (Trust: \${node.val})\`}
                nodeColor={(node: any) => {
                    if (node.type === "GENESIS") return "#00f3ff"; // Neon Cyan
                    if (node.type === "HIGH_TRUST") return "#00ff9d"; // Neon Green
                    return "#ff0055"; // Neon Red (Low Trust)
                }}
                nodeRelSize={6}
                linkColor={() => "rgba(255,255,255,0.1)"}
                linkWidth={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={d => d.value * 0.001}
        />
            </div>

            {/* LOADING STATE - INITIAL */}
            {loading && data.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="text-cyan-500 animate-pulse text-xl tracking-[0.5em]">
                        INITIALIZING NEURAL LINK...
                    </div>
                </div>
            )}
        </div>
    );
}
