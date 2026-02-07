// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, ShieldCheck, Activity, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// Dynamically import ForceGraph to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="text-cyan-500 animate-pulse">Initializing Trust Network...</div>,
});

export default function DashboardPage() {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [stats, setStats] = useState({ total: 0, highTrust: 0, lowTrust: 0, avgTrust: 0 });
    const [loading, setLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState(null);
    const fgRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/graph");
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const graphData = await res.json();
            console.log("Graph data loaded:", graphData);
            setData(graphData);

            // Calculate Stats
            const total = graphData.nodes.length;
            const highTrust = graphData.nodes.filter((n: any) => n.type === "HIGH_TRUST" || n.type === "GENESIS").length;
            const lowTrust = graphData.nodes.filter((n: any) => n.type === "LOW_TRUST").length;
            const totalScore = graphData.nodes.reduce((acc: number, n: any) => acc + (n.val || 0), 0);
            const avgTrust = total > 0 ? (totalScore / total).toFixed(4) : 0;

            setStats({ total, highTrust, lowTrust, avgTrust: Number(avgTrust) });
        } catch (e) {
            console.error("Failed to fetch graph data:", e);
            setData({ nodes: [], links: [] });
            setStats({ total: 0, highTrust: 0, lowTrust: 0, avgTrust: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Zoom controls
    const handleZoomIn = () => {
        if (fgRef.current) {
            fgRef.current.zoom(fgRef.current.zoom() * 1.2, 400);
        }
    };

    const handleZoomOut = () => {
        if (fgRef.current) {
            fgRef.current.zoom(fgRef.current.zoom() / 1.2, 400);
        }
    };

    const handleCenterView = () => {
        if (fgRef.current) {
            fgRef.current.zoomToFit(400, 50);
        }
    };

    // Node custom rendering
    const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Safety check: skip if node has invalid position
        if (!node || !isFinite(node.x) || !isFinite(node.y)) {
            return;
        }

        const label = node.id.substring(0, 8);
        const fontSize = 12 / globalScale;
        const isHovered = hoveredNode?.id === node.id;

        // Dynamic node size based on trust score with safety check
        const baseSize = 4;
        const trustValue = (node.val && isFinite(node.val)) ? node.val : 0;
        const sizeMultiplier = Math.max(1, trustValue * 10000); // Scale up for visibility
        const nodeSize = baseSize + sizeMultiplier;





        // Colors
        const hexColor = node.type === "GENESIS" ? "#00f3ff"
            : node.type === "HIGH_TRUST" ? "#00ff9d"
                : "#ff0055";

        // 1. Draw "Bubble" Body (Transparent Fill)
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
        ctx.fillStyle = hexColor + "22"; // 13% opacity (very transparent)
        ctx.fill();

        // 2. Draw Border/Stroke (Glowy)
        ctx.strokeStyle = hexColor + (isHovered ? "ff" : "44");
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();

        // 3. Draw Specular Highlight (The "Bubbly" Reflection)
        ctx.beginPath();
        const reflectionSize = nodeSize * 0.4;
        const reflectionX = node.x - nodeSize * 0.3;
        const reflectionY = node.y - nodeSize * 0.3;
        ctx.arc(reflectionX, reflectionY, reflectionSize, 0, 2 * Math.PI);
        const grad = ctx.createLinearGradient(reflectionX, reflectionY - reflectionSize, reflectionX, reflectionY + reflectionSize);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.6)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fill();

        // 4. Glow effect on hover
        if (isHovered) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = hexColor;
            ctx.fillStyle = hexColor + "55"; // Darker fill on hover
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset
        }

        // Reset shadow
        ctx.shadowBlur = 0;

        // Label (only show on hover or for genesis)
        if (isHovered || node.type === "GENESIS") {
            ctx.font = `${fontSize}px Monaco, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(label, node.x, node.y - nodeSize - 8 / globalScale);
        }
    };

    return (
        <div className="relative w-screen h-screen bg-background overflow-hidden font-mono text-foreground">
            {/* HEADER */}
            {/* HEADER - Bubbly Transparent Zone */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
                <div className="space-y-4 bg-background/20 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-80 transition-all hover:bg-background/30">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-widest text-center mb-2">
                        Trust Zones
                    </h1>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2"><Activity size={16} className="text-cyan-400" /> Total Nodes</span>
                        <span className="font-bold text-white text-lg">{stats.total}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-400" /> High Trust</span>
                        <span className="font-bold text-green-400 text-lg">{stats.highTrust}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-red-400">⚠️ Low Trust</span>
                        <span className="font-bold text-red-400 text-lg">{stats.lowTrust}</span>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent my-3" />

                    <div className="flex justify-between items-center text-sm">
                        <span>Avg PageRank</span>
                        <span className="font-bold text-cyan-300 text-lg">{stats.avgTrust}</span>
                    </div>

                    {/* Legend */}
                    <div className="pt-3 mt-3 border-t border-cyan-500/20">
                        <div className="text-xs text-cyan-400 mb-2 font-semibold">Node Types:</div>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></div>
                                <span>Genesis (Seed)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></div>
                                <span>High Trust</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400 shadow-lg shadow-red-400/50"></div>
                                <span>Low Trust</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZOOM CONTROLS */}
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-6 py-3 bg-background/20 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 text-cyan-300 transition-all rounded-full uppercase text-xs tracking-wider backdrop-blur-md shadow-lg"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    {loading ? "Syncing..." : "Refresh"}
                </button>

                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={handleZoomIn}
                        className="p-3 bg-background/20 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-110 transition-all rounded-full backdrop-blur-md shadow-lg"
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-3 bg-background/20 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-110 transition-all rounded-full backdrop-blur-md shadow-lg"
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <button
                        onClick={handleCenterView}
                        className="p-3 bg-background/20 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-110 transition-all rounded-full backdrop-blur-md shadow-lg"
                        title="Center View"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* GRAPH CANVAS */}
            <div className="w-full h-full">
                {!loading && data.nodes.length > 0 && (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={data}
                        backgroundColor="transparent"
                        nodeCanvasObject={paintNode}
                        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                            const baseSize = 4;
                            const sizeMultiplier = Math.max(1, node.val * 10000);
                            const nodeSize = baseSize + sizeMultiplier;
                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
                            ctx.fill();
                        }}
                        onNodeHover={(node: any) => setHoveredNode(node)}
                        linkColor={(link: any) => "rgba(100, 200, 255, 0.2)"} // Reduced opacity
                        linkWidth={1.5} // Slightly thinner
                        linkDirectionalParticles={1} // Only 1 particle
                        linkDirectionalParticleWidth={3} // Slightly smaller
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleColor={() => "rgba(0, 243, 255, 0.4)"} // Much more transparent
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        enableNodeDrag={true}
                        enableZoomInteraction={true}
                        enablePanInteraction={true}
                        cooldownTime={3000}
                        onEngineStop={() => {
                            if (fgRef.current) {
                                fgRef.current.zoomToFit(400, 50);
                            }
                        }}
                    />
                )}
            </div>

            {/* HOVER INFO TOOLTIP */}
            {hoveredNode && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                    <div className="bg-black/80 border border-cyan-500/50 rounded-lg px-4 py-3 backdrop-blur-md shadow-2xl shadow-cyan-500/20">
                        <div className="text-cyan-400 text-xs font-semibold mb-1">{hoveredNode.type}</div>
                        <div className="text-white text-sm font-mono">{hoveredNode.id.substring(0, 24)}...</div>
                        <div className="text-cyan-300 text-xs mt-1">Trust Score: {(hoveredNode.val * 100).toFixed(4)}%</div>
                    </div>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && data.nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black z-20">
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse text-2xl tracking-[0.3em] font-bold mb-4">
                        INITIALIZING
                    </div>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && data.nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <div className="text-cyan-500/50 text-xl mb-2">No nodes in the trust network yet</div>
                    <div className="text-gray-500 text-sm">Start by creating users via the invite system</div>
                </div>
            )}
        </div>
    );
}
