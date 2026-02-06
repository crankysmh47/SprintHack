"use client";

import { motion } from 'framer-motion';
import { TrustBadge } from './TrustBadge';

interface StatsBarProps {
  progress: number;
  currentIndex: number;
  total: number;
  trustRank: number;
  usingMockData: boolean;
}

export function StatsBar({
  progress,
  currentIndex,
  total,
  trustRank,
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

      {/* Trust Rank Header */}
      <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
        <span>Trust Database</span>
        <span className="text-primary">{Math.round(trustRank * 100)}% Synced</span>
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