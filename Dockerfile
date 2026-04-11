# Use official Node.js Alpine image for a lightweight build
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json of the server first for caching layers
COPY server/package*.json ./server/

# Install server dependencies securely
RUN cd server && npm install

# Copy the rest of the server code
COPY server ./server

# Build the TypeScript code
RUN cd server && npm run build

# Hugging Face Spaces require applications to listen on port 7860
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

# Start the server using the compiled JavaScript file
CMD ["npm", "start", "--prefix", "server"]
