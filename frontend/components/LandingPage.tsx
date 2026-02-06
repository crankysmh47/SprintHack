'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyVisualizer } from './KeyVisualizer';
import { generateKeys } from '@/lib/crypto';
import { Lock, FileKey, Share2 } from 'lucide-react';

interface LandingProps {
    onJoin: (userId: string, keys: CryptoKey[]) => void;
}

export function LandingPage({ onJoin }: LandingProps) {
    const [step, setStep] = useState<'intro' | 'keygen' | 'invite'>('intro');
    const [inviteCode, setInviteCode] = useState('');
    const [isJoinLoading, setIsJoinLoading] = useState(false);

    // 1. Start Flow
    const handleStart = () => setStep('keygen');

    // 2. Key Gen Complete
    const handleKeyGenComplete = async () => {
        // Generate actual keys
        const [pub, priv] = await generateKeys();
        // In memory for now, Page.tsx will persist
        // setTempKeys([pub, priv]); 
        setStep('invite');
    };

    // 3. Join Network
    const handleJoin = async () => {
        setIsJoinLoading(true);

        // Create new User ID via API (Simulating Join)
        // If invite code provided, use it. Else assume "Genesis Join" (Test mode)
        // For Hackathon, we'll just mock the ID creation or use one if provided.

        try {
            const res = await fetch('http://localhost:8000/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invite_code: inviteCode || "GENESIS_USER" // Fallback for demo
                })
            });

            if (!res.ok) throw new Error("Join Failed");

            const data = await res.json();
            // Generate Keys again (properly this time to pass up)
            const keys = await generateKeys();

            onJoin(data.user_id, keys);

        } catch (e) {
            alert("Failed to join network. Is the Invite Code valid?");
            setIsJoinLoading(false);
        }
    };

    if (step === 'keygen') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6">
                <KeyVisualizer onComplete={handleKeyGenComplete} />
            </div>
        );
    }

    if (step === 'invite') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white text-center animate-in fade-in">
                <div className="max-w-md space-y-8">
                    <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-blue-500/50 shadow-lg">
                        <Share2 size={32} />
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight">Enter the Graph</h2>
                    <p className="text-zinc-400">
                        Trust is not given. It is earned. <br />
                        Enter an invite code to link your node.
                    </p>

                    <input
                        type="text"
                        placeholder="Invite Code (UUID)"
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-lg font-mono text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                        onClick={handleJoin}
                        disabled={isJoinLoading}
                        className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition"
                    >
                        {isJoinLoading ? "Linking Node..." : "Connect"}
                    </button>

                    <p className="text-xs text-zinc-600">
                        (For Demo: Leave empty to join as Orphan Node)
                    </p>
                </div>
            </div>
        );
    }

    // INTRO STEP
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white text-center">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-lg space-y-8"
            >
                <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                    ZERO<br />TRUST
                </h1>

                <p className="text-lg text-zinc-400 leading-relaxed">
                    A decentralized rumor network. <br />
                    <span className="text-white font-bold">No admins. No censorship. Just Math.</span>
                </p>

                <div className="grid grid-cols-2 gap-4 text-left p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <div className="space-y-2">
                        <Lock className="text-blue-500" />
                        <h3 className="font-bold">Anonymity</h3>
                        <p className="text-xs text-zinc-500">2048-bit RSA Signed Votes. We don't know who you are.</p>
                    </div>
                    <div className="space-y-2">
                        <FileKey className="text-green-500" />
                        <h3 className="font-bold">Verifiable</h3>
                        <p className="text-xs text-zinc-500">PageRank + SP Algorithm determines truth.</p>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-blue-500 opacity-0 group-hover:opacity-20 transition" />
                    Initialize Protocol
                </button>
            </motion.div>
        </div>
    );
}
