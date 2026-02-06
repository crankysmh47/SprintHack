// app/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { RumorCard } from '@/components/RumorCard';
import { RumorFeedItem } from '@/components/RumorFeedItem';
import { PostRumorModal } from '@/components/PostRumorModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { UserSetupModal } from '@/components/UserSetupModel';
import { Navbar } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { ToastContainer } from '@/components/Toast';
import { useRumors } from '@/lib/hooks/useRumors';
import { useVote } from '@/lib/hooks/useVote';
import { useToast } from '@/lib/hooks/useToast';
import { Rumor, SwipeDirection } from '@/lib/types';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRumor, setSelectedRumor] = useState<Rumor | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  // Load user on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('user_id');
    if (stored) {
      setUserId(stored);
    } else {
      setShowSetup(true);
    }
  }, []);

  const {
    rumors,
    loading,
    usingMockData,
    userTrustRank,
    progress,
    refetch,
  } = useRumors(userId);

  const { submitVote } = useVote(userId, {
    onSuccess: (response) => {
      const ig = response.sp_result.information_gain;
      if (ig > 1.5) {
        addToast('info', 'Surprisingly Popular!', 'Your vote carried extra weight — the SP algorithm detected hidden knowledge.');
      } else {
        addToast('success', 'Vote recorded', `Trust score updated to ${Math.round(response.new_trust_score * 100)}%`);
      }
      // Close modal on success
      setTimeout(() => setSelectedRumor(null), 300);
    },
    onError: () => {
      addToast('warning', 'Vote saved locally', 'Backend is offline — your vote will sync when it reconnects.');
      setSelectedRumor(null);
    },
  });

  const handleVote = useCallback(
    async (direction: SwipeDirection, prediction: number) => {
      if (!selectedRumor || !direction) return;
      await submitVote(selectedRumor.id, direction, prediction);
    },
    [selectedRumor, submitVote]
  );

  const handleUserSetup = (newUserId: string) => {
    setUserId(newUserId);
    setShowSetup(false);
    addToast('success', 'Welcome to the Gauntlet!', `Logged in as ${newUserId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    setUserId(null);
    setShowSetup(true);
  };

  const handlePostSuccess = () => {
    addToast('success', 'Rumor posted!', 'It\'s now live in your Trust Circle (Stage 1).');
    refetch();
  };

  // Hydration guard
  if (!mounted) return null;

  if (showSetup || !userId) {
    return <UserSetupModal onComplete={handleUserSetup} />;
  }

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
            currentIndex={0} // Not relevant in feed mode
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
                onVote={handleVote}
                isTop={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PostRumorModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        userId={userId}
        onSuccess={handlePostSuccess}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}