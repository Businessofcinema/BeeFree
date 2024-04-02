#!/bin/bash

# Stop the "bf" Docker container if it's running
docker stop bf

# Remove all stopped Docker containers
docker container prune

# Build a Docker image with the tag "bf"
docker build -t bf .

# Start a new Docker container named "bf" in detached mode (-d), mapping port 3001 to the container's port 3001 (-p 3001:3001), and setting the NODE_ENV environment variable to "production"
docker run -d --name bf -p 3001:3001 -e NODE_ENV=production bf