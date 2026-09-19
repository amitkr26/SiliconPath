# Build: docker build -f backend/server/Dockerfile .   (context = repo root)
# Uses the root workspace install so @berojgardegreewala/api and
# @berojgardegreewala/ai-gateway resolve exactly as they do locally.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/api/package.json backend/api/
COPY backend/ai-gateway/package.json backend/ai-gateway/
COPY backend/server/package.json backend/server/
COPY backend/worker/package.json backend/worker/
COPY frontend/package.json frontend/
# npm ci with --workspace only links workspaces the selected package depends
# on, so the worker must be named explicitly to get its symlink + deps.
RUN npm ci --workspace @berojgardegreewala/server --workspace @berojgardegreewala/worker --include-workspace-root

COPY . .
RUN npm run build --workspace @berojgardegreewala/server \
    && npm run build --workspace @berojgardegreewala/worker

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
# workspace symlinks in node_modules point at these relative paths
COPY --from=build /app/backend/api /app/backend/api
COPY --from=build /app/backend/ai-gateway /app/backend/ai-gateway
COPY --from=build /app/backend/server/dist /app/dist
COPY --from=build /app/backend/server/package.json /app/package.json
# worker dist (used by the cron job: node --import tsx backend/worker/dist/index.js news)
COPY --from=build /app/backend/worker/dist /app/backend/worker/dist
COPY --from=build /app/backend/worker/package.json /app/backend/worker/package.json

# Run as the unprivileged node user (uid 1000). Files stay root-owned/readable.
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "--import", "tsx", "dist/server.js"]