FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
COPY admin-dashboard/package.json ./admin-dashboard/package.json
COPY packages/ ./packages/
COPY tsconfig.json turbo.json ./
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/tsconfig.json /app/turbo.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
COPY admin-dashboard/ ./admin-dashboard/
RUN npx tsc -p apps/api/tsconfig.json --outDir apps/api/dist
RUN cd admin-dashboard && npx vite build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=${PORT:-3000}

WORKDIR /app

RUN apt-get update -qq && apt-get install -y -qq curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/admin-dashboard/dist ./admin-dashboard/dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/server.js"]
