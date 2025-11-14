# Use Apify's Node.js base image
FROM apify/actor-node:20

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . ./

# Build TypeScript
RUN npm run build

# Run the actor
CMD npm start
