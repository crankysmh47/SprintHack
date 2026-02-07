# 🚀 Deployment Guide: One-Click Leapcell

You requested a **single deployment** for the whole project. We have unified everything into one `Dockerfile`.

## 📦 1. Pre-Requisites
Push the latest changes (which include the new Root `Dockerfile`):
```bash
git add .
git commit -m "Switch to Single-Container Deployment"
git push origin main
```

---

## ⚡ 2. Deploy on Leapcell (Single Service)

1. **Log in to Leapcell Dashboard**.
2. Click **"Create Service"** → **"From GitHub Repository"**.
3. Select `crankysmh47/SprintHack`.
4. **Configuration**:
   - **Name**: `sprinthack-unified`
   - **Root Directory**: `.` (The Root Directory)
   - **Build Type**: `Docker` (It will find the root `Dockerfile`)
   - **Port**: `8080`
5. **Environment Variables**:
   Add the secrets from your `.env` file:
   - `SUPABASE_URL`: `...`
   - `SUPABASE_KEY`: `...`
   - `JWT_SECRET`: `...`
6. Click **Deploy**.

---

## 🔍 How it Works
1. The **Dockerfile** is a "Multi-Stage Build".
2. **Stage 1 (Node.js)**: It installs dependencies and builds the Frontend static files (`frontend/out`).
3. **Stage 2 (Python)**: It installs the Backend dependencies.
4. **Merge**: It copies the static frontend files *into* the backend.
5. **Run**: It starts FastAPI. FastAPI serves the API on `/api` and the Frontend on `/`.

## ✅ Verification
- Open your Leapcell URL.
- **Frontend**: Should load correctly (served by FastAPI).
- **Backend**: API calls should work (served by the same instance).
