# PriceAI API — multi-stage build (contexto = raiz do monorepo)
# docker build -f apps/api/Dockerfile .

# ── deps + build ─────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @priceai/api... --frozen-lockfile || pnpm install --filter @priceai/api...

COPY apps/api apps/api
RUN pnpm --filter @priceai/api prisma:generate \
  && pnpm --filter @priceai/api build

# ── produção ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @priceai/api... --prod --frozen-lockfile || pnpm install --filter @priceai/api... --prod

COPY apps/api/prisma apps/api/prisma
RUN pnpm --filter @priceai/api prisma:generate

COPY --from=build /repo/apps/api/dist apps/api/dist

WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
