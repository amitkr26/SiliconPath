FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ src/
RUN npx tsc

FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup app && adduser -S -G app app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/ dist/
USER app
EXPOSE 3001
CMD ["node", "dist/index.js"]
