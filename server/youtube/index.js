const YouTubeDlWrap = require('youtube-dl-wrap');
const path = require('path');
const { dirname } = require('path');
const appDir = dirname(require.main.filename);
const { formatPayload, errorPayload, getVideoFile } = require('../utils');
const { bytesToSize } = require('../utils');

class YouTubeDl extends YouTubeDlWrap {
  async getVideoInfo(url) {
    try {
      let youtubeDlArguments = [url];
      let youtubeDlStdout = await this.execPromise(youtubeDlArguments.concat(['--dump-json']));
      return JSON.parse(youtubeDlStdout);
    } catch (error) {
      console.log('Error parsing youtube-dl output: ', e);
      throw error;
    }
  }

  async getVideosFromChannelOrPlaylist(channelUrl) {
    return await youtubeDl.getVideos(channelUrl);
  }

  async getVideos(url) {
    let jsonOutput = await this.fetchJsonOutput(url);

    while (jsonOutput._type === 'playlist' && jsonOutput.entries[0].ie_key == null) {
      const entryUrl = jsonOutput.entries[0].url;
      jsonOutput = await this.fetchJsonOutput(entryUrl);
    }

    if (jsonOutput._type === 'playlist' && jsonOutput.entries[0].ie_key === 'Youtube') {
      return jsonOutput.entries.map((item) => ({
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    } else {
      return [];
    }
  }

  async fetchJsonOutput(url) {
    const youtubeDlArguments = [url, '--flat-playlist', '--dump-single-json', '--no-warnings'];
    const youtubeDlStdout = await this.execPromise(youtubeDlArguments);
    return JSON.parse(youtubeDlStdout);
  }
}

// get project root directory
const youtubeDl = new YouTubeDl(path.join(appDir, 'bin', 'youtube-dl'));

const getVideoMetadata = async (url) => {
  try {
    const metadata = await youtubeDl.getVideoInfo(url);
    // console.log('Metadata: ', metadata);
    return {
      id: metadata.id,
      title: metadata.fulltitle,
      description: metadata.description,
      duration: metadata.duration,
      url: metadata.webpage_url,
      filename: metadata._filename,
      likeCount: metadata.like_count,
      viewCount: metadata.view_count,
      thumbnail: metadata.thumbnail,
    };
  } catch (error) {
    console.log('Error getting video metadata: ', error);
    throw error;
  }
};

async function getVideosFromChannelOrPlaylist(url) {
  const playlistOrChannelVideos = await youtubeDl.getVideosFromChannelOrPlaylist(url);
  return playlistOrChannelVideos;
}

const downloadVideo = (filename, url, res) => {
  console.log('Downloading video: ' + url);
  return new Promise((resolve, reject) => {
    youtubeDl
      .exec(['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '-o', '%(id)s.mp4', url])
      .on('youtubeDlEvent', (eventType, event) => {
        console.log('Event Type: ' + eventType + ' Event: ' + event);
        res.write(formatPayload(eventType, event));
      })
      .on('error', (error) => {
        res.end(errorPayload(error));
        reject(error);
      })
      .on('close', async () => {
        try {
          console.log('Video download complete');
          const file = await getVideoFile(filename);
          const prettyFileSize = bytesToSize(file[0].size);
          res.write(formatPayload('size', prettyFileSize));
          res.write(formatPayload('downloadComplete', 'Video download complete'));
          resolve(file);
        } catch (error) {
          console.error(`Error accessing video: ${error}`);
          reject(error);
        }
      });
  });
};

const downloadVideoJob = (filename, url, job) => {
  console.log('Downloading video: ' + url);
  return new Promise((resolve, reject) => {
    youtubeDl
      .exec(['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', '-o', '%(id)s.mp4', url])
      .on('youtubeDlEvent', async (eventType, event) => {
        await job.updateProgress({ eventType, event });
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('close', async () => {
        try {
          await job.updateProgress({ eventType: 'downloadComplete', event: 'Video download complete' });
          resolve(filename);
        } catch (error) {
          console.error(`Error accessing video: ${error}`);
          reject(error);
        }
      });
  });
};

module.exports = { getVideoMetadata, downloadVideo, downloadVideoJob, getVideosFromChannelOrPlaylist };
