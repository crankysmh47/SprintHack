// components/LoadingScreen.tsx

'use client';

import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 mx-auto border-4 border-slate-200 border-t-blue-600 rounded-full"
        />
        <div>
          <h2 className="text-xl font-bold text-slate-700">Loading rumors...</h2>
          <p className="text-slate-400 text-sm mt-1">
            Calculating trust scores across the network
          </p>
        </div>
      </div>
    </div>
  );
}