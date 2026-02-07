import { useState, useEffect, useCallback } from 'react';
import { Rumor } from '../types';
import { api } from '../api';

export function useRumors(userId: string | null) {
    const [rumors, setRumors] = useState<Rumor[]>([]);
    const [loading, setLoading] = useState(false);
    const [usingMockData, setUsingMockData] = useState(false);
    const [userTrustRank, setUserTrustRank] = useState(0.5); // Default
    const [globalStats, setGlobalStats] = useState({ sync_percent: 0, user_count: 0 });

    const fetchFeed = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // 1. Fetch Feed
            const data = await api.get(`/feed?user_id=${userId}`);
            if (data.rumors) {
                setRumors(data.rumors);
            }

            // 2. Fetch User Stats (Trust Rank)
            try {
                const me = await api.get(`/me`);
                if (me.trust_score) setUserTrustRank(me.trust_score);
            } catch (e) {
                console.warn("Could not fetch user stats", e);
            }

            // 3. Fetch System Stats
            try {
                const stats = await api.get(`/stats`);
                setGlobalStats(stats);
            } catch (e) {
                console.warn("Could not fetch system stats", e);
            }

        } catch (err) {
            console.error("Feed Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchFeed();
        }
    }, [userId, fetchFeed]);

    return {
        rumors,
        loading,
        usingMockData,
        userTrustRank,
        globalStats,
        progress: rumors.length > 0 ? 100 : 0,
        refetch: fetchFeed
    };
}
