FROM node:20-slim AS builder
WORKDIR /app

# Build context is repo root — COPY paths are relative to repo root
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN cd apps/api && npm install

COPY apps/api/src ./apps/api/src
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/src ./packages/db/src

RUN cd apps/api && npx prisma generate --schema=../packages/db/prisma/schema.prisma && npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY apps/api/package.json ./
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/src/seed.ts ./packages/db/src/seed.ts

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["/bin/sh", "-c", "npx prisma db push --schema=packages/db/prisma/schema.prisma --accept-data-loss 2>&1 && npx tsx packages/db/src/seed.ts 2>&1 && node dist/server.js"]
