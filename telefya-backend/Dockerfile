# FROM node:22-alpine

# WORKDIR /app

# COPY package*.json ./
# RUN npm install -g pm2 && npm install

# COPY . .

# EXPOSE ${PORT}

# #CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
# CMD ["pm2 start server.js --name backend --watch -i 4", "--env", "production"]

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install build dependencies for mediasoup
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && npm rebuild

# Remove build dependencies to keep image small
RUN apk del python3 make g++

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S bww
RUN adduser -S bww -u 1001
RUN chown -R bww:bww /app
USER bww

# Security hardening remove write permissions for group and all permissions for others
RUN chmod -R g-w,o-rwx /app

EXPOSE 5000 3443 40000-49999


CMD ["node", "index.js"]