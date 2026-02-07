# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json ./
# Legacy peer deps for robustness
RUN npm install --legacy-peer-deps

# Copy source and build
COPY frontend/ .
# This generates 'out/' directory
RUN npm run build 

# --- Stage 2: Setup Backend & Finale ---
FROM python:3.9-slim

WORKDIR /app

# Install Backend Deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ ./backend

# Copy Frontend Build from Stage 1
# Copy Frontend Build from Stage 1 to a clean 'static' folder
COPY --from=frontend-builder /app/frontend/out /app/static

# Environment Configuration
ENV PORT=8080
EXPOSE 8080

# Run FastAPI with Debugging
# We list files before starting to prove they exist
CMD sh -c "echo '--- DOCKER FILE DEBUG ---' && ls -R /app/static && uvicorn backend.main:app --host 0.0.0.0 --port 8080"
