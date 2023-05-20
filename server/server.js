const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;
require('dotenv').config();
const routes = require('./routes');
const swagger = require('./swagger');

require('./channel/channelVideoListWorker');
require('./channel/videoDownloadWorker');
require('./channel/videoUploadWorker');

const allowedOrigins = ['https://beefree-dev.vercel.app', 'http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);

app.use(express.json());
app.use('/', routes);
app.use('/api-docs', swagger);

app.listen(port, () => {
  console.log('\nWelcome to Beefree API. Endpoints to download youtube videos and upload to decentralized storage.');
  console.log(`Server listening on port ${port}\n`);
  console.log('To see the API documentation, go to http://localhost:3001/api-docs/');
  console.log('Sample url to test download and upload: http://localhost:3001/sync?url=https://www.youtube.com/watch?v=EngW7tLk6R8');
  console.log('Sample url to test channel sync: http://localhost:3001/syncChannel?url=https://www.youtube.com/businessofcinemas&limit=2\n');
});
