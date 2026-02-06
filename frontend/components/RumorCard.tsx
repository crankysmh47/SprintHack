'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState } from 'react';
import { Check, X } from 'lucide-react';

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
  const [swipeDirection, setSwipeDirection] =
    useState<'left' | 'right' | null>(null);

  // Motion physics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const bg = useTransform(
    x,
    [-150, 0, 150],
    ['rgb(254, 226, 226)', 'rgb(255,255,255)', 'rgb(220, 252, 231)']
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setSwipeDirection('right');
      setShowSlider(true);
    } else if (info.offset.x < -100) {
      setSwipeDirection('left');
      setShowSlider(true);
    }
  };

  const submitVote = () => {
    if (!swipeDirection) return;
    onVote(swipeDirection, prediction / 100);
  };

  // 🎚️ Prediction Step
  if (showSlider) {
    return (
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-xl space-y-6 animate-in fade-in zoom-in">
        <h3 className="text-xl font-bold text-center">Prediction Check</h3>
        <p className="text-center text-gray-500 text-sm">
          What percentage of students agree with you?
        </p>

        <input
          type="range"
          min={0}
          max={100}
          value={prediction}
          onChange={(e) => setPrediction(Number(e.target.value))}
          className="w-full accent-blue-600"
        />

        <div className="text-center text-3xl font-black text-blue-600">
          {prediction}%
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

  // 🃏 Swipe Card
  return (
    <motion.div
      style={{ x, rotate, opacity, backgroundColor: bg }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={`relative w-full max-w-sm h-96 rounded-2xl shadow-2xl p-8 
        flex items-center justify-center text-center cursor-grab active:cursor-grabbing
        border-4 ${
          rumor.verified_result === true
            ? 'border-yellow-400'
            : rumor.verified_result === false
            ? 'border-red-400'
            : 'border-transparent'
        }`}
    >
      {rumor.verified_result !== null && (
        <div
          className={`absolute top-4 px-3 py-1 rounded-full text-xs font-bold ${
            rumor.verified_result
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {rumor.verified_result ? '✓ Verified Truth' : '✗ Disputed'}
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800 select-none">
        {rumor.content}
      </h2>

      <div className="absolute bottom-6 flex gap-12">
        <div className="flex flex-col items-center text-red-500 opacity-50">
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
