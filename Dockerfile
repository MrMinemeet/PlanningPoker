# === Configure base build image
# Multi-stage build for Planning Poker app
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.24.0

WORKDIR /app

# === Frontend build stage
FROM base AS frontend-build
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build

# === Backend build stage  
FROM base AS backend-build
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY backend/ ./
RUN pnpm exec tsc

# === Configure production image
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.24.0

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Copy compiled backend
COPY --from=backend-build /app/dist ./dist

# Copy built frontend to public directory
COPY --from=frontend-build /app/dist ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "dist/index.js"]