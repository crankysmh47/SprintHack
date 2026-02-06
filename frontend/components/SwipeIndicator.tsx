// components/SwipeIndicator.tsx

'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface SwipeIndicatorProps {
  x: MotionValue<number>;
}

export function SwipeIndicator({ x }: SwipeIndicatorProps) {
  // TRUE overlay (appears when swiping right)
  const trueOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const falseOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0]);
  const trueScale = useTransform(x, [0, 150], [0.5, 1.2]);
  const falseScale = useTransform(x, [-150, 0], [1.2, 0.5]);

  return (
    <>
      {/* TRUE indicator — right side */}
      <motion.div
        style={{ opacity: trueOpacity, scale: trueScale }}
        className="absolute top-6 right-6 z-20 flex items-center gap-2
                   px-4 py-2 bg-emerald-500 text-white rounded-xl
                   font-black text-lg shadow-lg shadow-emerald-500/30
                   pointer-events-none"
      >
        <Check size={24} strokeWidth={3} />
        TRUE
      </motion.div>

      {/* FALSE indicator — left side */}
      <motion.div
        style={{ opacity: falseOpacity, scale: falseScale }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2
                   px-4 py-2 bg-red-500 text-white rounded-xl
                   font-black text-lg shadow-lg shadow-red-500/30
                   pointer-events-none"
      >
        <X size={24} strokeWidth={3} />
        FALSE
      </motion.div>
    </>
  );
}