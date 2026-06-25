FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN apt-get update -qq && apt-get install -y -qq curl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY tsconfig.json turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
RUN npm install

FROM deps AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/ ./apps/api/
COPY apps/admin-dashboard/ ./apps/admin-dashboard/
COPY packages/ ./packages/
RUN cd apps/api && npx tsc -p tsconfig.json && cd /app && \
    cd apps/admin-dashboard && npx vite build && cd /app

FROM base AS runner
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/admin-dashboard/dist ./admin-dashboard/dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 CMD curl -f http://localhost:${PORT}/health || exit 1
CMD ["node", "dist/server.js"]
