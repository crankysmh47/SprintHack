import { Fingerprint, LogOut, Moon, Sun } from 'lucide-react';
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
          <Fingerprint size={24} className="text-blue-600 dark:text-blue-500" />
          <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
            TRUTH<span className="text-blue-600 dark:text-blue-500">OR</span>DARE
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