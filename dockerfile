# Dockerfile
FROM node:20

WORKDIR /app

# Copy package.json và cài dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ code
COPY . .

# Expose port 3000
EXPOSE 3000

# Command chạy backend
CMD ["npm", "run", "dev"]  # hoặc "node src/server.js" tùy project
