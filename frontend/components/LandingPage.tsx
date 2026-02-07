// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { KeyVisualizer } from './KeyVisualizer';
import { ThreeBackground } from './ThreeBackground';
import { generateKeys, exportKey, importKey } from '@/lib/crypto';
import { encryptPrivateKey, decryptPrivateKey } from '@/lib/lockbox';
import { Lock, FileKey, Share2, LogIn, UserPlus, Key } from 'lucide-react';

interface LandingProps {
    onJoin: (userId: string, keys: CryptoKey[]) => void;
}

export function LandingPage({ onJoin }: LandingProps) {
    const [step, setStep] = useState<'intro' | 'auth_choice' | 'keygen' | 'register_form' | 'login'>('intro');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Auth State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tempKeys, setTempKeys] = useState<CryptoKey[] | null>(null); // [Pub, Priv]

    // Refs for animations
    const titleRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const newNodeRef = useRef<HTMLButtonElement>(null);
    const loginNodeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Auto-fill invite from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('invite');
        if (code) {
            setInviteCode(code);
        }
    }, []);

    // GSAP Intro Animations
    useEffect(() => {
        if (step === 'intro' && titleRef.current) {
            const ctx = gsap.context(() => {
                // Title animation - stagger entrance
                const titleLines = titleRef.current?.querySelectorAll('.title-line');
                gsap.fromTo(titleLines,
                    {
                        y: 120,
                        opacity: 0,
                        rotationX: -90,
                        transformOrigin: 'center center',
                    },
                    {
                        y: 0,
                        opacity: 1,
                        rotationX: 0,
                        stagger: 0.25,
                        duration: 1.2,
                        ease: 'power4.out',
                        clearProps: 'none',
                    }
                );

                // Description fade up with blur
                gsap.fromTo(descRef.current,
                    {
                        y: 40,
                        opacity: 0,
                        filter: 'blur(20px)',
                    },
                    {
                        y: 0,
                        opacity: 1,
                        filter: 'blur(0px)',
                        duration: 1,
                        delay: 0.4,
                        ease: 'power3.out',
                        clearProps: 'none',
                    }
                );

                // Features cards - scale and stagger
                const cards = featuresRef.current?.querySelectorAll('.feature-card');
                gsap.fromTo(cards,
                    {
                        scale: 0.8,
                        opacity: 0,
                        y: 30,
                    },
                    {
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        stagger: 0.15,
                        duration: 0.8,
                        delay: 0.7,
                        ease: 'back.out(1.7)',
                        clearProps: 'none',
                    }
                );

                // Button with bounce
                gsap.fromTo(buttonRef.current,
                    {
                        scale: 0,
                        opacity: 0,
                    },
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 0.7,
                        delay: 1.1,
                        ease: 'elastic.out(1.2, 0.6)',
                        clearProps: 'none',
                    }
                );
            });

            return () => ctx.revert();
        }
    }, [step]);

    // Magnetic & Hover Button Effect
    useEffect(() => {
        if (step === 'intro' && buttonRef.current) {
            const button = buttonRef.current;

            const handleMouseMove = (e: MouseEvent) => {
                const rect = button.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const distX = e.clientX - centerX;
                const distY = e.clientY - centerY;
                const distance = Math.sqrt(distX ** 2 + distY ** 2);

                if (distance < 180) {
                    const force = (180 - distance) / 180;
                    const moveX = distX * force * 0.25;
                    const moveY = distY * force * 0.25;

                    gsap.to(button, {
                        x: moveX,
                        y: moveY,
                        duration: 0.2,
                        ease: 'power2.out',
                    });
                } else {
                    gsap.to(button, {
                        x: 0,
                        y: 0,
                        duration: 0.5,
                        ease: 'elastic.out(1, 0.5)',
                    });
                }
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [step]);

    // Auth Choice Buttons Magnetic Hover Effect
    useEffect(() => {
        if (step === 'auth_choice') {
            const handleMouseMove = (e: MouseEvent) => {
                const buttons = [newNodeRef.current, loginNodeRef.current];
                buttons.forEach((btn) => {
                    if (!btn) return;
                    const rect = btn.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    const distX = e.clientX - centerX;
                    const distY = e.clientY - centerY;
                    const distance = Math.sqrt(distX ** 2 + distY ** 2);

                    if (distance < 200) {
                        const force = (200 - distance) / 200;
                        const moveX = distX * force * 0.2;
                        const moveY = distY * force * 0.2;

                        gsap.to(btn, {
                            x: moveX,
                            y: moveY,
                            duration: 0.2,
                            ease: 'power2.out',
                        });
                    } else {
                        gsap.to(btn, {
                            x: 0,
                            y: 0,
                            duration: 0.5,
                            ease: 'elastic.out(1, 0.5)',
                        });
                    }
                });
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [step]);

    // --- FLOW ACTIONS ---

    const handleStart = () => setStep('auth_choice');

    const handleChoice = (choice: 'new' | 'existing') => {
        if (choice === 'new') setStep('keygen'); // Generate Keys first
        else setStep('login');
    };

    // 1. Key Generation Complete (For New Users)
    const handleKeyGenComplete = async () => {
        const keys = await generateKeys();
        setTempKeys(keys);
        setStep('register_form');
    };

    // 2. Register (Encrypt Key & Upload)
    const handleRegister = async () => {
        if (!username || !password || !tempKeys) return;
        if (!inviteCode && username !== 'genesis') {
            alert("Invite Code is REQUIRED for Version 2.0");
            return;
        }
        setLoading(true);

        try {
            const [pub, priv] = tempKeys;

            // A. Encrypt Private Key
            const encryptedParams = await encryptPrivateKey(priv, password);

            // B. Export Public Key
            const pubKeyStr = await exportKey(pub);

            // C. API Call
            const res = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password, // Plaintext to backend (hashed there)
                    public_key: pubKeyStr,
                    encrypted_priv_key: encryptedParams,
                    invite_code: inviteCode || "GENESIS"
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Registration Failed");
            }

            const data = await res.json();

            // Success!
            localStorage.setItem('token', data.token);
            if (data.invite_code) localStorage.setItem('invite_code', data.invite_code);
            localStorage.setItem('trust_score', '0.5');
            if (data.is_genesis_member) localStorage.setItem('is_genesis_member', 'true');

            onJoin(data.user_id, tempKeys);

        } catch (e: any) {
            alert(e.message);
            setLoading(false);
        }
    };

    // 3. Login (Download & Decrypt)
    const handleLogin = async () => {
        if (!username || !password) return;
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) throw new Error("Invalid Credentials");
            const data = await res.json();

            localStorage.setItem('token', data.token);
            if (data.invite_code) localStorage.setItem('invite_code', data.invite_code);
            if (data.trust_score !== undefined) localStorage.setItem('trust_score', data.trust_score.toString());
            if (data.is_genesis_member) localStorage.setItem('is_genesis_member', 'true');

            let privKey = null;
            let pubKey = null;

            if (data.encrypted_priv_key && data.public_key) {
                privKey = await decryptPrivateKey(
                    password,
                    data.encrypted_priv_key.salt,
                    data.encrypted_priv_key.iv,
                    data.encrypted_priv_key.cipherText
                );
                pubKey = await importKey(data.public_key);
                onJoin(data.user_id, [pubKey, privKey]);
            } else {
                alert("Account exists but has no keys (Legacy?). Cannot verify votes.");
                throw new Error("Legacy Account Not Supported in V2 - No Keys Found");
            }

        } catch (e: any) {
            alert("Login Failed: " + e.message);
            setLoading(false);
        }
    };

    // --- RENDERERS ---

    if (step === 'auth_choice') {
        return (
            <>
                <ThreeBackground />
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10" />
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-white space-y-6 animate-in fade-in relative z-20">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <motion.h2 className="text-5xl font-bold text-center bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">Identify Yourself</motion.h2>
                        <div className="flex gap-8 flex-wrap justify-center">
                            <motion.button
                                ref={newNodeRef}
                                onClick={() => handleChoice('new')}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-8 py-12 rounded-2xl overflow-hidden w-56 flex flex-col items-center gap-3 z-0"
                            >
                                {/* Animated background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 opacity-100 group-hover:opacity-90 transition-all duration-300 rounded-2xl" />

                                {/* Shimmer */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -translate-x-full group-hover:translate-x-full transition-all duration-1000 rounded-2xl" />

                                {/* Glow */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-500 -z-10" />

                                {/* Border */}
                                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="z-10 flex flex-col items-center w-full">
                                    <UserPlus size={48} className="group-hover:scale-125 transition-transform duration-300 group-hover:drop-shadow-lg" />
                                    <span className="font-bold text-xl mt-2 block">New Node</span>
                                    <span className="text-sm text-blue-200 mt-1 block">Join Network</span>
                                </div>
                            </motion.button>
                            <motion.button
                                ref={loginNodeRef}
                                onClick={() => handleChoice('existing')}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-8 py-12 rounded-2xl overflow-hidden w-56 flex flex-col items-center gap-3 z-0"
                            >
                                {/* Animated background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 opacity-100 group-hover:opacity-90 transition-all duration-300 rounded-2xl" />

                                {/* Shimmer */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-15 -translate-x-full group-hover:translate-x-full transition-all duration-1000 rounded-2xl" />

                                {/* Glow */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 to-slate-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10" />

                                {/* Border */}
                                <div className="absolute inset-0 rounded-2xl border-2 border-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="z-10 flex flex-col items-center w-full">
                                    <LogIn size={48} className="group-hover:scale-125 transition-transform duration-300 group-hover:drop-shadow-lg" />
                                    <span className="font-bold text-xl mt-2 block">Login</span>
                                    <span className="text-sm text-slate-300 mt-1 block">Unlock Vault</span>
                                </div>
                            </motion.button>
                        </div>
                        <div className="text-center pt-4">
                            <motion.button
                                whileHover={{ x: -5 }}
                                onClick={() => setStep('intro')}
                                className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2"
                            >
                                ← Back
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </>
        );
    }

    if (step === 'keygen') {
        return (
            <>
                <ThreeBackground />
                <div className="flex min-h-screen flex-col items-center justify-center p-6 relative z-10">
                    <KeyVisualizer onComplete={handleKeyGenComplete} />
                </div>
            </>
        );
    }

    if (step === 'register_form') {
        return (
            <>
                <ThreeBackground />
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10" />
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-white text-center animate-in fade-in relative z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full space-y-6 backdrop-blur-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
                    >
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                            <Key size={40} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">Secure Your Identity</h2>
                        <p className="text-zinc-300 text-sm">
                            Create a password to encrypt your Private Key. <br />
                            We store the <b>encrypted blob</b>. You hold the password.
                        </p>

                        <div className="space-y-4 text-left">
                            <motion.input
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                type="text" placeholder="Username (Public)"
                                value={username} onChange={e => setUsername(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-blue-500/30 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-500/60"
                            />
                            <motion.input
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                type="password" placeholder="Password (Encrypts Key)"
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-blue-500/30 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-500/60"
                            />
                            <motion.input
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                type="text" placeholder="Invite Code (Required)"
                                value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-blue-500/30 p-3 rounded-lg outline-none font-mono text-center tracking-widest focus:ring-2 focus:ring-blue-500 transition-all hover:border-blue-500/60"
                            />
                            <p className="text-xs text-center text-zinc-500">Use 'GENESIS' to start a new network.</p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        >
                            {loading ? (
                                <motion.span
                                    animate={{ opacity: [0.5, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                    Encrypting & Uploading...
                                </motion.span>
                            ) : "Create Identity"}
                        </motion.button>
                        <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => setStep('auth_choice')}
                            className="text-sm text-zinc-400 mt-4 block mx-auto hover:text-white transition-colors"
                        >
                            Cancel
                        </motion.button>
                    </motion.div>
                </div>
            </>
        );
    }

    if (step === 'login') {
        return (
            <>
                <ThreeBackground />
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10" />
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-white text-center animate-in fade-in relative z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full space-y-6 backdrop-blur-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">Decrypt Identity</h2>
                            <p className="text-zinc-400 text-sm">Unlock your vault with your credentials</p>
                        </div>

                        <div className="space-y-4 text-left">
                            <motion.input
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                type="text" placeholder="Username"
                                value={username} onChange={e => setUsername(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-blue-500/30 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-500/60"
                            />
                            <motion.input
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                type="password" placeholder="Password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-blue-500/30 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-blue-500/60"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        >
                            {loading ? (
                                <motion.span
                                    animate={{ opacity: [0.5, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                    Downloading & Decrypting...
                                </motion.span>
                            ) : "Unlock Vault"}
                        </motion.button>

                        <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => setStep('auth_choice')}
                            className="text-sm text-zinc-400 mt-4 block mx-auto hover:text-white transition-colors"
                        >
                            Cancel
                        </motion.button>
                    </motion.div>
                </div>
            </>
        );
    }

    // INTRO STEP - Main Landing with GSAP + ThreeJS
    return (
        <>
            <ThreeBackground />
            <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none z-5" />
            <div
                ref={containerRef}
                className="flex min-h-screen flex-col items-center justify-center p-6 text-white text-center relative z-10"
            >
                <motion.div className="max-w-2xl space-y-10">
                    {/* Animated Title */}
                    <div ref={titleRef} className="space-y-2 perspective">
                        <h1 className="title-line text-7xl md:text-8xl font-black tracking-tighter leading-none">
                            <span className="inline-block bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
                                BLACK
                            </span>
                        </h1>
                        <h1 className="title-line text-7xl md:text-8xl font-black tracking-tighter leading-none">
                            <span className="inline-block bg-gradient-to-r from-white via-blue-300 to-white bg-clip-text text-transparent">
                                BOX
                            </span>
                        </h1>
                    </div>

                    {/* Description with blur effect */}
                    <motion.p
                        ref={descRef}
                        className="text-lg md:text-xl text-zinc-300 leading-relaxed font-light"
                        initial={{ opacity: 0, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                    >
                        A decentralized rumor network. <br />
                        <motion.span className="text-white font-bold text-xl block mt-2">
                            No admins. No censorship. Just Math.
                        </motion.span>
                    </motion.p>

                    {/* Features Grid */}
                    <motion.div
                        ref={featuresRef}
                        className="grid grid-cols-2 gap-6 text-left p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 my-8"
                    >
                        <motion.div
                            className="feature-card space-y-3 group p-4 rounded-lg hover:bg-white/5 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Lock className="text-blue-400 group-hover:text-blue-300 transition-colors" size={32} />
                            <h3 className="font-bold text-lg">Anonymity</h3>
                            <p className="text-xs text-zinc-400">2048-bit RSA Encrypted Vaults.</p>
                        </motion.div>
                        <motion.div
                            className="feature-card space-y-3 group p-4 rounded-lg hover:bg-white/5 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <FileKey className="text-blue-400 group-hover:text-blue-300 transition-colors" size={32} />
                            <h3 className="font-bold text-lg">Roaming</h3>
                            <p className="text-xs text-zinc-400">Log in from any device securely.</p>
                        </motion.div>
                    </motion.div>

                    {/* Amazing Hover Button */}
                    <motion.button
                        ref={buttonRef}
                        onClick={handleStart}
                        className="group relative px-12 py-4 font-bold text-lg rounded-full overflow-hidden transition-all duration-500 mt-8"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-white to-blue-600 opacity-100 group-hover:opacity-80 transition-opacity" />

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />

                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-500 -z-10" />

                        {/* Text */}
                        <span className="relative z-10 text-white font-bold group-hover:tracking-widest transition-all duration-300 flex items-center gap-2 justify-center">
                            ✦ Connect Node ✦
                            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                →
                            </motion.span>
                        </span>

                        {/* Border animation */}
                        <div className="absolute inset-0 rounded-full border-2 border-white opacity-0 group-hover:opacity-50 transition-opacity" />
                    </motion.button>

                    {/* Scroll indicator */}
                    <motion.div
                        className="text-center text-zinc-500 text-xs mt-8"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ⌄ Scroll down ⌄
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
}
