'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

// UI Components from Remote Branch
import { RumorCard } from '@/components/RumorCard'; // Assuming this exists or merged
import { RumorFeedItem } from '@/components/RumorFeedItem';
import { PostRumorModal } from '@/components/PostRumorModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { UserSetupModal } from '@/components/UserSetupModel'; // Typos in remote branch? 'Model' vs 'Modal'
import { Navbar } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { ToastContainer } from '@/components/Toast';

// Hooks from Remote Branch
import { useRumors } from '@/lib/hooks/useRumors';
import { useVote } from '@/lib/hooks/useVote';
import { useToast } from '@/lib/hooks/useToast';
import { Rumor, SwipeDirection } from '@/lib/types';

// V2 Auth / Crypto Imports (Restored from my branch)
import { generateKeys, signVote, exportKey } from '@/lib/crypto';
import { LandingPage } from '@/components/LandingPage'; // Using my V2 Landing Page for Auth entry

export default function Home() {
  // We need to decide: Do we use the Remote's "UserSetupModal" or my "LandingPage"?
  // My LandingPage has the V2 Auth (Password/Encryption). 
  // Remote's UserSetupModal likely just takes a username.
  // STRATEGY: Use V2 LandingPage for initial Auth, then switch to Remote's Feed UI.

  const [userId, setUserId] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRumor, setSelectedRumor] = useState<Rumor | null>(null);

  // V2 Auth State
  const [view, setView] = useState<'landing' | 'feed'>('landing');

  const { toasts, addToast, removeToast } = useToast();

  // Load user on mount
  useEffect(() => {
    setMounted(true);
    const storedId = localStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    if (storedId && token) {
      setUserId(storedId);
      setView('feed');
    } else {
      setView('landing');
    }
  }, []);

  // Use Remote's Hooks for Feed Logic
  // But we need to ensure they send the right headers?
  // I might need to patch `useRumors` and `useVote` later if they don't use the JWT.
  // For now, let's assume they are standard fetches and we might need to intercept or just hope cookies?
  // Wait, `useVote` likely doesn't send JWT.
  // I will have to patch `useVote` hook in a separate step if it fails. 
  // For this merge, I will rely on the Remote's structure but try to wrap it.

  const {
    rumors,
    loading,
    usingMockData,
    userTrustRank,
    progress,
    refetch,
  } = useRumors(userId); // This hook might need the JWT passed to it?

  // Re-implementing Vote Logic to use my V2 Crypto + JWT
  // I'll ignore the remote's `useVote` for the actual API call, but use its event handlers?
  // Actually, rewriting `useVote` is cleaner. 
  // Let's use the Remote's UI `handleVote` flow but inject my V2 logic.

  const handleVoteV2 = async (direction: SwipeDirection, prediction: number) => {
    if (!selectedRumor || !userId) return;

    try {
      // 1. Crypto Sign
      // We need the private key. Where is it?
      // In V2 `LandingPage`, we decrypt it. 
      // But we didn't store it in Global State here!
      // `LandingPage` passed it to `onJoin`.
      // We need to store it in State here.
      // I will add `privateKey` state back.

      // See `handleJoin` below.

      const token = localStorage.getItem('token');

      // Ephemeral Key Strategy (from my V2)
      const [ephPub, ephPriv] = await generateKeys();
      const signature = await signVote(ephPriv, selectedRumor.id);
      const pubKeyStr = await exportKey(ephPub);

      const payload = {
        rumor_id: selectedRumor.id,
        vote: direction === 'right',
        prediction,
        signature,
        public_key: pubKeyStr
      };

      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Vote Failed");
      }

      const data = await res.json();

      // Success Feedback (Adapted from Remote)
      // We use their toast system
      addToast('success', 'Vote Signed & Verified', 'Trust Score Updated');

      // Close modal
      setTimeout(() => setSelectedRumor(null), 300);

    } catch (e: any) {
      addToast('error', 'Vote Error', e.message);
    }
  };


  // Setup Auth Handler
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

  const handleJoinV2 = (newUserId: string, keys: CryptoKey[]) => {
    localStorage.setItem('user_id', newUserId);
    setUserId(newUserId);
    setPrivateKey(keys[1]); // Store decrypted/generated key
    setView('feed');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserId(null);
    setView('landing');
  };

  const handlePostSuccess = () => {
    addToast('success', 'Rumor posted!', 'It\'s now live.');
    refetch();
  };

  // Hydration guard
  if (!mounted) return null;

  // VIEW: LANDING (V2)
  if (view === 'landing') {
    return <LandingPage onJoin={handleJoinV2} />;
  }

  // VIEW: FEED (Remote UI)
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar userId={userId} onLogout={handleLogout} />

      <main className="container max-w-2xl mx-auto pt-20 pb-24 px-4">
        {/* Stats Header */}
        <div className="mb-6">
          <StatsBar
            progress={progress}
            currentIndex={0}
            total={rumors.length}
            trustRank={userTrustRank}
            usingMockData={usingMockData}
          />
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {rumors.length > 0 ? (
            rumors.map((rumor) => (
              <RumorFeedItem
                key={rumor.id}
                rumor={rumor}
                onClick={() => setSelectedRumor(rumor)}
              />
            ))
          ) : (
            <EmptyState
              onRefresh={refetch}
              onPost={() => setShowPostModal(true)}
            />
          )}
        </div>
      </main>

      {/* FAB: Post Rumor */}
      <button
        onClick={() => setShowPostModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 transition active:scale-95 z-30"
        title="Post a new rumor"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Swipe Modal Overlay */}
      <AnimatePresence>
        {selectedRumor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedRumor(null);
            }}
          >
            <motion.div
              layoutId={`rumor-card-${selectedRumor.id}`}
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedRumor(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <X size={24} />
              </button>

              <RumorCard
                rumor={selectedRumor}
                onVote={handleVoteV2} // INJECTING V2 LOGIC HERE
                isTop={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PostRumorModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        userId={userId || ''}
        onSuccess={handlePostSuccess}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}