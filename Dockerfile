# =============================================================================
# Multi-stage Dockerfile for the Sartho Billing / Inventory API (NestJS + Prisma)
#
# Base image: Debian "bookworm-slim" (glibc) — NOT Alpine (musl).
#   argon2 and the Prisma query engine are native binaries; the glibc base
#   avoids the OpenSSL / musl engine issues that Alpine introduces.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: builder — install ALL deps, generate Prisma client, compile TS.
# Build toolchain (python3/make/g++) lives ONLY here and is discarded.
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# openssl is required by the Prisma engine; the rest are for native module builds.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies against the committed lockfile for reproducible builds.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Generate the Prisma client (engine matched to this Debian base) and build.
COPY . .
RUN npx prisma generate \
    && npm run build

# -----------------------------------------------------------------------------
# Stage 2: runner — lean runtime image, no build toolchain, non-root user.
# node_modules is carried over from the builder so the compiled argon2 binary,
# the generated Prisma client/engine, and the Prisma CLI (for `migrate deploy`)
# are all present and ABI-compatible with this identical base image.
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Run as the unprivileged "node" user that ships with the base image.
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Liveness check: the server is considered healthy as long as it answers HTTP
# (a 404 on "/" still proves the process is up). Uses Node — no curl needed.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

# Applies pending migrations, then starts the compiled app.
ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
