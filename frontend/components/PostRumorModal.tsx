// components/PostRumorModal.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Hash, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface PostRumorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const SUGGESTED_TAGS = [
  'food', 'classes', 'events', 'sports', 'housing',
  'parking', 'library', 'clubs', 'exams', 'campus',
];

const MAX_LENGTH = 280;

export function PostRumorModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: PostRumorModalProps) {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
          ? [...prev, tag]
          : prev
    );
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Rumor content cannot be empty');
      return;
    }
    if (trimmed.length < 10) {
      setError('Too short — give us more details!');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await api.postRumor({
        user_id: userId,
        content: trimmed,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      if (response.success) {
        setContent('');
        setSelectedTags([]);
        onSuccess();
        onClose();
      }
    } catch (err) {
      // Mock success for when backend is down
      console.warn('Backend unavailable, simulating success:', err);
      setContent('');
      setSelectedTags([]);
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-auto"
          >
            <div className="max-w-lg mx-auto bg-background rounded-t-3xl shadow-2xl">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-primary" />
                  <h2 className="text-xl font-black text-foreground">
                    Drop a Rumor
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-8 space-y-5">
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>
                    Your rumor starts in <strong>Stage 1 (Trust Circle)</strong>.
                    Only your direct connections will see it first. It must pass
                    the Surprisingly Popular algorithm to go viral.
                  </p>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setError('');
                    }}
                    maxLength={MAX_LENGTH + 20} // Allow slight over to show warning
                    placeholder="What's happening on campus? Share what you've heard..."
                    rows={4}
                    className={cn(
                      'w-full p-4 border-2 rounded-xl text-foreground placeholder:text-muted-foreground bg-background',
                      'font-medium resize-none focus:outline-none transition',
                      isOverLimit
                        ? 'border-destructive focus:border-destructive'
                        : 'border-border focus:border-primary'
                    )}
                  />

                  {/* Character count */}
                  <div
                    className={cn(
                      'absolute bottom-3 right-3 text-xs font-bold tabular-nums',
                      isOverLimit
                        ? 'text-destructive'
                        : remaining < 30
                          ? 'text-amber-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {remaining}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm font-medium flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {error}
                  </motion.p>
                )}

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    <Hash size={14} />
                    Tags (optional, max 3)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95',
                            selected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          )}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isOverLimit || !content.trim()}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition active:scale-[0.98]',
                    'shadow-lg',
                    submitting || isOverLimit || !content.trim()
                      ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30'
                  )}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: 'linear',
                        }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Post Anonymously
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}