# Beefree API

Beefree API is a Node.js-based API that allows you to download YouTube videos and upload them to decentralized storage providers.

## Features

- Download YouTube videos using `youtube-dl`
- Upload videos to decentralized storage using Web3.Storage
- Extensible storage provider abstraction for easy integration of other storage solutions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)

### Installation

1. Install the required dependencies:

```bash
npm install
```

2. Set environment variables:

Update .env file in the project root directory and set the following environment variables:

```
WEB3STORAGE_TOKEN=your_token_here
```

Replace `your_token_here` with your actual Web3.Storage API token. To obtain a token, sign up for a free account at Web3.Storage and create an API token from your account settings.

### Usage

1. Start the server:

```bash
npm start
```

2. Send a GET request to the server with the following parameters:

```
{
    "url": "http://localhost:3001/sync?url=youtube_url_here"
}
```

Replace `youtube_url_here` with the URL of the YouTube video you want to download and upload to Web3.Storage.

3. To add a new storage provider, extend the `StorageProvider` class in the `storage` directory and implement the required methods. Update the `youtube/index.js` file to use the new storage provider.

### Build and run with Docker

1. Build the image:

```bash
docker build -t bf .
```

2. Get the container up and running:

```bash
docker run -d --name bf -p 3001:3001 -e NODE_ENV=production bf
```

3. Confirm if it is running:

```bash
docker ps
```

View logs:

```bash
docker logs -f bf
```

View exited containers

```bash
docker ps -a
```

Remove exited containers

```bash
docker container prune
```

Stop the container

```bash
docker stop bf
```

Access shell inside the container

```bash
docker exec -it bf sh
```

## Deploy

docker stop bf
docker container prune
docker build -t bf .
docker run -d --name bf -p 3001:3001 -e NODE_ENV=production bf

ssh root@137.184.219.147

ssh bob@137.184.219.147

ssh alice@137.184.219.147
