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
    usingMockData,
    userTrustRank,
    progress,
    refetch,
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
              <div key={rumor.id} className="rumor-feed-item opacity-0">
                <RumorFeedItem
                  rumor={rumor}
                  onClick={() => setSelectedRumor(rumor)}
                />
              </div>
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