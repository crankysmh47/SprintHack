// components/StatsBar.tsx

'use client';

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

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', damping: 20 }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 tabular-nums min-w-[3rem] text-right">
          {currentIndex}/{total}
        </span>
      </div>

      {/* Trust rank */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Your Trust Rank</span>
        <TrustBadge score={trustRank} size="sm" showLabel />
      </div>
    </div>
  );
}