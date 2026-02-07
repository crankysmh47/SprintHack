FROM node:18-alpine

WORKDIR /app

# Install dependencies (use legacy-peer-deps for safety)
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build Next.js app
# Note: NEXT_PUBLIC_ variables must be set at BUILD time if using static optimization
# But for runtime lookup, just ensure env vars are present in Leapcell
RUN npm run build

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["npm", "start"]
