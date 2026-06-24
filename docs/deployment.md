# Deployment Guide

## Stack
- **Backend:** Fastify 5 (TypeScript, ESM)
- **Frontend:** React 19 + Vite 8 + MUI 9 + TailwindCSS 4
- **Database:** PostgreSQL (Prisma for schema + raw `pg` for queries)
- **Deployment:** Docker multi-stage build → Railway

---

## Railway Deployment (Recommended)

1. **Push your repository to GitHub**

2. **Create a new Railway project** from your GitHub repo

3. **Configure environment variables:**
   ```
   JWT_SECRET=<generate a 64-char hex string>
   DATABASE_URL=<Railway PostgreSQL connection string>
   CORS_ORIGINS=https://your-crm-domain.com
   NODE_ENV=production
   LOG_LEVEL=info
   PORT=3000
   HOST=0.0.0.0
   VITE_API_URL=https://your-app.railway.app
   ```

4. **Add a PostgreSQL plugin** in Railway — the `DATABASE_URL` is auto-injected

5. **Deploy** — Railway detects the Dockerfile and builds automatically

   The health check endpoint at `/health` is used by Railway for monitoring.

6. **Run migrations** after first deploy:
   ```bash
   railway run npx prisma db push --schema=packages/db/prisma/schema.prisma
   ```

7. **Seed initial data:**
   ```bash
   railway run npx tsx packages/db/src/seed.ts
   ```

   Default credentials: `admin@lens-iq.com` / `admin123`

---

## Docker Deployment (Manual)

```bash
# Build the image
docker build -t lens-iq:latest .

# Run with PostgreSQL
docker run -d \
  --name lens-iq \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=<your-secret> \
  -e CORS_ORIGINS=https://your-frontend.com \
  lens-iq:latest
```

The Dockerfile uses a multi-stage build:
- **Stage 1:** Base Node 20-slim
- **Stage 2:** Install dependencies
- **Stage 3:** Build (Prisma generate + TypeScript + Vite)
- **Stage 4:** Production runner with health check

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway auto-injects) |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `PORT` | No | Server port (default: 3000) |
| `HOST` | No | Server host (default: 0.0.0.0) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |
| `FRONTEND_DIST` | No | Path to frontend dist (auto-detected via Docker) |
| `VITE_API_URL` | For frontend | API URL for the admin dashboard |

---

## Local Development

The project does NOT use Docker Compose. For local development:

1. Ensure PostgreSQL is running locally or via Docker:
   ```bash
   docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
   ```

2. Copy `.env.example` to `apps/api/.env` and adjust

3. Install dependencies and push schema:
   ```bash
   npm install
   npx prisma db push
   ```

4. Run backend:
   ```bash
   npm run dev:api
   ```

5. Run frontend:
   ```bash
   npm run dev:fe
   ```

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Verify CORS origins only include trusted domains
- [ ] Enable PostgreSQL SSL (`?sslmode=require` in DATABASE_URL)
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting (already active: 100 req/min by default)
- [ ] Add monitoring / alerting
- [ ] Set up database backups
- [ ] Configure custom domain + SSL
