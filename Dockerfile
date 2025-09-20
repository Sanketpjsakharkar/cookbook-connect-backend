# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm globally and netcat for health checks
RUN npm install -g pnpm && apk add --no-cache netcat-openbsd

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema first (for generation)
COPY prisma ./prisma

# Generate Prisma client
RUN pnpm prisma generate

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command for development (with hot reload)
CMD ["pnpm", "start:dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command for production
CMD ["pnpm", "start:prod"]
