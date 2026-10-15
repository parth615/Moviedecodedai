FROM node:20-bullseye-slim

# Install OpenSSL (needed for Prisma) and FFmpeg
RUN apt-get update && apt-get install -y openssl ffmpeg && rm -rf /var/lib/apt/lists/*

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
