const express = require('express');
const router = express.Router();

const controller = require('./controller');
const channelController = require('./channelController');

router.get('/', controller.getWelcomeMessage);
/**
 * @swagger
 * /sync:
 *   get:
 *     summary: Download a YouTube video and upload it to a decentralized storage provider using Server-Sent Events
 *     tags: [Sync]
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: The URL of the YouTube video to download. E.g. try this out https://www.youtube.com/watch?v=EngW7tLk6R8
 *     responses:
 *       200:
 *         description: The video has been downloaded and uploaded to the storage provider using Server-Sent Events
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: 'data: {"eventType":"info","event":{"title":"Sample Videos / Dummy Videos For Demo Use","duration":5,"url":"https://www.youtube.com/watch?v=EngW7tLk6R8","filename":"Sample Videos _ Dummy Videos For Demo Use-EngW7tLk6R8.mp4"}} data: {"eventType":"download","event":" Sample Videos _ Dummy Videos For Demo Use-EngW7tLk6R8.mp4 has already been downloaded and merged"} data: {"eventType":"size","event":"981 KB"}'
 *       500:
 *         description: An error occurred during the download or upload process
 */
router.get('/sync', controller.downloadUpload);

/**
 * @swagger
 * /list:
 *   get:
 *     summary: List all the uploaded videos
 *     tags: [ListUploads]
 *     responses:
 *       200:
 *         description: A list of uploaded videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the uploaded video
 *                   cid:
 *                     type: string
 *                     description: The content identifier (CID) of the uploaded video
 *                   size:
 *                     type: string
 *                     description: The size of the uploaded video
 *                   url:
 *                     type: string
 *                     description: The URL to access the uploaded video
 */

/**
 * @swagger
 *
 * /list:
 *   get:
 *     summary: List uploads with pagination.
 *     parameters:
 *       - name: page
 *         in: query
 *         description: The page number to return (defaults to 1).
 *         required: false
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         description: The number of items per page (defaults to 10).
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A paginated list of uploads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Upload'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       '500':
 *         description: Internal server error.
 *
 */
router.get('/list', controller.listUploads);

/**
 * @swagger
 * /syncChannel:
 *   get:
 *     summary: Downloads a YouTube channel and syncs it to Web3.
 *     description: Initiates a job to download and process videos from the specified channel URL and uploads to web3.
 *     tags: [Sync]
 *     parameters:
 *       - name: url
 *         in: query
 *         required: true
 *         description: The URL of the YouTube channel to sync
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         description: The maximum number of videos to sync from the channel (optional)
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Successfully synced channel to Web3
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   description: The ID of the job that was added to the queue
 *       500:
 *         description: URL is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message
 */
router.get('/syncChannel', channelController.syncChannel);

router.get('/syncChannelJob/:id/status', channelController.getChannelSyncJobStatus);

/**
 * @swagger
 * /syncChannel/{id}/status:
 *   get:
 *     summary: Real-time updates on channel processing status.
 *     description: Returns a stream of Server-Sent Events (SSE) with real-time updates on the status of a channel being processed.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the channel sync job to retrieve status for.
 *     produces:
 *       - text/event-stream
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/syncChannel/:id/status', channelController.getChannelStatusSSE);

router.get('/deleteCids', channelController.deleteCids);

router.get('/phone/:number', channelController.callRingCentral);

module.exports = router;
