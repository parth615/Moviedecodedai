#!/bin/sh

# Ensure persistent directories exist on the mounted disk (Render persistent disk)
mkdir -p /data/database
mkdir -p /data/video
mkdir -p /data/images
mkdir -p /data/audio
mkdir -p /data/gameplay

# Copy built-in gameplay videos to persistent storage if not already there
if [ -d "/app/public/gameplay" ]; then
  cp -rn /app/public/gameplay/* /data/gameplay/ 2>/dev/null || true
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

# Run database migrations using the DB on the persistent disk
export DATABASE_URL="file:/data/database/prod.db"
npx prisma db push

# Start the background worker in the background
npm run worker &

# Start the Next.js production server in the foreground
npm start
