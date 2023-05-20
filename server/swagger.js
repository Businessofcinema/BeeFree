const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const express = require('express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Beefree API',
      version: '1.0.0',
      description: 'API to download YouTube videos and upload them to decentralized storage providers',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local server',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

const swagger = express.Router();
swagger.use('/', swaggerUi.serve);
swagger.get('/', swaggerUi.setup(specs));

module.exports = swagger;
