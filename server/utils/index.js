const { getFilesFromPath } = require('web3.storage');
const { updateUploadListWithMetadata } = require('../redis');

const formatPayload = (eventType, event) => {
  return 'data: ' + JSON.stringify({ eventType, event }) + '\n\n';
};

const errorPayload = (error) => {
  return formatPayload('error', error);
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const bytesToSize = (bytes) => {
  try {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${Math.round(bytes / Math.pow(1024, i), 2)} ${sizes[i]}`;
  } catch (error) {
    throw error;
  }
};

const updateUploadList = async (cid, videoMetadata, url) => {
  videoMetadata.cid = cid;
  videoMetadata.yturl = videoMetadata.url;
  videoMetadata.url = url;
  console.log('Video metadata', videoMetadata);
  await updateUploadListWithMetadata('uploadList', videoMetadata);
};

const getVideoFile = async (path) => {
  try {
    return await getFilesFromPath(path);
  } catch (error) {
    throw error;
  }
};

const msToHumanReadable = (durationInMs) => {
  const milliseconds = durationInMs % 1000;
  const seconds = Math.floor(durationInMs / 1000) % 60;
  const minutes = Math.floor(durationInMs / (1000 * 60)) % 60;
  const hours = Math.floor(durationInMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(durationInMs / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`);
  }
  if (milliseconds > 0) {
    parts.push(`${milliseconds}ms`);
  }

  return parts.join(' ');
};

module.exports = { bytesToSize, formatPayload, errorPayload, getVideoFile, msToHumanReadable, delay, updateUploadList };
