# Backend Dockerfile — production Node.js image
# Installs only production dependencies (no devDependencies)

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install deps first (cached layer unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Run as non-root for security
USER node

EXPOSE 5004

CMD ["node", "src/index.js"]
