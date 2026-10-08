# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install curl / wget for healthcheck
RUN apk add --no-cache wget

# Create app directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source
COPY src/ ./src/

# Use unprivileged user for security
USER node

# Expose API port
EXPOSE 3000

# Docker Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
