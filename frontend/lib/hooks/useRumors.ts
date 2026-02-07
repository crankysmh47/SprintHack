import { useState, useEffect, useCallback } from 'react';
import { Rumor } from '../types';
import { api } from '../api';

export type SortOption = 'latest' | 'popularity' | 'relevance';

export function useRumors(userId: string | null) {
    const [rumors, setRumors] = useState<Rumor[]>([]);
    const [loading, setLoading] = useState(false);
    const [userTrustRank, setUserTrustRank] = useState(0.5); // Default
    const [globalStats, setGlobalStats] = useState({ sync_percent: 0, user_count: 0 });

    // Pagination & Sorting State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [sortBy, setSortBy] = useState<SortOption>('popularity');
    const [totalRumors, setTotalRumors] = useState(0);

    const fetchFeed = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // 1. Fetch Feed with Pagination & Sorting
            const data = await api.get(`/feed?user_id=${userId}&page=${page}&limit=${limit}&sort=${sortBy}`);
            if (data.rumors) {
                setRumors(data.rumors);
                if (data.total !== undefined) setTotalRumors(data.total);
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
                // Warning suppressed
            }

        } catch (err) {
            console.error("Feed Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userId, page, limit, sortBy]);

    useEffect(() => {
        if (userId) {
            fetchFeed();
        }
    }, [userId, fetchFeed]);

    const totalPages = Math.ceil(totalRumors / limit);

    return {
        rumors,
        loading,
        userTrustRank,
        globalStats,
        refetch: fetchFeed,
        // Pagination & Sorting Controls
        page,
        setPage,
        totalPages,
        sortBy,
        setSortBy
    };
}
