// components/EmptyState.tsx

'use client';

import { motion } from 'framer-motion';
import { Inbox, RefreshCw, PenSquare } from 'lucide-react';

interface EmptyStateProps {
  onRefresh: () => void;
  onPost: () => void;
}

export function EmptyState({ onRefresh, onPost }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center text-center space-y-6 p-8"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <Inbox size={64} className="text-slate-300" strokeWidth={1.5} />
      </motion.div>

      <div>
        <h2 className="text-2xl font-black text-slate-700">All caught up!</h2>
        <p className="text-slate-400 mt-2 max-w-xs">
          You've reviewed every rumor in your network. Come back later or post
          your own.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition active:scale-95"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
        <button
          onClick={onPost}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 active:scale-95"
        >
          <PenSquare size={18} />
          Post Rumor
        </button>
      </div>
    </motion.div>
  );
}