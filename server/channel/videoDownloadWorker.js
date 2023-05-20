const { Worker, Queue } = require('bullmq');
const { updateChannelSyncStatus, getChannelStatus } = require('../routes/channelController');
const youtube = require('../youtube');
const { msToHumanReadable } = require('../utils');
const Redis = require('ioredis');
const connection = new Redis(process.env.REDIS_URL);

// Add each video URL as a job to the videoDownloadQueue
const videoUploadQueue = new Queue('video uploads', { connection });

const downloadVideoFromYoutube = async (url, job) => {
  console.log('Get video metadata');
  const videoMetadata = await youtube.getVideoMetadata(url);
  return [videoMetadata, await youtube.downloadVideoJob(videoMetadata.id + '.mp4', url, job)];
};

const videoDownloadQueue = new Worker(
  'video downloads',
  async (job) => {
    const { url } = job.data;
    const startTime = new Date();
    const [videoMetadata, filename] = await downloadVideoFromYoutube(url, job);
    const endTime = new Date();
    const timeTaken = endTime - startTime;

    return { url, timeTaken, filename, videoMetadata };
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

videoDownloadQueue.on('completed', (job, result) => {
  const channelStatus = getChannelStatus(job.data.parentJobId);

  // TODO edge case, if video failed on first attempt, then succeeded on second attempt, then it will be counted as a failure, update logic to check if video is in downloadFailures array, if so, remove it from that array and reduce videosFailed by 1
  updateChannelSyncStatus(job.data.parentJobId, {
    videosDownloaded: channelStatus.videosDownloaded + 1,
    // downloadComplete: [...channelStatus.downloadComplete, { url: job.data.url, jobId: job.id, timeTaken: result.timeTaken, fileSize: prettyFileSize }],
    downloadComplete: [...channelStatus.downloadComplete, { url: job.data.url, jobId: job.id, timeTaken: result.timeTaken, filename: result.filename }],
  });
  console.log(`Video download job ${job.id} completed: ${result.url} :` + channelStatus.videosDownloaded + 1);

  videoUploadQueue.add('video to upload', { filename: result.filename, parentJobId: job.data.parentJobId, videoMetadata: result.videoMetadata }, { attempts: 3 });
});

videoDownloadQueue.on('failed', (job, err) => {
  const channelStatus = getChannelStatus(job.data.parentJobId);
  if (job.attemptsMade > 1) {
    updateChannelSyncStatus(job.data.parentJobId, { downloadFailures: [...channelStatus.downloadFailures, { url: job.data.url, jobId: job.id, error: err.message, retry: job.attemptsMade }] });
  } else {
    updateChannelSyncStatus(job.data.parentJobId, { videosDownloadFailed: channelStatus.videosDownloadFailed + 1, downloadFailures: [...channelStatus.downloadFailures, { url: job.data.url, jobId: job.id, error: err.message }] });
  }
  console.log(`Video download job ${job.id} failed: ${err.message}`);
});

videoDownloadQueue.on('progress', (job, data) => {
  console.log(`Video download job ${job.id} progress: ${data.eventType} ${data.event} `);
});

// https://blog.taskforce.sh/do-not-wait-for-your-jobs-to-complete/

// export default async function (job: Job) {
//   await job.log("Start processing job");

//   for(let i=0; i < 100; i++) {
//      await processChunk(i);
//      await job.progress({ percentage: i, userId: job.data.userId });
//   }
// }

// const queueEvents = new QueueEvents("my-queue", { connection });

// queueEvents.on("progress", async ({ jobId, data }) => {
//   const { userId } = data;

//   // Notify userId about the progress
//   await notifyUser(userId, data);
// });
