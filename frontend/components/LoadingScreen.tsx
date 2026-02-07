"use client"

import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const duration = 2000; // 2 seconds fake load
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const randomIncrement = Math.random() * 5 + 1; // Random jump
      setProgress((prev) => Math.min(prev + randomIncrement, 100));

      if (currentStep >= steps) {
        clearInterval(timer);
        setProgress(100);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const accentColor = isDark ? 'rgb(96, 165, 250)' : 'rgb(39, 39, 42)'; // blue-400 : zinc-800
  const textColor = isDark ? 'text-blue-400' : 'text-zinc-800';
  const bgColor = isDark ? 'bg-zinc-950' : 'bg-zinc-50';
  const borderColor = isDark ? 'border-blue-400/30' : 'border-zinc-800/30';

  return (
    <div className={`flex h-screen items-center justify-center ${bgColor} font-mono overflow-hidden relative transition-colors duration-700`}>
      {/* Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(59,130,246,0.05),rgba(59,130,246,0.1),rgba(59,130,246,0.05))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

      <div className="w-full max-w-md p-8 relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8"
        >
          <Terminal size={24} className={`${textColor} animate-pulse`} />
          <h1 className={`text-xl font-bold ${textColor} tracking-[0.2em] uppercase`}>
            BlackBox<span className="animate-blink">_</span>
          </h1>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className={`flex justify-between text-xs ${textColor} opacity-70 uppercase tracking-widest`}>
            <span>System Encryption</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Bar */}
          <div className={`h-4 w-full ${isDark ? 'bg-blue-400/10' : 'bg-zinc-800/10'} border ${borderColor} rounded-sm p-0.5`}>
            <motion.div
              className="h-full transition-colors duration-700"
              style={{
                width: `${progress}%`,
                backgroundColor: accentColor,
                boxShadow: isDark ? '0 0 10px rgba(96, 165, 250, 0.5)' : '0 0 10px rgba(39, 39, 42, 0.3)'
              }}
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-8 space-y-1">
          <p className={`text-xs ${textColor} opacity-50 uppercase tracking-wider`}>
            {progress < 30 && "> ESTABLISHING SECURE HANDSHAKE..."}
            {progress >= 30 && progress < 60 && "> DECRYPTING GOSSIP PROTOCOLS..."}
            {progress >= 60 && progress < 90 && "> SYNCING TRUST NODES..."}
            {progress >= 90 && "> ACCESS GRANTED."}
          </p>
          <div className="grid grid-cols-4 gap-1 mt-4 opacity-30">
            {
              [...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 ${isDark ? 'bg-blue-400/40' : 'bg-zinc-800/40'} rounded-full animate-pulse`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                ></div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}//           </div >
//         </div >
//       </div >
//     </div >
//   );
// }