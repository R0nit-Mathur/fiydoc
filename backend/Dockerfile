# ==============================================================================
# FiYDoc Backend — Production Multi-Stage Container Image
# ==============================================================================

# Stage 1: Build & Compilation
FROM node:20-alpine AS builder

WORKDIR /app

# Enable modern package management
RUN npm install -g pnpm

# Copy package descriptors and prisma schema
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install || npm install

# Copy application source code
COPY . .

# Generate Prisma Client & compile NestJS application
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Execution Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production package manager
RUN npm install -g pnpm

# Copy package manifests and prisma schema
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY prisma ./prisma/

# Install only production dependencies
RUN pnpm install --prod --ignore-scripts || npm install --omit=dev --ignore-scripts
RUN npx prisma generate

# Copy built distribution files from builder stage
COPY --from=builder /app/dist ./dist

# Copy .env.production as fallback configuration if not injected via cloud env
COPY .env.production ./.env.production

EXPOSE 3000

# Container Healthcheck (Monitored by Cloud Platforms)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
