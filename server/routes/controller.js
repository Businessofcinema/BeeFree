const youtube = require('../youtube');
const { formatPayload, errorPayload, updateUploadList } = require('../utils');
const axios = require('axios');

const WEB3STORAGE_TOKEN = process.env.WEB3STORAGE_TOKEN;
const { Web3StorageProvider, EthereumSwarmProvider } = require('../storage');
const { getMetadata } = require('../redis');

let storageProvider = new Web3StorageProvider(WEB3STORAGE_TOKEN);

const getWelcomeMessage = (req, res) => {
  res.send('API provides endpoints for downloading and uploading YouTube videos to a decentralized storage system, as well as listing videos stored in the decentralized storage.');
};

const downloadUpload = async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(500).send(JSON.stringify({ error: 'URL is required' }));
  }
  console.log('Processing: ' + url);

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
      'Content-Encoding': 'none',
      'Access-Control-Allow-Origin': req.get('origin') || '*',
    });

    const [videoMetadata, file] = await downloadVideoFromYoutube(url, res);

    await uploadVideoToWeb3(file, res, videoMetadata);
    res.end();
  } catch (error) {
    res.end(errorPayload(error));
    console.error(`Error downloading video: ${error}`);
  }
};

const downloadVideoFromYoutube = async (url, res) => {
  console.log('Get video metadata');
  const videoMetadata = await youtube.getVideoMetadata(url);
  res.write(formatPayload('info', videoMetadata));
  return [videoMetadata, await youtube.downloadVideo(videoMetadata.id + '.mp4', url, res)];
};

const uploadVideoToWeb3 = async (file, res, videoMetadata) => {
  try {
    let cid = await storageProvider.store(file, res);
    console.log('Video uploaded to IPFS, cid:', cid);

    // await saveMetadata(cid, videoMetadata);

    const storageUrl = storageProvider.getStorageUrl();
    const videoUrl = storageProvider.getResourceUrl();

    updateUploadList(cid, videoMetadata, videoUrl);

    res.write(formatPayload('ipfsUrl', storageUrl));
    res.write(formatPayload('videoUrl', videoUrl));
    res.write(formatPayload('done', 'Video uploaded to IPFS'));
  } catch (error) {
    console.log('Error uploading video, error:', error.message);
    res.write(formatPayload('error', 'Error uploading video, error: ' + error.message));
  }
};

const fetchMetadata = async (cid) => {
  return await getMetadata(cid);
};

const PAGE_SIZE = 30; // Number of items per page

const listUploads = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number (default to 1)
  const pageSize = parseInt(req.query.pageSize) || PAGE_SIZE; // Number of items per page (default to PAGE_SIZE)

  let uploadList = await getMetadata('uploadList');
  console.log('uploadList', uploadList.length);

  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  let uploads = uploadList.slice(startIndex, endIndex);

  const totalPages = Math.ceil(uploadList.length / pageSize);
  const currentPage = page > totalPages ? totalPages : page;
  res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');

  res.send({
    uploads,
    pagination: {
      totalPages,
      currentPage,
      pageSize,
      totalItems: uploadList.length,
    },
  });
};

module.exports = { getWelcomeMessage, downloadUpload, listUploads };
