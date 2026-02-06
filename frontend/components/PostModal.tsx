'use client';

import { useState } from 'react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostModal({ isOpen, onClose }: PostModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const authorId = localStorage.getItem('user_id');
    if (!content || !authorId) {
      if (!authorId) alert("No User ID found. Please refresh.");
      return;
    }

    setLoading(true);
    try {
      await fetch('http://localhost:8000/api/rumor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          author_id: authorId
        })
      });
      alert('Posted!');
      setContent('');
      onClose();
    } catch {
      alert('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 space-y-4">
        <h2 className="text-xl font-bold">Post a Rumor</h2>
        <textarea
          className="w-full h-32 p-2 border rounded-lg"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            onClick={onClose}
          >Cancel</button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={submit}
            disabled={loading}
          >Post</button>
        </div>
      </div>
    </div>
  );
}
