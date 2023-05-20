const { Worker } = require('bullmq');
const { updateChannelSyncStatus, getChannelStatus } = require('../routes/channelController');
const Redis = require('ioredis');
const connection = new Redis(process.env.REDIS_URL);
const WEB3STORAGE_TOKEN = process.env.WEB3STORAGE_TOKEN;
const { Web3StorageProvider } = require('../storage');
const { getVideoFile, bytesToSize, updateUploadList } = require('../utils');
const fs = require('fs');

let storageProvider = new Web3StorageProvider(WEB3STORAGE_TOKEN);

const uploadVideoToWeb3 = async (file, filename, job, videoMetadata) => {
  try {
    let cid = await storageProvider.storeJob(file, job);
    const videoUrl = storageProvider.getResourceUrl();
    updateUploadList(cid, videoMetadata, videoUrl);

    fs.unlink(filename, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return videoUrl;
  } catch (error) {
    throw error;
  }
};

const videoUploadQueue = new Worker(
  'video uploads',
  async (job) => {
    const { filename, videoMetadata } = job.data;
    const startTime = new Date();
    const file = await getVideoFile(filename);
    const fileSize = file[0].size;
    const prettyFileSize = bytesToSize(fileSize);
    const videoUrl = await uploadVideoToWeb3(file, filename, job, videoMetadata);
    const endTime = new Date();
    const timeTaken = endTime - startTime;

    return { timeTaken, videoUrl, filename, prettyFileSize, fileSize };
  },
  {
    limiter: {
      max: 10,
      duration: 1000,
    },
    connection,
    concurrency: 3,
  }
);

videoUploadQueue.on('completed', (job, result) => {
  const channelStatus = getChannelStatus(job.data.parentJobId);
  const totalSizeUploaded = channelStatus.totalSizeUploaded + result.fileSize;
  const totalPrettySizeUploaded = bytesToSize(totalSizeUploaded);

  // TODO edge case, if video failed on first attempt, then succeeded on second attempt, then it will be counted as a failure, update logic to check if video is in downloadFailures array, if so, remove it from that array and reduce videosFailed by 1
  updateChannelSyncStatus(job.data.parentJobId, {
    videosUploaded: channelStatus.videosUploaded + 1,
    totalSizeUploaded,
    totalPrettySizeUploaded,
    uploadComplete: [...channelStatus.uploadComplete, { jobId: job.id, timeTaken: result.timeTaken, videoUrl: result.videoUrl, prettyFileSize: bytesToSize(result.fileSize), filename: job.data.filename }],
  });
  console.log(`Video upload job ${job.id} completed: ${result.videoUrl}`);
});

videoUploadQueue.on('failed', (job, err) => {
  const channelStatus = getChannelStatus(job.data.parentJobId);
  if (job.attemptsMade > 1) {
    updateChannelSyncStatus(job.data.parentJobId, { uploadFailures: [...channelStatus.downloadFailures, { jobId: job.id, error: err.message, filename: job.data.filename, retry: job.attemptsMade }] });
  } else {
    updateChannelSyncStatus(job.data.parentJobId, { videosUploadFailed: channelStatus.videosUploadFailed + 1, uploadFailures: [...channelStatus.uploadFailures, { jobId: job.id, error: err.message, filename: job.data.filename }] });
  }
  console.log(`Video upload job ${job.id} failed: ${err.message}`);
});

videoUploadQueue.on('progress', (job, data) => {
  console.log(`Video upload job ${job.id} progress: ${data.eventType} ${data.event} `);
});
