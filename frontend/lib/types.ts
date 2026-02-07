export interface Rumor {
    id: string;
    content: string;
    verified_result: boolean | null;
    trust_score: number;
    created_at: string;
    author_id?: string;
    distance?: number;
    stage?: 'circle' | 'neighbor' | 'global';
    vote_count?: number;
    tags?: string[];
}

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    rumor_id: string;
    parent_id?: string;
    users?: { username: string; trust_score: number }; // Joined data
}

export type SwipeDirection = 'left' | 'right' | null;

export interface VoteResponse {
    new_trust_score: number;
    sp_result: {
        information_gain: number;
    };
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
}
