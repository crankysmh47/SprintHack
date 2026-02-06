// components/PredictionSlider.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionSliderProps {
  direction: 'left' | 'right';
  onConfirm: (prediction: number) => void;
  onCancel: () => void;
}

export function PredictionSlider({
  direction,
  onConfirm,
  onCancel,
}: PredictionSliderProps) {
  const [prediction, setPrediction] = useState(50);

  const voteLabel = direction === 'right' ? 'TRUE' : 'FALSE';
  const voteColor = direction === 'right' ? 'emerald' : 'red';

  // Convert slider 0–100 to the user's actual prediction
  // "What % of others will agree with my vote?"
  const predictionForBackend = prediction / 100;

  const getInsight = () => {
    if (prediction < 25) return { icon: TrendingDown, text: 'You think this is a hot take 🌶️', color: 'text-orange-500' };
    if (prediction < 50) return { icon: TrendingDown, text: 'You think most people disagree', color: 'text-yellow-600' };
    if (prediction < 75) return { icon: TrendingUp, text: 'You think many people agree', color: 'text-blue-500' };
    return { icon: TrendingUp, text: 'You think almost everyone agrees', color: 'text-emerald-500' };
  };

  const insight = getInsight();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="w-full max-w-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div
          className={cn(
            'px-6 py-4 text-center',
            direction === 'right'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-r from-red-500 to-red-600'
          )}
        >
          <p className="text-white/80 text-sm font-medium">You voted</p>
          <p className="text-white text-2xl font-black tracking-tight">{voteLabel}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-slate-700">
              <Users size={20} />
              <h3 className="text-lg font-bold">The Prediction</h3>
            </div>
            <p className="text-slate-500 text-sm">
              What % of students do you think will also vote <strong>{voteLabel}</strong>?
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-slate-400 px-1">
              <span>Only me</span>
              <span>Everyone</span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={prediction}
                onChange={(e) => setPrediction(parseInt(e.target.value))}
                className="w-full"
              />

              {/* Tick marks */}
              <div className="flex justify-between px-1 mt-1">
                {[0, 25, 50, 75, 100].map((tick) => (
                  <div
                    key={tick}
                    className={cn(
                      'w-1 h-1 rounded-full',
                      prediction >= tick ? 'bg-blue-400' : 'bg-slate-300'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Big number */}
            <motion.div
              key={prediction}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <span className="text-5xl font-black text-slate-800">
                {prediction}
              </span>
              <span className="text-2xl font-bold text-slate-400">%</span>
            </motion.div>

            {/* Insight */}
            <div className={cn('flex items-center justify-center gap-2 text-sm font-medium', insight.color)}>
              <insight.icon size={16} />
              <span>{insight.text}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition active:scale-95"
            >
              Back
            </button>
            <button
              onClick={() => onConfirm(predictionForBackend)}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-white transition active:scale-95 shadow-lg',
                direction === 'right'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              )}
            >
              Confirm Vote
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}