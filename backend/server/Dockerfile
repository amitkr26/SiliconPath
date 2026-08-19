# Build: docker build -f backend/server/Dockerfile .   (context = repo root)
# Uses the root workspace install so @berojgardegreewala/api and
# @berojgardegreewala/ai-gateway resolve exactly as they do locally.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/api/package.json backend/api/
COPY backend/ai-gateway/package.json backend/ai-gateway/
COPY backend/server/package.json backend/server/
COPY frontend/package.json frontend/
RUN npm ci --workspace @berojgardegreewala/server --include-workspace-root

COPY . .
RUN npm run build --workspace @berojgardegreewala/server

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
# workspace symlinks in node_modules point at these relative paths
COPY --from=build /app/backend/api /app/backend/api
COPY --from=build /app/backend/ai-gateway /app/backend/ai-gateway
COPY --from=build /app/backend/server/dist /app/dist
COPY --from=build /app/backend/server/package.json /app/package.json

# Run as the unprivileged node user (uid 1000). Files stay root-owned/readable.
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "--import", "tsx", "dist/server.js"]