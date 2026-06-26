# ============================================
# Prima Backend Dockerfile
# ============================================
# Multi-stage build for production

# Stage 1: Dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/sk

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start application
CMD ["node", "server.js"]
