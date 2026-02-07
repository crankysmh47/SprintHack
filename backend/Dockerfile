FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory into a 'backend' package structure
# We do this so 'from .trust_engine' relative imports continue to work
# when we run 'uvicorn backend.main:app'
COPY . ./backend

# Expose the port (Leapcell expects 8080 usually, or we configure it)
ENV PORT=8080
EXPOSE 8080

# Run commands from the /app root (so package resolution works)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
