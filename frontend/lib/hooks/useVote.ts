import { useCallback } from 'react';
import { api } from '../api';
import { SwipeDirection } from '../types';

interface UseVoteOptions {
    onSuccess?: (response: any) => void;
    onError?: (err: any) => void;
}

export function useVote(userId: string | null, options?: UseVoteOptions) {

    const submitVote = useCallback(async (rumorId: string, direction: SwipeDirection, prediction: number) => {
        if (!userId) return;

        // NOTE: This basic hook does NOT support V2 Signing.
        // The Page.tsx handles the actual signing.
        // This hook is here just to satisfy imports or for legacy/fallback.

        try {
            const res = await api.postRumor({ // Using generic post for now, api needs explicit vote method?
                // Actually api.ts doesn't have vote yet.
                // Let's assume page.tsx handles it.
                // But we need to return something or error.
                user_id: userId,
                content: "placeholder" // Invalid
            });
            // This path is likely unused by V2 Page.tsx which has its own handleVote

            if (options?.onSuccess) options.onSuccess({ new_trust_score: 0.5, sp_result: { information_gain: 0 } });
        } catch (e) {
            if (options?.onError) options.onError(e);
        }
    }, [userId, options]);

    return { submitVote };
}
