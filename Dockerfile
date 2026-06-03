# 1. Build and install dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies required for compiling native modules (like python3, make, g++)
RUN apk add --upgrade --no-cache python3 make g++

# Copy package files separately to utilize the Docker build cache
COPY ["package.json", "package-lock.json", "./"]

# Install dependencies strictly defined in the package-lock.json
RUN npm ci --omit=dev

# 2. Final lightweight runtime image
FROM node:18-alpine

ENV NODE_ENV=production

LABEL maintainer="zaka13X" \
      summary="waterproxy" \
      description="Made with MercuryWorkshop's Scramjet + Wisp for transport."

WORKDIR /app

# Copy only the node_modules and built assets from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8080

ENTRYPOINT [ "node" ]
CMD ["src/index.js"]
