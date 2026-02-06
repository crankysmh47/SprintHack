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

export default function Home() {
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch rumors & user ID
  /*useEffect(() => {
    let storedId = localStorage.getItem('user_id');

    if (!storedId) {
      storedId = prompt('Enter your User ID (from seed script):') || '';
      if (storedId) localStorage.setItem('user_id', storedId);
    }

    setUserId(storedId);

    if (storedId) {
      fetch(`http://localhost:8000/api/feed?user_id=${storedId}`)
        .then((res) => res.json())
        .then((data) => {
          setRumors(data.rumors || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, []);*/
  useEffect(() => {
  let storedId = localStorage.getItem('user_id');

  if (!storedId) {
    storedId = prompt('Enter your User ID (mock):') || 'user123';
    localStorage.setItem('user_id', storedId);
  }

  setUserId(storedId);

  // MOCK DATA
  const mockRumors: Rumor[] = [
    { id: '1', content: 'Aliens exist', verified_result: null, trust_score: 0.5 },
    { id: '2', content: 'Pineapple belongs on pizza', verified_result: true, trust_score: 0.9 },
    { id: '3', content: 'The Earth is flat', verified_result: false, trust_score: 0.2 },
    { id: '4', content: 'Dogs can talk', verified_result: null, trust_score: 0.1 },
  ];

  // Simulate API delay
  setTimeout(() => {
    setRumors(mockRumors);
    setLoading(false);
  }, 500); // 0.5s delay
  }, []);


  // Handle vote submission
  const handleVote = async (
    direction: 'left' | 'right',
    prediction: number
  ) => {
    if (!userId || !rumors[currentIndex]) return;

    const payload = {
      user_id: userId,
      rumor_id: rumors[currentIndex].id,
      vote: direction === 'right',
      prediction,
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
