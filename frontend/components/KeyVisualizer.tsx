'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function KeyVisualizer({ onComplete }: { onComplete: () => void }) {
    const [lines, setLines] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const steps = [
            "Initializing Entropy Pool...",
            "Generating RSA-2048 Primes...",
            "Deriving Public Key...",
            "Hashing Identity...",
            "Establishing Graph Connection...",
            "SECURE_CONNECTION_ESTABLISHED"
        ];

        let step = 0;
        const interval = setInterval(() => {
            if (step >= steps.length) {
                clearInterval(interval);
                setTimeout(onComplete, 1000);
                return;
            }

            const currentLine = steps[step];
            if (currentLine) {
                setLines(prev => [...prev, currentLine]);
            }

            setProgress(((step + 1) / steps.length) * 100);
            step++;
        }, 600);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-md bg-black font-mono text-green-500 p-6 rounded-lg shadow-2xl border border-green-800">
            <div className="mb-4 border-b border-green-900 pb-2 flex justify-between">
                <span>ENCRYPTION_LAYER_V1</span>
                <span>{Math.round(progress)}%</span>
            </div>

            <div className="h-48 overflow-y-auto space-y-2 font-xs">
                {lines.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {`> ${line}`}
                    </motion.div>
                ))}
                <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-3 h-5 bg-green-500 inline-block align-middle ml-1"
                />
            </div>
        </div>
    );
}
