FROM node:22-bookworm-slim

# Install OpenSSL (for Prisma), FFmpeg, and Python (needed by youtube-dl-exec)
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ffmpeg ca-certificates python3 python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Skip python check if youtube-dl binary is bundled
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Make start script executable
RUN chmod +x start.sh

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["./start.sh"]
