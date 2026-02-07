'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, ChevronDown, User, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { Comment } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { TrustBadge } from './TrustBadge';

interface CommentsSectionProps {
    rumorId: string;
    defaultOpen?: boolean;
}

export function CommentsSection({ rumorId, defaultOpen = false }: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(defaultOpen);

    useEffect(() => {
        if (isOpen) {
            loadComments();
        }
    }, [isOpen, rumorId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await api.getComments(rumorId);
            if (data.comments) setComments(data.comments);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // Optimistic Update
        const tempId = Math.random().toString();
        const optimisticComment: Comment = {
            id: tempId,
            content: newComment,
            created_at: new Date().toISOString(),
            user_id: 'me',
            rumor_id: rumorId,
            users: { username: 'You', trust_score: 0.5 } // Placeholder
        };

        setComments([...comments, optimisticComment]);
        setNewComment('');

        try {
            await api.postComment({ rumor_id: rumorId, content: optimisticComment.content });
            loadComments(); // Refresh for real data
        } catch (e) {
            console.error("Failed to post", e);
            // Revert if failed
            setComments(prev => prev.filter(c => c.id !== tempId));
        }
    };

    return (
        <div className="w-full border-t border-white/5 bg-black/20">

            {/* Toggle Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold text-muted-foreground hover:bg-white/5 transition active:bg-white/10"
            >
                <div className="flex items-center gap-2">
                    <MessageSquare size={14} />
                    {comments.length > 0 ? `${comments.length} Comments` : 'Join the discussion'}
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={14} />
                </motion.div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-4">

                            {/* List */}
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {comments.length === 0 && !loading && (
                                    <div className="text-center py-6 text-muted-foreground/50 text-xs italic">
                                        No secrets shared yet. Be the first.
                                    </div>
                                )}

                                {comments.map((comment, i) => (
                                    <motion.div
                                        key={comment.id}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white/5 rounded-lg p-3 border border-white/5"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                                                    <User size={10} className="text-muted-foreground" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-200">
                                                    {comment.users?.username || 'Anon'}
                                                </span>
                                                {/* Trust Score Mini Badge */}
                                                {comment.users && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${comment.users.trust_score >= 0.7 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {Math.round(comment.users.trust_score * 100)}% Trust
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatTimeAgo(comment.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed pl-7">
                                            {comment.content}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSubmit} className="relative mt-4">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add to the intel..."
                                    className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-4 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="absolute right-1.5 top-1.5 p-1.5 bg-primary/20 hover:bg-primary/40 text-primary rounded-full transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <Send size={14} />
                                </button>
                            </form>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
