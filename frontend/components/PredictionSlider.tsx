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
      <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border/50 ring-1 ring-white/5">
        {/* Header */}
        <div
          className={cn(
            'relative px-6 py-6 text-center overflow-hidden',
            direction === 'right'
              ? 'bg-emerald-500/10'
              : 'bg-red-500/10'
          )}
        >
          {/* Ambient Glow */}
          <div className={cn(
            'absolute inset-0 opacity-40 blur-3xl pointer-events-none',
            direction === 'right' ? 'bg-emerald-500' : 'bg-red-500'
          )} />

          <div className="relative z-10">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">You Voted</p>
            <p className={cn(
              "text-3xl font-black tracking-tighter",
              direction === 'right' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'
            )}>
              {voteLabel}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-foreground/80">
              <Users size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Predict the Consensus</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed px-4">
              What percentage of the network will agree with you?
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-6">

            <div className="relative h-20 flex items-center justify-center">
              {/* Big number */}
              <motion.div
                key={prediction}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <span className="text-6xl font-black text-foreground tracking-tighter tabular-nums">
                  {prediction}
                </span>
                <span className="text-2xl font-bold text-muted-foreground ml-1">%</span>
              </motion.div>
            </div>

            <div className="relative py-2">
              {/* Track Background */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-secondary rounded-full -translate-y-1/2 overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-100 ease-out opacity-50", direction === 'right' ? 'bg-emerald-500' : 'bg-red-500')}
                  style={{ width: `${prediction}%` }}
                />
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={prediction}
                onChange={(e) => setPrediction(parseInt(e.target.value))}
                className="relative w-full h-8 opacity-0 cursor-pointer z-20"
              />

              {/* Custom Thumb (Pseudo-element visualizer) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-primary pointer-events-none z-10 transition-all duration-75"
                style={{ left: `calc(${prediction}% - 12px)` }}
              />

              {/* Tick marks */}
              <div className="flex justify-between px-1 mt-4 relative z-0">
                {[0, 25, 50, 75, 100].map((tick) => (
                  <div key={tick} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full',
                        prediction >= tick ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">{tick}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className={cn(
              'flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide py-2 rounded-lg bg-secondary/50',
              insight.color
            )}>
              <insight.icon size={14} />
              <span>{insight.text}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onCancel}
              className="py-3 rounded-xl font-bold text-muted-foreground bg-secondary hover:bg-secondary/80 transition active:scale-95"
            >
              Back
            </button>
            <button
              onClick={() => onConfirm(predictionForBackend)}
              className={cn(
                'py-3 rounded-xl font-bold text-black transition active:scale-95 shadow-lg relative overflow-hidden group',
                direction === 'right'
                  ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
                  : 'bg-red-400 hover:bg-red-300 shadow-red-500/20'
              )}
            >
              <span className="relative z-10">Confirm</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}