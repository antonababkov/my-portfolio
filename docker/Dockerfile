# ============================================================
# Multi-stage сборка: deps -> builder -> migrator -> runner (standalone)
# Используется Prisma v7 (generator "prisma-client", adapter-pg).
# Нативные модули (sharp, pg) — только в slim-образе (не alpine!).
# ============================================================

# ---------- 1. Зависимости ----------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# ---------- 2. Сборка ----------
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---------- 3. Migrator (миграции + seed) ----------
# Лёгкий этап: devDeps (prisma CLI, tsx, dotenv) + сгенерированный клиент.
# Запускается от root: Prisma CLI пишет engine-бинарники в node_modules/@prisma/engines.
FROM node:22-slim AS migrator
WORKDIR /app
ENV NODE_ENV=production
# Prisma schema engine требует OpenSSL на Linux
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# ---------- 4. Runtime (standalone) ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Не запускаемся от root
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs && mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app /app/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Открываем доступ на запись в uploads контейнеру (volume монтируется поверх)
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]