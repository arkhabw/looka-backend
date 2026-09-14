FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production and dev dependencies
RUN npm install

# Copy application source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5001

# Run backend application
CMD ["npm", "start"]