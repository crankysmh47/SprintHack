import { Fingerprint, LogOut, Moon, Sun, UserPlus } from 'lucide-react';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface NavbarProps {
  userId: string | null;
  onLogout: () => void;
}

export function Navbar({ userId, onLogout }: NavbarProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Fingerprint size={24} className="text-primary dark:text-cyan-400" />
          <span className="text-lg font-black tracking-widest text-foreground dark:text-white font-orbitron" style={{ fontFamily: 'var(--font-orbitron)' }}>
            BLACK<span className="text-primary dark:text-cyan-400">BOX</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {userId && (
            <>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md">
                {userId.length > 8 ? userId.slice(0, 8) + '…' : userId}
              </span>

              {/* Invite Button (Trusted Only OR Genesis) */}
              {(
                (localStorage.getItem('invite_code') && parseFloat(localStorage.getItem('trust_score') || '0') >= 0.7) ||
                (userId?.toLowerCase() === 'genesis')
              ) && (
                  <button
                    onClick={() => {
                      const code = localStorage.getItem('invite_code');
                      const url = `${window.location.origin}?invite=${code}`;
                      navigator.clipboard.writeText(url);
                      alert(`Invite Link Copied!\nCode: ${code}`);
                    }}
                    className="p-2 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition"
                    title="Copy Invite Link"
                  >
                    <UserPlus size={18} />
                  </button>
                )}

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}