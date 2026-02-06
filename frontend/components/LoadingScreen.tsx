"use client";

import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="flex h-screen items-center justify-center bg-background font-mono overflow-hidden relative">
      {/* Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

      <div className="w-full max-w-md p-8 relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8"
        >
          <Terminal size={24} className="text-primary animate-pulse" />
          <h1 className="text-xl font-bold text-primary tracking-[0.2em] uppercase">
            BlackBox<span className="animate-blink">_</span>
          </h1>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-primary/70 uppercase tracking-widest">
            <span>System Encryption</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Bar */}
          <div className="h-4 w-full bg-primary/10 border border-primary/30 rounded-sm p-0.5">
            <motion.div
              className="h-full bg-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-8 space-y-1">
          <p className="text-xs text-primary/50 uppercase tracking-wider">
            {progress < 30 && "> ESTABLISHING SECURE HANDSHAKE..."}
            {progress >= 30 && progress < 60 && "> DECRYPTING GOSSIP PROTOCOLS..."}
            {progress >= 60 && progress < 90 && "> SYNCING TRUST NODES..."}
            {progress >= 90 && "> ACCESS GRANTED."}
          </p>
          <div className="grid grid-cols-4 gap-1 mt-4 opacity-30">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-0.5 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}