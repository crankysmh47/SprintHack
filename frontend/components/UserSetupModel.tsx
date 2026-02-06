"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, Loader2, Fingerprint, ShieldCheck } from 'lucide-react';
import { TypewriterText } from './TypewriterText';

interface UserSetupModalProps {
  onComplete: (userId: string) => void;
}

export function UserSetupModal({ onComplete }: UserSetupModalProps) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'init' | 'input' | 'verifying'>('init');
  const [logs, setLogs] = useState<string[]>([]);

  // Initialization Sequence
  useEffect(() => {
    const sequence = [
      { text: "Initializing BlackBox Protocol...", delay: 500 },
      { text: "Establishing secure connection...", delay: 1200 },
      { text: "Verifying encrypted handshake...", delay: 2000 },
      { text: "ACCESS GRANTED.", delay: 2800 },
    ];

    let timeouts: NodeJS.Timeout[] = [];

    sequence.forEach(({ text, delay }) => {
      const timeout = setTimeout(() => {
        setLogs(prev => [...prev, text]);
      }, delay);
      timeouts.push(timeout);
    });

    const finalTimeout = setTimeout(() => {
      setStage('input');
    }, 3500);
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userId.trim();
    if (!trimmed) {
      setError('> ERROR: USER_ID_REQUIRED');
      return;
    }
    if (trimmed.length < 3) {
      setError('> ERROR: USER_ID_TOO_SHORT');
      return;
    }

    setStage('verifying');
    // Simulate verification delay
    setTimeout(() => {
      localStorage.setItem('user_id', trimmed);
      onComplete(trimmed);
    }, 1500);
  };

  const handleDemo = () => {
    const demoId = `AGENT_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setUserId(demoId);
    setStage('verifying');
    setTimeout(() => {
      localStorage.setItem('user_id', demoId);
      onComplete(demoId);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl font-mono">
      <div className="w-full max-w-lg p-6">

        {/* Terminal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-card border border-primary/30 rounded-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.2)] dark:shadow-primary/20 overflow-hidden relative"
        >
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20"></div>

          {/* Header */}
          <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-primary" />
              <span className="text-primary text-xs tracking-widest">BLACKBOX_SECURE_LOGIN</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
            </div>
          </div>

          <div className="p-6 min-h-[300px] flex flex-col relative z-20">

            {/* Logs */}
            <div className="space-y-1 mb-8">
              <div className="text-muted-foreground text-xs mb-4">
                BLACKBOX v2.0.4 <br />
                (c) 2026 CYBERCORP
              </div>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-primary/80 text-sm font-medium"
                >
                  <span className="text-primary mr-2">$</span>
                  {log}
                </motion.div>
              ))}
            </div>

            {/* Input Stage */}
            <AnimatePresence mode='wait'>
              {stage === 'input' && (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="mt-auto space-y-4"
                >
                  <div>
                    <label htmlFor="userId" className="block text-primary text-xs mb-2 uppercase tracking-wider">
                      Identity String
                    </label>
                    <div className="relative group">
                      <input
                        id="userId"
                        type="text"
                        value={userId}
                        onChange={(e) => {
                          setUserId(e.target.value);
                          setError('');
                        }}
                        autoComplete="off"
                        className="w-full bg-background border border-primary/50 rounded p-3 pl-4 text-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:focus:shadow-primary/30 transition-all font-mono"
                        placeholder="ENTER_ID..."
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Fingerprint size={16} className="text-primary/50" />
                      </div>
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-destructive text-xs mt-2 font-bold"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 py-3 rounded uppercase text-sm font-bold tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    Authenticate
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDemo}
                    className="w-full text-muted-foreground hover:text-primary text-xs hover:underline pt-2"
                  >
                    [ RUN_GUEST_PROTOCOL ]
                  </button>
                </motion.form>
              )}

              {stage === 'verifying' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-auto flex flex-col items-center justify-center py-8 space-y-4"
                >
                  <Loader2 size={32} className="text-primary animate-spin" />
                  <div className="text-primary text-sm tracking-widest animate-pulse">
                    VERIFYING IDENTITY...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}