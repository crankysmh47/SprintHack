# 🎨 DEV 3: FRONTEND UI/UX

**Role:** You are the "Vibe" manager. You build the swipe interface that hides the complex math from the user.

**Your Deliverable:** A Next.js 14 application on `localhost:3000` with Tinder-style swipe cards, prediction sliders, and "Verified" badges.

---

## 🎯 What You're Building

1. **The Gauntlet** - A stack of rumors users swipe left (False) or right (True) on.
2. **The Prediction Slider** - A UI element that asks "What do you think others will say?"
3. **The Feed** - A personalized list of rumors fetched from the API.

**Why this matters:** Users won't care about our Bayesian math if the app feels clunky. It needs to feel like a game.

---

## 🛠️ Setup (20 minutes)

### Step 1: Initialize Next.js
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint
# Select "Yes" for all defaults (App Router, etc.)
cd frontend
```

### Step 2: Install UI Libraries
We need animations and icons.
```bash
npm install framer-motion lucide-react clsx tailwind-merge
npm install @radix-ui/react-slider @radix-ui/react-slot
```

### Step 3: Configure Tailwind
Ensure your `tailwind.config.ts` handles the content paths correctly.

---

## 📝 TASK 1: The Swipe Card Component (45 minutes)

This is the core interaction. We use `framer-motion` for the swipe physics.

**File:** `components/RumorCard.tsx`

```tsx
'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState } from 'react';
import { Check, X, Users } from 'lucide-react';

interface Rumor {
  id: string;
  content: string;
  verified_result: boolean | null;
  trust_score: number;
}

interface RumorCardProps {
  rumor: Rumor;
  onVote: (direction: 'left' | 'right', prediction: number) => void;
}

export function RumorCard({ rumor, onVote }: RumorCardProps) {
  const [showSlider, setShowSlider] = useState(false);
  const [prediction, setPrediction] = useState(50);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Motion values for swipe animation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const color = useTransform(
    x, 
    [-200, 0, 200], 
    ['rgb(239, 68, 68)', 'rgb(255, 255, 255)', 'rgb(34, 197, 94)']
  );

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setSwipeDirection('right');
      setShowSlider(true);
    } else if (info.offset.x < -100) {
      setSwipeDirection('left');
      setShowSlider(true);
    }
  };

  const submitVote = () => {
    if (swipeDirection) {
      onVote(swipeDirection, prediction / 100);
    }
  };

  if (showSlider) {
    return (
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-xl space-y-6 animate-in fade-in zoom-in">
        <h3 className="text-xl font-bold text-center">Prediction Check</h3>
        <p className="text-gray-600 text-center">
          What percentage of students do you think agree with you?
        </p>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium text-gray-500">
            <span>Nobody (0%)</span>
            <span>Everyone (100%)</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={prediction} 
            onChange={(e) => setPrediction(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="text-center font-bold text-2xl text-blue-600">
            {prediction}%
          </div>
        </div>

        <button 
          onClick={submitVote}
          className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition"
        >
          Confirm Vote
        </button>
      </div>
    );
  }

  return (
    <motion.div
      style={{ x, rotate, backgroundColor: color }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={`relative w-full max-w-sm h-96 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-4 ${
        rumor.verified_result === true ? 'border-yellow-400' : 
        rumor.verified_result === false ? 'border-red-400' : 'border-transparent'
      }`}
    >
      {/* Verification Badge */}
      {rumor.verified_result !== null && (
        <div className={`absolute top-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          rumor.verified_result ? 'bg-yellow-400 text-yellow-900' : 'bg-red-100 text-red-700'
        }`}>
          {rumor.verified_result ? '✓ Verified Truth' : '✗ Disputed'}
        </div>
      )}

      <h2 className="text-2xl font-bold text-center text-slate-800 leading-tight select-none">
        {rumor.content}
      </h2>

      <div className="absolute bottom-6 flex gap-8">
        <div className="flex flex-col items-center text-red-600 opacity-50">
          <X size={32} />
          <span className="text-xs font-bold">FALSE</span>
        </div>
        <div className="flex flex-col items-center text-green-600 opacity-50">
          <Check size={32} />
          <span className="text-xs font-bold">TRUE</span>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 📝 TASK 2: The Logic Integration (30 minutes)

**File:** `app/page.tsx`

Connect the UI to the API (through `lib/api.ts` which Dev 4 builds, but you can stub it out).

```tsx
'use client';

import { useEffect, useState } from 'react';
import { RumorCard } from '@/components/RumorCard';

// Temporary mock type until Dev 4 finishes api.ts
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

  // Load User ID from LocalStorage (simple auth for hackathon)
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Hack: Prompt for user ID if missing
    let storedId = localStorage.getItem('user_id');
    if (!storedId) {
      storedId = prompt("Enter your User ID (from Dev 2's seed script):");
      if (storedId) localStorage.setItem('user_id', storedId);
    }
    setUserId(storedId);

    if (storedId) {
      // Fetch feed
      fetch(`http://localhost:8000/api/feed?user_id=${storedId}`)
        .then(res => res.json())
        .then(data => {
          setRumors(data.rumors);
          setLoading(false);
        })
        .catch(err => console.error("API Down?", err));
    }
  }, []);

  const handleVote = async (direction: 'left' | 'right', prediction: number) => {
    if (!rumors[currentIndex] || !userId) return;

    const voteData = {
      user_id: userId,
      rumor_id: rumors[currentIndex].id,
      vote: direction === 'right',
      prediction: prediction
    };

    console.log("Submitting vote:", voteData);

    try {
      await fetch('http://localhost:8000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      });
      
      // Advance to next card
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 200);
      
    } catch (e) {
      alert("Failed to submit vote");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading rumors...</div>;
  if (!userId) return <div className="p-10">Please refresh and enter a User ID.</div>;
  if (currentIndex >= rumors.length) return <div className="flex h-screen items-center justify-center">No more rumors! Go study.</div>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 overflow-hidden">
      <div className="w-full max-w-sm mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">TRUTH OR DARE</h1>
        <p className="text-slate-500">Swipe right if true. Left if false.</p>
      </div>

      <div className="relative w-full max-w-sm h-96">
        <RumorCard 
          key={rumors[currentIndex].id} // Key ensures remount on change
          rumor={rumors[currentIndex]} 
          onVote={handleVote} 
        />
      </div>

      <div className="mt-10">
        <button 
          onClick={() => alert("Open Post Modal (Dev 3 Task 3)")}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg font-bold hover:bg-blue-700 transition"
        >
          <span>+</span> Post Rumor
        </button>
      </div>
    </main>
  );
}
```

---

## 📝 TASK 3: Post Rumor Modal (30 minutes)

Create a simple modal to post new rumors.
It should call `POST http://localhost:8000/api/rumor`.

**Specs:**
- Textarea for content
- Submit button
- On success: Close modal + Alert "Posted!"

---

## 📦 Your Deliverable Checklist

- [ ] Next.js app running on `localhost:3000`
- [ ] `RumorCard` component allows swiping
- [ ] Prediction slider appears after swipe
- [ ] API calls wired up (fetch feed, submit vote)
- [ ] Voting works smoothly
- [ ] Post rumor button works

---

## 🚨 Integration Notes (Hour 4)

- **CORS Errors?** Tell Dev 1 to fix their `main.py` CORS settings.
- **No Rumors?** Tell Dev 2 to run the seed script.
- **Card stuck?** Check console logs for API errors.

---

**Questions?** Check `SHARED_CONTRACT.md`.
