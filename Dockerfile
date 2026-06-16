FROM node:20-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json turbo.json ./

FROM base AS deps
COPY apps/api/package.json ./apps/api/package.json
COPY admin-dashboard/package.json ./admin-dashboard/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ ./apps/api/
COPY admin-dashboard/ ./admin-dashboard/
COPY packages/ ./packages/
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma && npx tsc -p apps/api/tsconfig.json && cd admin-dashboard && npx vite build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
WORKDIR /app
RUN apt-get update -qq && apt-get install -y -qq curl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/admin-dashboard/dist ./admin-dashboard/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 CMD curl -f http://localhost:${PORT}/health || exit 1
CMD ["node", "dist/server.js"]