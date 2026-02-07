# 🚀 Deployment Guide: Leapcell

Your project is ready for deployment! Since Leapcell supports Docker, we have containerized both the **Backend (FastAPI)** and **Frontend (Next.js)**.

## 📦 1. Pre-Requisites
Ensure your latest code (including Dockerfiles) is pushed to GitHub:
```bash
git add .
git commit -m "Added Dockerfiles for Leapcell"
git push origin main
```

---

## 🐍 2. Deploy Backend (FastAPI)

1. **Log in to Leapcell Dashboard**.
2. Click **"Create Service"** → **"From GitHub Repository"**.
3. Select `crankysmh47/SprintHack`.
4. **Configuration**:
   - **Name**: `sprinthack-backend`
   - **Root Directory**: `backend` (Important!)
   - **Build Type**: `Docker` (It will auto-detect the Dockerfile in `backend/`)
   - **Port**: `8080`
5. **Environment Variables**:
   Add the secrets from your `.env` file:
   - `SUPABASE_URL`: `...`
   - `SUPABASE_KEY`: `...`
   - `JWT_SECRET`: `...` (Generate a random string if needed)
6. Click **Deploy**.
7. **Copy the Service URL** (e.g., `https://sprinthack-backend-xyz.leapcell.app`).

---

## ⚛️ 3. Deploy Frontend (Next.js)

1. **Create Another Service** in Leapcell.
2. Select `crankysmh47/SprintHack` again.
3. **Configuration**:
   - **Name**: `sprinthack-frontend`
   - **Root Directory**: `frontend`
   - **Build Type**: `Docker` (Auto-detects `frontend/Dockerfile`)
   - **Port**: `3000`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Paste the **Backend Service URL** from Step 2.
     - Example: `https://sprinthack-backend-xyz.leapcell.app/api`
     - **Note**: Ensure you append `/api` if your frontend expects it, or just the base URL if your API client adds it. Check `frontend/lib/api.ts` to be sure.
5. Click **Deploy**.

---

## 🔍 4. Verification

1. Open your **Frontend URL**.
2. Try to **Login/Register** (Hits the Backend).
3. Check the **Feed**.
4. If you see CORS errors:
   - Go to Backend Service in Leapcell.
   - The code currently allows `allow_origins=["*"]`, so it should work immediately!

## 🆘 Troubleshooting

- **Backend fails to start?** Check Leapcell Logs. Ensure `requirements.txt` includes `bcrypt`, `pyjwt`, `supabase`.
- **Frontend can't connect?** Check Chrome DevTools Network Tab. Verify `NEXT_PUBLIC_API_URL` is set correctly.
