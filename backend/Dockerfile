# ==============================================================================
# FiYDoc Backend — Production Multi-Stage Container Image (Node 22 + Alpine)
# ==============================================================================

# Stage 1: Build & Compilation
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL and libc compatibility libraries required by Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

# Use pnpm with pre/post scripts allowed
RUN npm install -g pnpm@9
RUN pnpm config set enable-pre-post-scripts true

# Copy package manifests and Prisma schema
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies (with build scripts allowed)
RUN pnpm install --no-frozen-lockfile

# Copy application source code
COPY . .

# Generate Prisma Client & compile NestJS application
RUN npx prisma generate
RUN pnpm run build
RUN node -e "const fs=require('fs'); if (!fs.existsSync('./dist/main.js') && fs.existsSync('./dist/src/main.js')) { fs.writeFileSync('./dist/main.js', 'require(\"./src/main.js\");\n'); }"

# Stage 2: Production Execution Image
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL, libc6-compat, and wget for health checks
RUN apk add --no-cache openssl libc6-compat wget

ENV NODE_ENV=production
ENV PORT=3000

# Copy built distribution files, node_modules, and prisma schema from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Container Healthcheck (Monitored by Cloud Platforms)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; elif [ -f dist/src/main.js ]; then node dist/src/main.js; else node -e 'require(\"./dist/src/main.js\")'; fi"]
