const { Queue } = require('bullmq');
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
const Redis = require('ioredis');
const connection = new Redis(process.env.REDIS_URL);
const { msToHumanReadable } = require('../utils');
const axios = require('axios');

const channelDownloadQueue = new Queue('channel downloads', { connection });
const channelStatusMap = new Map();

const callRingCentral = async (req, res) => {
  const { number } = req.params;
  res.redirect(`rcapp://r/dialer?number=${number}`);
};

const deleteCids = async (req, res) => {
  res.end('ok');
  // Define the API endpoint and authorization header
  const endpoint = 'https://api.web3.storage/user/uploads/';
  const authHeader = '';
  const uploadList = {
    uploadList: [{ cid: 'bafybeifnni753mqst73fdcmevsajlhssup4tv6etdlhp42vmuifzhu5fxi' }],
  };

  //for loop to iterate through the list of cids and delete them
  for (let i = 0; i < uploadList.uploadList.length; i++) {
    const cid = uploadList.uploadList[i].cid;
    const url = endpoint + cid;
    await delay(1000);
    try {
      const response = await axios.delete(url, { headers: { Authorization: authHeader } });
      console.log(`Deleted CID ${cid} with status ${response.status}`);
    } catch (error) {
      console.error(`Failed to delete CID ${cid} with error ${error.message}`);
    }
  }
};

const addChannelStatus = (jobId, url) => {
  const channelStatus = {
    url,
    jobId,
    totalVideos: 0,
    totalVideosLimit: 0,
    videosDownloaded: 0,
    videosUploaded: 0,
    totalPrettySizeUploaded: null,
    jobTimeTaken: null,
    videosDownloadFailed: 0,
    videosUploadFailed: 0,
    totalSizeUploaded: 0,
    status: 'Channel sync job created',
    jobStartDate: new Date(),
    jobEndDate: null,
    isVideoListGenerated: false,
    videoListGeneratedTimeTaken: null,
    videosDownloadStartDate: null,
    videosDownloadFailed: 0,
    videosDownloadEndDate: null,
    areVideosDownloadComplete: false,
    videosDownloadTimeTaken: 0,
    videoDlSpeed: 0.0,
    videoUploadSpeed: 0.0,
    downloadComplete: [],
    uploadComplete: [],
    downloadFailures: [],
    uploadFailures: [],
    error: null,
  };
  channelStatusMap.set(jobId, channelStatus);
};

const syncChannel = async (req, res) => {
  const url = req.query.url;
  const limit = req.query.limit;
  if (!url) {
    return res.status(500).send(JSON.stringify({ error: 'URL is required' }));
  }
  res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');

  console.log('Sync Channel processing : ' + url);
  // Add job to queue
  const job = await channelDownloadQueue.add('channel', { channelUrl: url, limit: limit }, { attempts: 3 });
  // Add channel status to cache
  addChannelStatus(job.id, url);
  res.status(201).send({ jobId: job.id });
};

const getChannelSyncJobStatus = async (req, res) => {
  const { id } = req.params;
  const job = await channelDownloadQueue.getJob(id);

  if (!job) {
    return res.status(404).send({ error: 'Job not found' });
  }

  res.send({
    jobId: job.id,
    status: job.state,
    progress: job.progress,
    data: job.data,
    returnValue: job.returnvalue,
    failedReason: job.failedReason,
  });
};

const getChannelStatusSSE = async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked',
    'Content-Encoding': 'none',
    'Access-Control-Allow-Origin': req.get('origin') || '*',
  });

  const { id } = req.params;
  const channelStatus = getChannelStatus(id);
  if (!channelStatus) {
    res.status(404).end("Channel sync job doesn't exist");
    return;
  }
  res.write(`data: ${JSON.stringify(channelStatus)}\n\n`);

  // Listen for status updates and send to client via SSE
  const listener = (channelStatus) => {
    res.write(`data: ${JSON.stringify(channelStatus)}\n\n`);
  };
  eventEmitter.on('status-update', listener);

  // Remove listener when client closes connection
  res.on('close', () => {
    eventEmitter.off('status-update', listener);
  });
};

// Get channel status from cache
const getChannelStatus = (jobId) => {
  return channelStatusMap.get(jobId);
};

const updateChannelSyncStatus = (channelUrl, updates) => {
  const channelStatus = getChannelStatus(channelUrl);
  if (!channelStatus) {
    throw new Error(`Channel ${channelUrl} not found in status map`);
  }
  const updatedStatus = { ...channelStatus, ...updates };
  // console.log('updateChannelSyncStatus', updatedStatus);
  if (updatedStatus.totalVideos > 0 && updatedStatus.totalVideos === updatedStatus.videosDownloaded) {
    updatedStatus.areVideosDownloadComplete = true;

    updatedStatus.videosDownloadEndDate = new Date();
  }
  updatedStatus.jobTimeTaken = msToHumanReadable(new Date() - updatedStatus.jobStartDate);
  channelStatusMap.set(channelUrl, updatedStatus);
  eventEmitter.emit('status-update', updatedStatus);
};

module.exports = { syncChannel, getChannelStatus, getChannelSyncJobStatus, updateChannelSyncStatus, getChannelStatusSSE, deleteCids, callRingCentral };
