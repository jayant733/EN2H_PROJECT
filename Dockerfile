# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Clean install all dependencies
RUN npm ci

COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production runtime environment
FROM node:22-alpine AS production

# Set production node environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies (excluding devDependencies)
RUN npm ci --only=production

# Copy compiled files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Adjust file ownership to the non-privileged node user
RUN chown -R node:node /usr/src/app

# Run as non-privileged node user
USER node

EXPOSE 3000

# Container healthcheck configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start production server
CMD ["node", "dist/main.js"]
