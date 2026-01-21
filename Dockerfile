# Production Dockerfile for Node.js REST API
# Multi-stage build for smaller image size

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Remove dev/test files
RUN rm -rf tests/ nodemon.json .git/

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Switch to non-root user
USER nodejs

# Start the application
CMD ["node", "server.js"]
