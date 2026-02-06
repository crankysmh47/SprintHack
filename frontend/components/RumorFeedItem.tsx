import { Rumor } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns'; // Assuming date-fns is available or we'll use native
import { MessageSquare, ArrowBigUp, ArrowBigDown, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface RumorFeedItemProps {
    rumor: Rumor;
    onClick: () => void;
}

export function RumorFeedItem({ rumor, onClick }: RumorFeedItemProps) {
    // Simple time formatter if date-fns isn't installed, but let's try native Intl.RelativeTimeFormat later if needed.
    // For now, let's just use a simple string logic or assume robust Date parsing.
    const timeAgo = new Date(rumor.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });

    return (
        <motion.div
            layoutId={`rumor-card-${rumor.id}`}
            onClick={onClick}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900"
        >
            <div className="flex gap-4">
                {/* Vote Sidebar (Visual only for now in feed) */}
                <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                    <ArrowBigUp className="w-6 h-6 group-hover:text-orange-500 transition-colors" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {rumor.vote_count}
                    </span>
                    <ArrowBigDown className="w-6 h-6 group-hover:text-blue-500 transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                    {/* Metadata Header */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                            <ShieldCheck size={14} />
                            Trust {Math.round(rumor.trust_score * 100)}%
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {timeAgo}
                        </span>
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono uppercase">
                            {rumor.stage}
                        </span>
                    </div>

                    {/* Main Content */}
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-base sm:text-lg font-medium leading-snug line-clamp-3 text-slate-800 dark:text-slate-100">
                            {rumor.content}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-4 pt-2">
                        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 rounded-md transition-colors">
                            <MessageSquare size={16} />
                            <span>Discuss</span>
                        </button>
                        {rumor.tags?.map((tag) => (
                            <span key={tag} className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
