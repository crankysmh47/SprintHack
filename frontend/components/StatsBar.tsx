"use client";

import { motion } from 'framer-motion';
import { TrustBadge } from './TrustBadge';

interface StatsBarProps {
  progress: number;
  currentIndex: number;
  total: number;
  trustRank: number;
  systemStats?: {
    sync_percent: number;
    user_count: number;
    sybil_resistance?: number;
    trust_vector?: number;
    network_latency?: string;
  };
  usingMockData: boolean;
}

export function StatsBar({
  progress,
  currentIndex,
  total,
  trustRank,
  systemStats,
  usingMockData,
}: StatsBarProps) {
  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Mock data warning */}
      {usingMockData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium text-center"
        >
          ⚠️ Backend offline — using mock data
        </motion.div>
      )}

      {/* Trust Rank Header (Sci-Fi / Tech Style) */}
      <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
        <div className="flex flex-col">
          <span className="text-primary font-bold">Global Trust Vector</span>
          <span className="text-[10px] text-muted-foreground/70 lowercase flex items-center gap-2">
            <span>Nodes: {systemStats?.user_count ? (systemStats.user_count / 1000).toFixed(1) + 'k' : '0'}</span>
            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span>Sybil Res: {systemStats?.sybil_resistance || 99}%</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-emerald-400 font-mono">{systemStats?.trust_vector || '0.99'} θ</span>
          <span className="text-[10px] text-muted-foreground/50 lowercase">
            Latency: {systemStats?.network_latency || '12ms'}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }} // Ensure progress is clamped
          transition={{ duration: 1, ease: "circOut" }}
          className={`h-full rounded-full ${usingMockData ? 'bg-amber-500' : 'bg-primary'}`}
          style={{
            boxShadow: '0 0 10px rgba(0,240,255,0.5)'
          }}
        />
      </div>

      {/* Trust Badge Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Your Trust Rank</span>
        <TrustBadge score={trustRank} size="sm" showLabel />
      </div>
    </div>
  );
}