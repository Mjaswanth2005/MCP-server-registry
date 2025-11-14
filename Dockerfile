# Use Apify's Node.js base image
FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . ./

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Run the compiled actor
CMD node dist/main.js
