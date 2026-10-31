#!/bin/sh

# Ensure persistent directories exist on the mounted disk (Render persistent disk)
mkdir -p /data/database
mkdir -p /data/video
mkdir -p /data/images
mkdir -p /data/audio
mkdir -p /data/gameplay

# Sync built-in gameplay videos, scene images, and audio across both storage locations
if [ -d "/app/public/gameplay" ]; then
  cp -rn /app/public/gameplay/* /data/gameplay/ 2>/dev/null || true
fi
if [ -d "/data/gameplay" ]; then
  cp -rn /data/gameplay/* /app/public/gameplay/ 2>/dev/null || true
fi

if [ -d "/app/public/images" ]; then
  cp -rn /app/public/images/* /data/images/ 2>/dev/null || true
fi
if [ -d "/data/images" ]; then
  cp -rn /data/images/* /app/public/images/ 2>/dev/null || true
fi

if [ -d "/app/public/audio" ]; then
  cp -rn /app/public/audio/* /data/audio/ 2>/dev/null || true
fi
if [ -d "/data/audio" ]; then
  cp -rn /data/audio/* /app/public/audio/ 2>/dev/null || true
fi

# Ensure /app/public/video directory exists
mkdir -p /app/public/video
if [ -d "/data/video" ]; then
  cp -rn /data/video/* /app/public/video/ 2>/dev/null || true
fi

# Default NEXTAUTH_URL if not set
if [ -z "$NEXTAUTH_URL" ]; then
  export NEXTAUTH_URL="https://moviedecodedai.onrender.com"
fi

# Run database migrations using the DB on the persistent disk
export DATABASE_URL="${DATABASE_URL:-file:/data/database/prod.db}"
npx prisma db push

# Refresh font cache for FFmpeg libass subtitle burning
fc-cache -f 2>/dev/null || true

# Ensure critical default settings exist in the database and grant starter credits
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function init() {
  await prisma.setting.upsert({ where: { key: 'DAILY_VIDEO_LIMIT' }, update: { value: '50' }, create: { key: 'DAILY_VIDEO_LIMIT', value: '50' } });
  await prisma.setting.upsert({ where: { key: 'PROVIDER_MODE' }, update: {}, create: { key: 'PROVIDER_MODE', value: 'production' } });
  await prisma.setting.upsert({ where: { key: 'AUTO_PUBLISH' }, update: {}, create: { key: 'AUTO_PUBLISH', value: 'true' } });
  const creditRes = await prisma.user.updateMany({ where: { credits: { lt: 5 } }, data: { credits: 10 } });
  if (creditRes.count > 0) console.log('==> Granted starter credits to', creditRes.count, 'users');

  // Seed YouTube channel OAuth credentials if configured via env
  const ytRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (ytRefreshToken) {
    const existingYt = await prisma.oAuthCredential.findFirst({ where: { provider: 'youtube' } });
    if (!existingYt) {
      const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
      await prisma.oAuthCredential.create({
        data: {
          userId: user ? user.id : null,
          provider: 'youtube',
          accessToken: 'initial',
          refreshToken: ytRefreshToken,
          scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube.readonly',
          accountInfo: JSON.stringify({ name: 'Channel Owner' })
        }
      });
      console.log('==> Seeded YouTube channel connection from YOUTUBE_REFRESH_TOKEN');
    }
  }
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

# 24/7 Keep-Alive pinger (keeps cloud container awake even when user laptop is shut)
(
  sleep 30
  while true; do
    curl -s "http://127.0.0.1:${PORT:-3000}/health" > /dev/null 2>&1 || true
    sleep 600
  done
) &

# Start the Next.js production server binding to 0.0.0.0 on Render's assigned $PORT
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"
echo "==> Starting Next.js server on 0.0.0.0:${PORT}..."
exec npx next start -H 0.0.0.0 -p "${PORT}"
