FROM node:18-alpine

# Install Python 3 and FFmpeg
RUN apk add --no-cache python3 ffmpeg

# Install Redis
RUN apk add --no-cache redis

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy the rest of the application files
COPY . .

# tricky lil one, was causing EACCES error                                                                                  
RUN /bin/sh -c 'chmod +x bin/youtube-dl'

# Expose the port
EXPOSE 3001

# Start Redis and the Node.js application
CMD ["sh", "-c", "redis-server & npm run dev"]