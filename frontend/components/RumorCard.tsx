// components/RumorCard.tsx

'use client';

import { useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  AnimatePresence,
} from 'framer-motion';
import { Check, X, Clock, Users, Zap, Eye } from 'lucide-react';
import type { Rumor, SwipeDirection } from '@/lib/types';
import { cn, formatTimeAgo, triggerHaptic } from '@/lib/utils';
import { TrustBadge } from './TrustBadge';
import { SwipeIndicator } from './SwipeIndicator';
import { PredictionSlider } from './PredictionSlider';

// ── Stage configuration ─────────────────────────────────
const STAGE_CONFIG = {
  circle: {
    Icon: Eye,
    label: 'Local',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300',
  },
  neighbor: {
    Icon: Users,
    label: 'Neighbors',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
  },
  global: {
    Icon: Zap,
    label: 'Viral',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300',
  },
} as const;

// ── Props ────────────────────────────────────────────────
interface RumorCardProps {
  rumor: Rumor;
  onVote: (direction: SwipeDirection, prediction: number) => void;
  isTop?: boolean;
}

export function RumorCard({ rumor, onVote, isTop = true }: RumorCardProps) {
  const [phase, setPhase] = useState<'swipe' | 'predict'>('swipe');
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [isExiting, setIsExiting] = useState(false);

  // ── Motion values ───────────────────────────────────
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const cardOpacity = useTransform(
    x,
    [-300, -150, 0, 150, 300],
    [0.5, 1, 1, 1, 0.5]
  );

  // Tint opacity based on drag
  const rightOpacity = useTransform(x, [0, 150], [0, 0.2]);
  const leftOpacity = useTransform(x, [-150, 0], [0.2, 0]);

  // ── Handlers ────────────────────────────────────────
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const SWIPE_THRESHOLD = 100;
    const VELOCITY_THRESHOLD = 500;

    const swipedRight =
      info.offset.x > SWIPE_THRESHOLD ||
      info.velocity.x > VELOCITY_THRESHOLD;
    const swipedLeft =
      info.offset.x < -SWIPE_THRESHOLD ||
      info.velocity.x < -VELOCITY_THRESHOLD;

    if (swipedRight) {
      triggerHaptic('medium');
      setSwipeDirection('right');
      setPhase('predict');
    } else if (swipedLeft) {
      triggerHaptic('medium');
      setSwipeDirection('left');
      setPhase('predict');
    }
    // If neither threshold met, card snaps back automatically
  };

  const handlePredict = (prediction: number) => {
    triggerHaptic('heavy');
    setIsExiting(true);

    setTimeout(() => {
      onVote(swipeDirection, prediction);
    }, 300);
  };

  const handleCancelPredict = () => {
    setPhase('swipe');
    setSwipeDirection(null);
    x.set(0);
  };

  const handleButtonVote = (dir: 'left' | 'right') => {
    triggerHaptic('medium');
    setSwipeDirection(dir);
    setPhase('predict');
  };

  // ── Resolve stage config ────────────────────────────
  const stageKey = rumor.stage || 'global';
  const stage = STAGE_CONFIG[stageKey];
  const StageIcon = stage.Icon;

  // ── PREDICTION PHASE ──────────────────────────────────
  if (phase === 'predict' && swipeDirection) {
    return (
      <AnimatePresence>
        {!isExiting && (
          <PredictionSlider
            direction={swipeDirection}
            onConfirm={handlePredict}
            onCancel={handleCancelPredict}
          />
        )}
      </AnimatePresence>
    );
  }

  // ── SWIPE PHASE ───────────────────────────────────────
  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity: cardOpacity,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: swipeDirection === 'right' ? 500 : swipeDirection === 'left' ? -500 : 0,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
      className={cn(
        'relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden',
        'flex flex-col cursor-grab active:cursor-grabbing',
        'border-2 bg-white dark:bg-slate-900',
        rumor.verified_result === true
          ? 'border-emerald-300 dark:border-emerald-800'
          : rumor.verified_result === false
            ? 'border-red-300 dark:border-red-800'
            : 'border-slate-200 dark:border-slate-800'
      )}
    >
      {/* Dynamic Background Tints */}
      <motion.div
        style={{ opacity: rightOpacity }}
        className="absolute inset-0 bg-emerald-500 pointer-events-none z-0"
      />
      <motion.div
        style={{ opacity: leftOpacity }}
        className="absolute inset-0 bg-red-500 pointer-events-none z-0"
      />

      {/* Swipe direction overlays (Text/Icons) */}
      <SwipeIndicator x={x} />

      {/* ── Top Bar ─────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
            stage.color
          )}
        >
          <StageIcon size={12} />
          {stage.label}
        </div>
        <TrustBadge score={rumor.trust_score} size="sm" />
      </div>

      {/* ── Verification Banner ─────────────────────── */}
      {rumor.verified_result !== null && (
        <div
          className={cn(
            'relative z-10 mx-5 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2',
            rumor.verified_result
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
          )}
        >
          {rumor.verified_result ? (
            <>
              <Check size={14} strokeWidth={3} />
              Verified by SP Algorithm
            </>
          ) : (
            <>
              <X size={14} strokeWidth={3} />
              Disputed
            </>
          )}
        </div>
      )}

      {/* ── Main Content ────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-10 min-h-[220px]">
        <p className="text-xl md:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 leading-snug select-none">
          {rumor.content}
        </p>
      </div>

      {/* ── Bottom Meta ─────────────────────────────── */}
      <div className="relative z-10 px-5 pb-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          {formatTimeAgo(rumor.created_at)}
        </div>
        <div className="flex items-center gap-1">
          <Users size={12} />
          {rumor.vote_count} votes
        </div>
      </div>

      {/* ── Tags ─────────────────────────────────────── */}
      {rumor.tags && rumor.tags.length > 0 && (
        <div className="relative z-10 px-5 pb-4 flex flex-wrap gap-1.5">
          {rumor.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Button fallbacks ─────────────────────────── */}
      <div className="relative z-10 flex border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <button
          onClick={() => handleButtonVote('left')}
          className="flex-1 flex items-center justify-center gap-2 py-4
                     text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20
                     transition active:scale-95"
        >
          <X size={20} strokeWidth={3} />
          FALSE
        </button>
        <div className="w-px bg-slate-100 dark:bg-slate-800" />
        <button
          onClick={() => handleButtonVote('right')}
          className="flex-1 flex items-center justify-center gap-2 py-4
                     text-emerald-500 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                     transition active:scale-95"
        >
          <Check size={20} strokeWidth={3} />
          TRUE
        </button>
      </div>
    </motion.div>
  );
}