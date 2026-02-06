'use client';

import { useEffect, useState } from 'react';
import { RumorCard } from '@/components/RumorCard';
import { PostModal } from '@/components/PostModal';

interface Rumor {
  id: string;
  content: string;
  verified_result: boolean | null;
  trust_score: number;
}

// Imports
import { generateKeys, exportKey, signVote } from '@/lib/crypto';

export default function Home() {
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 1. On Mount: Identity & Feed
  useEffect(() => {
    async function init() {
      // Identity Check
      let storedId = localStorage.getItem('user_id');
      const storedKey = localStorage.getItem('app_private_key'); // In real app, store in IndexedDB (non-extractable)

      // If we don't have an ID, use the Test User (Dev 2 Sample) for smoother demo/testing
      if (!storedId) {
        // storedId = prompt('Enter your User ID (from seed script):') || null;
        storedId = "4a1f987a-e66d-459f-8c51-ad40fd10ee69";
        if (storedId) localStorage.setItem('user_id', storedId);
      }
      setUserId(storedId);

      // Generate Keys if missing (simulating "Device Registration")
      // We assume every "User ID" has an associated Key Pair on this device
      // In production: You'd sync this.
      if (!storedKey && storedId) {
        console.log("🔐 Generating new KeyPair...");
        const [pub, priv] = await generateKeys();
        setPrivateKey(priv);
        // TODO: Send Public Key to Backend to register it? 
        // For now, we just proceed to signing.
      }

      // Fetch Feed
      if (storedId) {
        try {
          const res = await fetch(`http://localhost:8000/api/feed?user_id=${storedId}`);
          const data = await res.json();
          setRumors(data.rumors || []);
        } catch (e) {
          console.error("Feed Error:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Handle vote submission (Crypto Signed)
  const handleVote = async (
    direction: 'left' | 'right',
    prediction: number
  ) => {
    if (!userId || !rumors[currentIndex]) return;

    // Default legacy flow (if no key logic ready) or Crypto flow?
    // User requested: "Mix postid with private key... store hash"
    // We will send: { vote, prediction, signature, user_id }

    // NOTE: Accessing private key from state (in a real app, use IndexedDB)
    // For this prototype, we'll mock the signature if key isn't ready, OR implement it if we stored it properly.
    // Since we didn't fully implement IndexedDB storage in step 1, let's assume we generated it in memory or skip signing if missing.

    // For now, Standard API call to "Get it working" first, simulating the "Signed" payload structure
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

  // Loading state
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading rumors...
      </div>
    );

  // Missing user ID
  if (!userId) return <div className="p-10">User ID required</div>;

  // All rumors done
  if (currentIndex >= rumors.length)
    return (
      <div className="flex h-screen items-center justify-center">
        No more rumors. Go study 📚
      </div>
    );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 overflow-hidden">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight">
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
