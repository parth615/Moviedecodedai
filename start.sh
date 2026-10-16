#!/bin/sh

# Ensure persistent directories exist on the mounted disk (Render persistent disk)
mkdir -p /data/database
mkdir -p /data/video
mkdir -p /data/images
mkdir -p /data/audio
mkdir -p /data/gameplay

# Copy built-in gameplay videos and scene images to persistent storage if not already there
if [ -d "/app/public/gameplay" ]; then
  cp -rn /app/public/gameplay/* /data/gameplay/ 2>/dev/null || true
fi

if [ -d "/app/public/images" ]; then
  cp -rn /app/public/images/* /data/images/ 2>/dev/null || true
fi

if [ -d "/app/public/audio" ]; then
  cp -rn /app/public/audio/* /data/audio/ 2>/dev/null || true
fi

# Symlink persistent storage into Next.js public directory so media can be served
rm -rf /app/public/video
ln -s /data/video /app/public/video

rm -rf /app/public/images
ln -s /data/images /app/public/images

rm -rf /app/public/audio
ln -s /data/audio /app/public/audio

rm -rf /app/public/gameplay
ln -s /data/gameplay /app/public/gameplay

# Default NEXTAUTH_URL if not set
if [ -z "$NEXTAUTH_URL" ]; then
  export NEXTAUTH_URL="https://moviedecodedai.onrender.com"
fi

# Run database migrations using the DB on the persistent disk
export DATABASE_URL="${DATABASE_URL:-file:/data/database/prod.db}"
npx prisma db push

# Ensure critical default settings exist in the database
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function init() {
  await prisma.setting.upsert({ where: { key: 'DAILY_VIDEO_LIMIT' }, update: { value: '50' }, create: { key: 'DAILY_VIDEO_LIMIT', value: '50' } });
  await prisma.setting.upsert({ where: { key: 'PROVIDER_MODE' }, update: {}, create: { key: 'PROVIDER_MODE', value: 'production' } });
  await prisma.\$disconnect();
}
init().catch(console.error);
"

# Start the background worker with an auto-restart supervisor loop
(
  while true; do
    echo "==> [WORKER] Starting universal pipeline worker..."
    npm run worker
    echo "==> [WORKER] Worker exited ($?). Auto-restarting in 3s..."
    sleep 3
  done
) &

# Start the Next.js production server binding to 0.0.0.0 on Render's assigned $PORT
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"
echo "==> Starting Next.js server on 0.0.0.0:${PORT}..."
exec npx next start -H 0.0.0.0 -p "${PORT}"
