FROM node:24-slim AS base
WORKDIR /app
# Node/Vite+ need a system CA bundle in Docker so the workspace build can initialize HTTPS clients.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# ---
FROM base AS prepare
COPY . .
# Prune the monorepo for the admin app
RUN pnpm dlx turbo prune admin --docker

# ---
FROM base AS installer
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
# Install dependencies
RUN pnpm install --frozen-lockfile

# ---
FROM base AS builder
# Copy dependencies
COPY --from=installer /app/ .
# Copy source files
COPY --from=prepare /app/out/full/ .
# Ensure shared env schema is available for varlock imports
COPY .env.shared ./.env.shared

ARG APP_ENV=production

# Build the admin app
RUN pnpm run prisma:generate
RUN APP_ENV=${APP_ENV} pnpm run build --filter=admin

# ---
FROM nginx:alpine AS runner
# Copy built static files to nginx
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime env script and make it executable
# This script runs on container startup to replace MY_APP_* placeholders
COPY --chmod=755 apps/admin/env.sh /docker-entrypoint.d/env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
