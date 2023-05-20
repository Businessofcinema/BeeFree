const Redis = require('ioredis');
const redis = new Redis();

// save metadata to redis
async function saveMetadata(cid, metadata) {
  await redis.set(cid, JSON.stringify(metadata));
}

// retrieve metadata from redis
async function getMetadata(cid) {
  const metadata = await redis.get(cid);
  return JSON.parse(metadata);
}

// update uploadList in redis
async function updateUploadListWithMetadata(cid, obj) {
  const metadata = await getMetadata(cid);
  if (metadata) {
    const foundCid = metadata.map((item) => item.cid).includes(obj.cid);
    if (!foundCid) {
      metadata.unshift(obj);
      await saveMetadata(cid, metadata);
      console.log('cid: ', cid + ' added to redis');
    } else {
      console.log('cid already exists');
    }
  } else {
    console.log("cache doesn't exist, create new one");
    await saveMetadata(cid, [obj]);
  }
}

module.exports = { saveMetadata, getMetadata, updateUploadListWithMetadata };
