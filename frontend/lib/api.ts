
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = {
    postRumor: async (data: { user_id: string; content: string; tags?: string[] }) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/rumor`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error('Failed to post rumor');
        }

        // Check if response has body
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const json = await res.json();
            return { success: true, ...json };
        }

        return { success: true };
    },



    getComments: async (rumorId: string) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/comments/${rumorId}`, { headers });
        if (!res.ok) return { comments: [] };
        return res.json();
    },

    postComment: async (data: { rumor_id: string; content: string; parent_id?: string }) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const res = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to post comment");
        return res.json();
    },

    // Add other methods as I discover them or as generic wrappers
    get: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}${endpoint}`, { headers });
        return res.json();
    }
};
