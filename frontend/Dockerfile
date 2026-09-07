# ============================================================
# BerojgarDegreeWala Frontend — Multi-Stage Production Dockerfile
# Build: docker build -f frontend/Dockerfile . (context = repo root)
# ============================================================

# Stage 1: Workspace Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/api/package.json backend/api/
COPY backend/ai-gateway/package.json backend/ai-gateway/
COPY backend/server/package.json backend/server/
COPY backend/worker/package.json backend/worker/
COPY frontend/package.json frontend/
RUN npm ci --workspace berojgardegreewala-frontend --include-workspace-root

# Stage 2: Application Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV DOCKER_BUILD 1

RUN npm run build --workspace berojgardegreewala-frontend

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/frontend/public ./public

# Automatically leverage output traces from standalone build
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "frontend/server.js"]
