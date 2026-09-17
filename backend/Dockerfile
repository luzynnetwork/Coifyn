# Multi-stage build for the Coifyn API (NestJS modular monolith).
# Build:  docker build -t coifyn-api -f backend/Dockerfile backend
# Run:    docker run -p 4000:4000 --env-file .env coifyn-api

# ---- deps: install full (dev+prod) deps for the build stage -----------------
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript -> dist --------------------------------------
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
    && npm prune --omit=dev

# ---- runtime: minimal image, prod deps + compiled output only --------------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 1001 coifyn \
    && useradd --system --uid 1001 --gid coifyn coifyn

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./package.json

USER coifyn
EXPOSE 4000

# Basic liveness check the ECS task definition's healthCheck can also target.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main"]
