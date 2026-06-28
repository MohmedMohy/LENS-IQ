# ── Build stage ──
FROM node:20-slim AS builder
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Production stage (Nginx) ──
FROM nginx:alpine AS runner
ENV PORT=8080
EXPOSE 8080
ARG API_URL
ENV API_URL=$API_URL

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

COPY --from=builder /app/nginx-default.conf /etc/nginx/conf.d/default.conf.template

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/ || exit 1

CMD ["/bin/sh", "-c", "API_URL=${API_URL:-http://127.0.0.1:1} && export API_URL && envsubst '${PORT} ${API_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
