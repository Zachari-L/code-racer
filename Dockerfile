# syntax=docker/dockerfile:1
# CodeRacer runs a custom Node server (Next.js + WebSocket on one port),
# so the image ships the full app instead of Next's standalone output.

# 1. Dependencies, installed with Bun from the lockfile.
FROM oven/bun:1.4.1-debian AS deps
WORKDIR /app
COPY package.json bun.lock prisma.config.ts ./
# postinstall runs `prisma generate`, which needs the schema.
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# 2. Build: Prisma client + Next.js production build.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

# 3. Runtime.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    TRUST_PROXY=true

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts /app/package.json /app/tsconfig.json /app/next.config.ts /app/prisma.config.ts ./

USER nextjs
EXPOSE 3000
# Migrations run as Fly's release command (fly.toml) before traffic switches.
CMD ["node", "--import", "tsx", "server.ts"]
