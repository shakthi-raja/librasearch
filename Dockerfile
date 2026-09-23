# Production image for the web app. The database, Qdrant and Redis stay in
# their own services; compose supplies their addresses.
FROM node:24.20.0-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1 \
    DB_NAME=librasearch \
    DB_AUTH_PASSWORD=build-only-placeholder \
    DB_STUDENT_PASSWORD=build-only-placeholder \
    DB_FACULTY_PASSWORD=build-only-placeholder \
    DB_LIBRARIAN_PASSWORD=build-only-placeholder \
    REDIS_URL=redis://placeholder:6379
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
