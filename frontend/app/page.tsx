'use client';

import { useEffect, useState } from 'react';
import { RumorCard } from '@/components/RumorCard';
import { PostModal } from '@/components/PostModal';
import { LandingPage } from '@/components/LandingPage';
import { generateKeys, signVote } from '@/lib/crypto';
import { LogOut } from 'lucide-react';

interface Rumor {
  id: string;
  content: string;
  verified_result: boolean | null;
  trust_score: number;
}

export default function Home() {
  // State
  const [view, setView] = useState<'landing' | 'feed'>('landing');
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Initial Load Check
  useEffect(() => {
    const storedId = localStorage.getItem('user_id');
    // If we have an ID, goes straight to feed. Else Landing.
    // VALIDATION: Must be UUID-like (At least 32 chars)
    if (storedId && storedId.length >= 32) {
      setUserId(storedId);
      // Try to load key (Mocking key load for demo continuity)
      // In real app we would load from IndexedDB here.
      generateKeys().then(([pub, priv]) => setPrivateKey(priv));
      setView('feed');
      fetchFeed(storedId);
    } else {
      // Invalid ID (e.g. "01") -> Clear and force re-join
      localStorage.removeItem('user_id');
      setView('landing');
    }
  }, []);

  const fetchFeed = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/feed?user_id=${uid}`);
      const data = await res.json();
      setRumors(data.rumors || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (newUserId: string, keys: CryptoKey[]) => {
    // Save to storage
    localStorage.setItem('user_id', newUserId);
    setUserId(newUserId);
    setPrivateKey(keys[1]); // Store private key in state
    setView('feed');
    fetchFeed(newUserId);
  };

  const handleLogout = () => {
    if (confirm("Disconnect node? You will lose your identity.")) {
      localStorage.clear();
      setView('landing');
      setUserId(null);
    }
  };

  // Handle vote submission (Crypto Signed)
  const handleVote = async (
    direction: 'left' | 'right',
    prediction: number
  ) => {
    if (!userId || !rumors[currentIndex]) return;

    // Sign if key is available
    let signature = null;
    if (privateKey) {
      signature = await signVote(privateKey, rumors[currentIndex].id);
    }

    const payload = {
      user_id: userId,
      rumor_id: rumors[currentIndex].id,
      vote: direction === 'right',
      prediction,
      signature: signature || undefined
    };

    console.log('Submitting:', payload);

    try {
      await fetch('http://localhost:8000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setCurrentIndex((i) => i + 1);
    } catch {
      alert('Vote failed');
    }
  };

  // VIEWS
  if (view === 'landing') {
    return <LandingPage onJoin={handleJoin} />;
  }

  // Loading state
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading rumors...
      </div>
    );

  // All rumors done
  if (currentIndex >= rumors.length)
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <div className="text-xl font-bold">No more rumors. Go study 📚</div>
        <button onClick={handleLogout} className="text-red-500 underline">Logout</button>
      </div>
    );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 overflow-hidden">
      {/* Header */}
      <div className="mb-8 text-center relative w-full max-w-sm">
        <button
          onClick={handleLogout}
          className="absolute -right-4 top-0 p-2 text-slate-400 hover:text-red-500"
        >
          <LogOut size={20} />
        </button>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          TRUTH OR DARE
        </h1>
        <p className="text-slate-500">
          Swipe right if true. Left if false.
        </p>
      </div>

      {/* Swipe Card */}
      <div className="relative w-full max-w-sm h-96">
        <RumorCard
          key={rumors[currentIndex].id} // remounts card on change
          rumor={rumors[currentIndex]}
          onVote={handleVote}
        />
      </div>

      {/* Post Rumor Button */}
      <div className="mt-10">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg font-bold hover:bg-blue-700 transition"
        >
          <span>+</span> Post Rumor
        </button>
      </div>

      {/* Post Modal */}
      <PostModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}
