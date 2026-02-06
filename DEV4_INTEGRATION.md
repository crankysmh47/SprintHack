# 🔗 DEV 4: INTEGRATION (The Glue)

**Your Role:** You are the Safety Net. You ensure Dev 1's backend talks to Dev 3's frontend, handle state management, and manage errors. You are also the **Chief Tester**.

**Your Deliverable:** A robust `api.ts` client, a global state store (Zustand), and the final Integration Test.

---

## 🎯 What You're Building

1. **The API Layer** - A clean TypeScript interface for all backend calls.
2. **The State Store** - Managing user sessions and feed data.
3. **The Ripple Logic** - Filtering rumors on the client side (since we simplified the backend).

**Why this matters:** If the pieces don't fit, the project fails. You make them fit.

---

## 🛠️ Setup (15 minutes)

Work in the `frontend/` directory created by Dev 3.

```bash
cd frontend
npm install zustand axios
```

---

## 📝 TASK 1: The API Client (30 minutes)

Create `lib/api.ts`. This acts as the contract enforcement between frontend and backend.

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// Types defining our contract
export interface Rumor {
  id: string;
  content: string;
  author_id: string;
  verified_result: boolean | null;
  trust_score: number;
}

export interface VotePayload {
  user_id: string;
  rumor_id: string;
  vote: boolean;
  prediction: number;
}

export interface JoinResponse {
  user_id: string;
  message: string;
}

// The API Client
export const api = {
  /**
   * Fetch the personalized feed for a user.
   */
  async fetchFeed(userId: string): Promise<Rumor[]> {
    try {
      const res = await axios.get(`${API_BASE}/api/feed`, {
        params: { user_id: userId }
      });
      return res.data.rumors;
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      throw error;
    }
  },

  /**
   * Submit a vote including the prediction.
   */
  async submitVote(payload: VotePayload) {
    try {
      const res = await axios.post(`${API_BASE}/api/vote`, payload);
      return res.data;
    } catch (error) {
      console.error("Failed to submit vote:", error);
      throw error;
    }
  },

  /**
   * Post a new rumor.
   */
  async postRumor(authorId: string, content: string) {
    try {
      const res = await axios.post(`${API_BASE}/api/rumor`, {
        author_id: authorId,
        content: content
      });
      return res.data;
    } catch (error) {
      console.error("Failed to post rumor:", error);
      throw error;
    }
  },

  /**
   * Check status of specific rumor (for polling/updates).
   */
  async getRumorStatus(rumorId: string) {
    const res = await axios.get(`${API_BASE}/api/status/${rumorId}`);
    return res.data;
  },

  /**
   * Process an invite code.
   */
  async joinWithInvite(inviteCode: string): Promise<JoinResponse> {
    const res = await axios.post(`${API_BASE}/api/join`, {
      invite_code: inviteCode
    });
    return res.data;
  }
};
```

---

## 📝 TASK 2: State Management (30 minutes)

Create `store/useStore.ts`. We need to track the "Current User" across the app once they log in.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rumor } from '@/lib/api';

interface AppState {
  userId: string | null;
  currentFeed: Rumor[];
  
  // Actions
  setUserId: (id: string) => void;
  setFeed: (rumors: Rumor[]) => void;
  logout: () => void;
  removeRumorFromFeed: (rumorId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userId: null,
      currentFeed: [],

      setUserId: (id) => set({ userId: id }),
      
      setFeed: (rumors) => set({ currentFeed: rumors }),
      
      logout: () => set({ userId: null, currentFeed: [] }),
      
      // Optimistic update: remove card immediately after swipe
      removeRumorFromFeed: (rumorId) => set((state) => ({
        currentFeed: state.currentFeed.filter(r => r.id !== rumorId)
      })),
    }),
    {
      name: 'rumor-storage', // Save to localStorage
    }
  )
);
```

---

## 📝 TASK 3: The Integration & "Ripple" Logic (30 minutes)

You need to modify `app/page.tsx` (built by Dev 3) to use your `useStore` and `api` client.

**Key Logic to Add:**
The "Ripple Protocol" says we shouldn't show rumors if they are too far away in the graph. Since the backend is simplified, **YOU implement the filter here.**

1. Ask Dev 1 to include `distance` in the feed response.
2. In `useEffect`, filter the feed:
   ```typescript
   const rumors = await api.fetchFeed(userId);
   // Only show rumors close to me OR verified "viral" rumors
   const filtered = rumors.filter(r => r.distance <= 2 || r.verified_result !== null);
   setFeed(filtered);
   ```

---

## 🧪 TASK 4: The Master Test (Hour 4)

**You are responsible for the final "It Works" verification.**

Run this checklist when everyone says they are done:

**1. The Cold Start:**
- Clear LocalStorage (`useStore.getState().logout()`).
- Enter a User ID from Dev 2's seed script (e.g., one of the "honest" users).
- **Pass if:** Feed loads with rumors.

**2. The Truth Test:**
- Find a rumor that is clearly TRUE (from the seed data).
- Vote TRUE on it. Slide prediction to 85%.
- **Pass if:** API returns 200 OK.

**3. The Verification Loop:**
- Have Dev 1 simulate 10 more votes on that rumor (using a script or database edit).
- Refresh the feed.
- **Pass if:** The card now shows a "Verified" badge.

**4. The Bot Check:**
- Use a "Bot" User ID (from Dev 2's list).
- Vote on a rumor.
- Check Dev 1's backend logs.
- **Pass if:** PageRank weight for this vote is low (<0.01).

---

## 📦 Your Deliverable Checklist

- [ ] `lib/api.ts` created and fully typed
- [ ] `store/useStore.ts` managing session state
- [ ] Error handling added (if API is down, show nice message)
- [ ] End-to-End test passed

---

## 🚨 Troubleshooting Guide

**Problem:** Frontend can't connect to Backend (`Connection Refused`).
**Fix:** Check if Dev 1 is running on port 8000. Check if `cors` is enabled in `main.py`.

**Problem:** "User not found" error.
**Fix:** Dev 2 needs to re-run `seed_database.py`. The IDs change every time the script runs!

**Problem:** Votes aren't changing the verification status.
**Fix:** The SP algorithm needs ~5 votes to trigger. Manually add votes in the DB or lower the threshold in Dev 1's code.

---

**Questions?** Check `SHARED_CONTRACT.md`.
