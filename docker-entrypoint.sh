#!/bin/sh
# Entrypoint for the production container.
# Applies any pending database migrations, then launches the compiled server.
set -e

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Starting application..."
exec node dist/main.js
