# ============================================================
# Multi-stage сборка: deps -> prisma -> builder -> migrator -> runner
# Используется Prisma v7 (generator "prisma-client", adapter-pg).
# Нативные модули (sharp, pg) — только в slim-образе (не alpine!).
# ============================================================

# ---------- 1. Зависимости ----------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. Prisma Client ----------
# Отдельный stage, чтобы migrator не зависел от builder и не запускал next build.
FROM node:22-slim AS prisma
WORKDIR /app
# Prisma schema engine требует OpenSSL на Linux
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN mkdir -p src/generated && npx prisma generate

# ---------- 3. Сборка ----------
FROM node:22-slim AS builder
WORKDIR /app
# NEXT_PUBLIC_* вшивается в клиентские бандлы на этапе сборки,
# поэтому пробрасывается из .env через build-args (compose).
# SITE_URL нужен при сборке для пререндера статики (robots/sitemap).
ARG NEXT_PUBLIC_METRIKA_ID=""
ARG SITE_URL=""
ENV NEXT_PUBLIC_METRIKA_ID=${NEXT_PUBLIC_METRIKA_ID}
ENV SITE_URL=${SITE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=prisma /app/src/generated ./src/generated
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 4. Migrator (миграции + seed) ----------
# Лёгкий этап: devDeps (prisma CLI, tsx, dotenv) + сгенерированный клиент.
# Запускается от root: Prisma CLI пишет engine-бинарники в node_modules/@prisma/engines.
FROM node:22-slim AS migrator
WORKDIR /app
ENV NODE_ENV=production
# Prisma schema engine требует OpenSSL на Linux
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
COPY tsconfig.json ./
COPY --from=prisma /app/src/generated ./src/generated

# ---------- 5. Runtime (standalone) ----------
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