'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

// UI Components from Remote Branch and Local
import { RumorCard } from '@/components/RumorCard';
import { RumorFeedItem } from '@/components/RumorFeedItem';
import { PostRumorModal } from '@/components/PostRumorModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { Navbar } from '@/components/Navbar';
import { StatsBar } from '@/components/StatsBar';
import { ToastContainer } from '@/components/Toast';
import { ThreeBackground } from '@/components/ThreeBackground';
import { TypewriterText } from '@/components/TypewriterText';

// Hooks
import { useRumors } from '@/lib/hooks/useRumors';
import { useVote } from '@/lib/hooks/useVote';
import { useToast } from '@/lib/hooks/useToast';
import { Rumor, SwipeDirection } from '@/lib/types';

// V2 Auth / Crypto Imports
import { generateKeys, signVote, exportKey } from '@/lib/crypto';
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRumor, setSelectedRumor] = useState<Rumor | null>(null);
  const [autoOpenComments, setAutoOpenComments] = useState(false);

  // V2 Auth State
  const [view, setView] = useState<'landing' | 'feed'>('landing');
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  // Load user on mount (V2 Auth Check)
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

  // Hook for Feed Data
  const {
    rumors,
    loading,
    userTrustRank,
    globalStats,
    // progress, // Removed from hook
    refetch,
    // Pagination
    page,
    setPage,
    totalPages,
    sortBy,
    setSortBy
  } = useRumors(userId);

  // V2 Vote Logic (Crypto Signed)
  const handleVoteV2 = async (direction: SwipeDirection, prediction: number) => {
    if (!selectedRumor || !userId) return;

    try {
      const token = localStorage.getItem('token');

      // Ephemeral Key Strategy (V2)
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

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/vote`, {
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

      // Success Feedback
      addToast('success', 'Vote Signed & Verified', 'Trust Score Updated');

      // Close modal
      setTimeout(() => setSelectedRumor(null), 300);

    } catch (e: any) {
      addToast('error', 'Vote Error', e.message);
    }
  };

  // GSAP Entry Animation (From Remote UI)
  useEffect(() => {
    if (mounted && !loading && rumors.length > 0) {
      import("gsap").then((gsap) => {
        gsap.default.fromTo(
          ".rumor-feed-item",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
        );
      });
    }
  }, [mounted, loading, rumors.length]);

  // V2 Auth Handlers
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
    <div className="min-h-screen transition-colors relative overflow-hidden">
      <ThreeBackground />
      <Navbar userId={userId} onLogout={handleLogout} />

      <main className="container max-w-2xl mx-auto pt-24 pb-24 px-4 relative z-10">
        {/* Hero / Greeting */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 font-orbitron tracking-wider text-foreground">
            <TypewriterText text="ENTER THE BLACKBOX" delay={100} />
          </h1>
          <p className="text-muted-foreground">
            Where secrets originate.
          </p>
        </div>

        {/* Stats Header */}
        <div className="mb-6">
          <StatsBar
            progress={rumors.length > 0 ? 100 : 0}
            currentIndex={0}
            total={rumors.length}
            trustRank={userTrustRank}
            systemStats={globalStats}
            usingMockData={false}
          />
        </div>

        {/* Sorting Controls */}
        <div className="flex justify-end gap-2 mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-background border border-border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="popularity">Most Popular</option>
            <option value="relevance">Most Relevant</option>
            <option value="latest">Latest</option>
          </select>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {rumors.length > 0 ? (
            rumors.map((rumor) => {
              if (rumor.is_trap) return null; // HONEYPOT: Trap rumors are invisible to humans

              return (

                // ... existing mapping (unchanged) -> actually I need to preserve the inner code.
                // Since I'm replacing the block, I must re-include the mapping logic exactly.
                <div key={rumor.id} className="rumor-feed-item opacity-0">
                  <RumorFeedItem
                    rumor={rumor}
                    onClick={() => {
                      setSelectedRumor(rumor);
                      setAutoOpenComments(false);
                    }}
                    onDiscuss={() => {
                      setSelectedRumor(rumor);
                      setAutoOpenComments(true);
                    }}
                  />
                </div>
              );
            })
          ) : (
            <EmptyState
              onRefresh={refetch}
              onPost={() => setShowPostModal(true)}
            />
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pb-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 transition hover:bg-secondary/80"
            >
              Previous
            </button>
            <span className="text-sm font-mono text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 transition hover:bg-secondary/80"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* FAB: Post Rumor */}
      <button
        onClick={() => setShowPostModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition active:scale-95 z-30"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
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
                className="absolute -top-12 right-0 p-2 text-foreground/80 hover:text-foreground bg-background/50 hover:bg-background/80 rounded-full transition border border-border"
              >
                <X size={24} />
              </button>

              <RumorCard
                rumor={selectedRumor}
                onVote={handleVoteV2} // INJECTING V2 LOGIC HERE
                isTop={true}
                defaultOpenComments={autoOpenComments}
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