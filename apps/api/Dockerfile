FROM node:20-slim AS builder

WORKDIR /app

# نسخ ملفات الاعتماديات أولاً للاستفادة من Docker cache
COPY package*.json ./

COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# تثبيت الاعتماديات
RUN npm install

# نسخ باقي الملفات
COPY apps/api ./apps/api
COPY packages/db ./packages/db

# إنشاء Prisma Client
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# بناء الـ API
RUN npm run build --prefix apps/api

# =========================================

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# نسخ الملفات المطلوبة فقط
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

COPY apps/api/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma db push --schema=packages/db/prisma/schema.prisma --accept-data-loss && node dist/server.js"]