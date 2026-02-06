# 🎯 Decentralized Rumor Verification System

**The Problem:** Campus rumors spread fast, but nobody knows what's true.

**The Solution:** A system where math—not admins—determines truth, and bot attacks are mathematically prevented.

---

## 🧠 How It Works

### 1. The Trust Graph
- Users invite each other → creates a social network
- PageRank assigns "trust weights" to users based on connections
- Bot farms are isolated → their votes have minimal impact

### 2. The Surprisingly Popular Algorithm
- Ask: "Is this true?" AND "What % will say true?"
- Winner = the answer that's **more popular than predicted**
- Prevents majority-rule failures

### 3. The Ripple Protocol
- Rumors start with close friends (graph distance ≤ 1)
- If verified → expand to friends-of-friends
- Bot farm rumors get quarantined before going viral

---

## 👥 Team Roles

| Dev | Role | Guide | Deliverable |
|-----|------|-------|-------------|
| **Dev 1** | Backend Core | [`DEV1_BACKEND_CORE.md`](.\DEV1_BACKEND_CORE.md) | FastAPI server with PageRank + SP |
| **Dev 2** | Database & Auth | [`DEV2_DATABASE_AUTH.md`](.\DEV2_DATABASE_AUTH.md) | Supabase with 200+ users |
| **Dev 3** | Frontend UI/UX | [`DEV3_FRONTEND_UI.md`](.\DEV3_FRONTEND_UI.md) | Swipe interface |
| **Dev 4** | Integration | [`DEV4_INTEGRATION.md`](.\DEV4_INTEGRATION.md) | API client + state |

---

## 📜 The Shared Contract

**[`SHARED_CONTRACT.md`](.\SHARED_CONTRACT.md)** ← READ THIS FIRST

Contains:
- Database schemas
- API endpoint specs
- Math algorithms
- UI flows
- Testing strategy

**This is the Bible. If everyone follows it, integration will work.**

---

## ⚡ Quick Start

### Dev 1: Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn networkx supabase
python main.py
```

### Dev 2: Database
1. Create Supabase project
2. Run SQL from contract
3. Run seed script
4. Share credentials

### Dev 3: Frontend
```bash
npx create-next-app@latest frontend
cd frontend
npm run dev
```

### Dev 4: Integration
1. Create `lib/api.ts`
2. Wire up all endpoints
3. Test full flow

---

## 🧪 Integration Test (Hour 4)

1. ✅ User posts rumor
2. ✅ Appears in feed
3. ✅ User swipes + predicts
4. ✅ Backend runs PageRank + SP
5. ✅ Frontend shows "Verified ✓"

---

## 🚨 If You're Blocked

1. Check your dev guide
2. Check `SHARED_CONTRACT.md`
3. Ask in group chat: "Blocked on X, need Y from Dev Z"

---

## 📊 Demo Script (Hour 5)

**Show the judges:**

1. **The Bot Attack Simulation**
   - "We seeded 50 bot accounts that all vote FALSE"
   - "But PageRank gives them minimal weight"
   - Show `/api/debug/pagerank` → bots have ~0.001 weight

2. **The SP Algorithm**
   - "This rumor has 60% TRUE votes"
   - "But people predicted 80% would say TRUE"
   - "SP says: This is DISPUTED (fewer than expected)"

3. **The Ripple Protocol**
   - "Bot farm rumors never leave their cluster"
   - Show diagram of isolated bot subgraph

---

## 📚 Tech Stack

- **Backend:** FastAPI, NetworkX, Supabase
- **Frontend:** Next.js, Tailwind, Framer Motion
- **Database:** PostgreSQL (via Supabase)
- **Math:** PageRank, Surprisingly Popular Algorithm

---

## 🎯 Success Criteria

- [ ] 4 tables with realistic data (200+ users)
- [ ] PageRank working (isolates bots)
- [ ] SP algorithm working (prevents mob rule)
- [ ] Swipe UI working
- [ ] Full flow: post → vote → verify

---

**Built for [Hackathon Name]**  
**Time Budget:** 5 hours  
**Team Size:** 4 developers
