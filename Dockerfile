# Use Apify's Node.js base image
FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install ALL dependencies including devDependencies (override NODE_ENV)
RUN npm install --include=dev

# Copy source code
COPY . ./

# Build TypeScript
RUN npx typescript

# Remove devDependencies to reduce image size
RUN npm prune --production

# Run the compiled actor
CMD node dist/main.js
