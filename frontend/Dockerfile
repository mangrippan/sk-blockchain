# ============================================
# ChainRank Frontend Dockerfile
# ============================================
# Multi-stage build: Build Vue app → Serve with Nginx

# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_BASE_URL=http://localhost:3000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config (optional - create if needed)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
