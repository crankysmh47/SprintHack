'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyVisualizer } from './KeyVisualizer';
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

    useEffect(() => {
        // Auto-fill invite from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('invite');
        if (code) {
            setInviteCode(code);
        }
    }, []);

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
            // Store Token
            localStorage.setItem('token', data.token);
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
            // A. Get Encrypted Blob
            const res = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) throw new Error("Invalid Credentials");
            const data = await res.json();

            // Store Token
            localStorage.setItem('token', data.token);

            // B. Decrypt Private Key (if exists)
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
                // Legacy user or no roaming setup - handle gracefully?
                // For V2 we assume everyone has keys.
                alert("Account exists but has no keys (Legacy?). Cannot verify votes.");
                // Proceed anyway?
                // onJoin(data.user_id, []);
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
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white space-y-6 animate-in fade-in">
                <h2 className="text-3xl font-bold">Identify Yourself</h2>
                <div className="flex gap-4">
                    <button onClick={() => handleChoice('new')} className="p-6 bg-blue-600 rounded-xl hover:bg-blue-500 transition w-40 flex flex-col items-center gap-2">
                        <UserPlus size={32} />
                        <span className="font-bold">New Node</span>
                        <span className="text-xs text-blue-200">Join Network</span>
                    </button>
                    <button onClick={() => handleChoice('existing')} className="p-6 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition w-40 flex flex-col items-center gap-2">
                        <LogIn size={32} />
                        <span className="font-bold">Login</span>
                        <span className="text-xs text-zinc-400">Unlock Vault</span>
                    </button>
                </div>
                <button onClick={() => setStep('intro')} className="text-zinc-500 hover:text-white">Back</button>
            </div>
        );
    }

    if (step === 'keygen') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6">
                <KeyVisualizer onComplete={handleKeyGenComplete} />
            </div>
        );
    }

    if (step === 'register_form') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white text-center animate-in fade-in">
                <div className="max-w-md w-full space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-green-500/50 shadow-lg">
                        <Key size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Secure Your Identity</h2>
                    <p className="text-zinc-400 text-sm">
                        Create a password to encrypt your Private Key. <br />
                        We store the <b>encrypted blob</b>. You hold the password.
                    </p>

                    <div className="space-y-4 text-left">
                        <input
                            type="text" placeholder="Username (Public)"
                            value={username} onChange={e => setUsername(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <input
                            type="password" placeholder="Password (Encrypts Key)"
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <input
                            type="text" placeholder="Invite Code (Required)"
                            value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg outline-none font-mono text-center tracking-widest"
                        />
                        <p className="text-xs text-center text-zinc-600">Use 'GENESIS' to start a new network.</p>
                    </div>

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full py-4 bg-green-600 font-bold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                    >
                        {loading ? "Encrypting & Uploading..." : "Create Identity"}
                    </button>
                    <button onClick={() => setStep('auth_choice')} className="text-sm text-zinc-500 mt-4 block mx-auto">Cancel</button>
                </div>
            </div>
        );
    }

    if (step === 'login') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white text-center animate-in fade-in">
                <div className="max-w-md w-full space-y-6">
                    <h2 className="text-2xl font-bold">Decrypt Identity</h2>

                    <div className="space-y-4 text-left">
                        <input
                            type="text" placeholder="Username"
                            value={username} onChange={e => setUsername(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                            type="password" placeholder="Password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 font-bold rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
                    >
                        {loading ? "Downloading & Decrypting..." : "Unlock Vault"}
                    </button>

                    <button onClick={() => setStep('auth_choice')} className="text-sm text-zinc-500">Cancel</button>
                </div>
            </div>
        );
    }

    // INTRO STEP (Unchanged visuals, but connected to new flow)
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
                        <p className="text-xs text-zinc-500">2048-bit RSA Encrypted Vaults.</p>
                    </div>
                    <div className="space-y-2">
                        <FileKey className="text-green-500" />
                        <h3 className="font-bold">Roaming</h3>
                        <p className="text-xs text-zinc-500">Log in from any device securely.</p>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-blue-500 opacity-0 group-hover:opacity-20 transition" />
                    Connect Node
                </button>
            </motion.div>
        </div>
    );
}
