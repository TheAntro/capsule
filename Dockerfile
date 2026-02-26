# Stage 1: Dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
# Install including devDeps for the build
RUN npm ci

# Stage 2: Builder
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client for the architectures defined in schema.prisma
RUN npx prisma generate
RUN npm run build
# Remove devDependencies to keep the runner light
RUN npm prune --omit=dev

# Stage 3: Runner
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV production

# Prisma & SQLite need openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create directory for SQLite volume
RUN mkdir -p /app/data

# 1. Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

ARG TARGETARCH
RUN mkdir -p .next/lib/binding/node-v127-linux-${TARGETARCH}
COPY --from=builder /app/node_modules/better-sqlite3/build/Release/better_sqlite3.node ./.next/lib/binding/node-v127-linux-${TARGETARCH}/better_sqlite3.node

# 3. Copy the rest of pruned node_modules for Prisma CLI
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Run migrations then start server
CMD ./node_modules/.bin/prisma migrate deploy && node server.js