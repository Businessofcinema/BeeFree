const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const youtube = require('../youtube');
const { updateChannelSyncStatus } = require('../routes/channelController');

const connection = new Redis(process.env.REDIS_URL);

const channelDownloadQueue = new Worker(
  'channel downloads',
  async (job) => {
    // Update channel status in cache
    const { channelUrl, limit } = job.data;
    const vidGenStartDate = new Date();
    updateChannelSyncStatus(job.id, { status: 'Video list generation started' });
    const videoUrls = await getVideosFromChannelOrPlaylist(channelUrl);
    const vidGenEndDate = new Date();
    updateChannelSyncStatus(job.id, {
      status: 'Adding videos to download queue',
      isVideoListGenerated: true,
      totalVideos: videoUrls.length,
      videoListGeneratedTimeTaken: vidGenEndDate - vidGenStartDate,
      totalTimeTaken: vidGenEndDate - vidGenStartDate,
    });

    console.log('Total videos', videoUrls.length);

    // Add each video URL as a job to the videoDownloadQueue
    const videoDownloadQueue = new Queue('video downloads', { connection });

    // videoDownloadQueue.add('video to download', { url: 'https://www.youtube.com/watch?v=EngW7tLk6R8', parentJobId: job.id }, { attempts: 3 });

    for (const video of videoUrls.slice(0, limit)) {
      videoDownloadQueue.add('video to download', { url: video.url, parentJobId: job.id }, { attempts: 3 });
    }

    updateChannelSyncStatus(job.id, { status: 'Processing videos', totalVideosLimit: limit ? limit : -1, videosDownloadStartDate: new Date() });

    return { totalVideos: videoUrls.length };
  },
  { connection, concurrency: 1 }
);

const getVideosFromChannelOrPlaylist = async (channelUrl) => {
  console.log('[Channel Video List Worker] Getting video list for: ' + channelUrl);
  return await youtube.getVideosFromChannelOrPlaylist(channelUrl);
};

channelDownloadQueue.on('completed', (job, result) => {
  console.log(`Channel video list generation job ${job.id} completed: ${result.totalVideos} videos processed`);
});

channelDownloadQueue.on('failed', (job, err) => {
  updateChannelSyncStatus(job.id, { status: 'Channel video list generation failed', error: err.message });
  console.log(`Channel video list generation job ${job.id} failed: ${err.message}`);
});
