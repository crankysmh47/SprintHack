// components/UserSetupModal.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, ArrowRight, Fingerprint } from 'lucide-react';

interface UserSetupModalProps {
  onComplete: (userId: string) => void;
}

export function UserSetupModal({ onComplete }: UserSetupModalProps) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userId.trim();
    if (!trimmed) {
      setError('Please enter a User ID');
      return;
    }
    if (trimmed.length < 3) {
      setError('User ID must be at least 3 characters');
      return;
    }
    localStorage.setItem('user_id', trimmed);
    onComplete(trimmed);
  };

  const handleDemo = () => {
    const demoId = `demo_user_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('user_id', demoId);
    onComplete(demoId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Fingerprint size={48} className="mx-auto text-blue-400 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            TRUTH OR DARE
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Anonymous. Decentralized. Trust-scored.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Enter your anonymous User ID
            </label>
            <div className="relative">
              <UserCircle
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError('');
                }}
                placeholder="e.g., user_alice, node_42"
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>
            )}
            <p className="text-slate-400 text-xs mt-2">
              Use the ID from the seed script (Dev 2), or create a new one.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 active:scale-[0.98]"
          >
            Enter the Gauntlet
            <ArrowRight size={18} />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemo}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition active:scale-[0.98]"
          >
            Try Demo Mode
          </button>
        </form>
      </motion.div>
    </div>
  );
}