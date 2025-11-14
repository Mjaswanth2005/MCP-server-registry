# Use Apify's Node.js base image
FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install ALL dependencies including devDependencies
RUN npm install

# Copy source code
COPY . ./

# Build TypeScript using npx to ensure tsc is found
RUN npx tsc

# Remove devDependencies to reduce image size
RUN npm prune --production

# Run the compiled actor
CMD node dist/main.js
