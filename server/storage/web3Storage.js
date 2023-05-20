const { Web3Storage } = require('web3.storage');
const AbstractStorageProvider = require('./abstractStorage');
const { formatPayload, bytesToSize } = require('../utils');

class Web3StorageProvider extends AbstractStorageProvider {
  constructor(token) {
    super();
    this.client = new Web3Storage({ token });
    this.cid = null;
    this.filename = null;
  }

  async store(file, res) {
    try {
      this.filename = file[0].name.substring(1, file[0].name.length);
      console.log('Uploading video to web3.storage', this.filename);
      res.write(formatPayload('upload', 'Uploading video: ' + this.filename + ' to web3.storage'));

      const onRootCidReady = (cid) => {
        console.log('Uploading file with cid:', cid);
        this.cid = cid;
        //   res.write(this.formatPayload('cid', cid));
      };

      const totalSize = file[0].size;

      let uploaded = 0;
      const onStoredChunk = (size) => {
        uploaded += size;
        const pct = 100 * (uploaded / totalSize);
        res.write(this.formatPayload('upload', `${pct.toFixed(2)}% complete`));
        console.log(`Uploading... ${pct.toFixed(2)}% complete`);
      };

      return this.client.put(file, { onRootCidReady, onStoredChunk });
    } catch (error) {
      throw error;
    }
  }

  async storeJob(file, job) {
    try {
      this.filename = file[0].name.substring(1, file[0].name.length);
      await job.updateProgress({ eventType: 'upload', event: 'Uploading video: ' + this.filename + ' to web3.storage' });

      const onRootCidReady = (cid) => {
        console.log('Uploading file with cid:', cid);
        this.cid = cid;
      };

      const totalSize = file[0].size;

      let uploaded = 0;
      const onStoredChunk = async (size) => {
        uploaded += size;
        const pct = 100 * (uploaded / totalSize);
        await job.updateProgress({ eventType: 'upload', event: `${pct.toFixed(2)}% complete` });
      };
      return this.client.put(file, { onRootCidReady, onStoredChunk });
    } catch (error) {
      throw error;
    }
  }

  getStorageUrl(cid) {
    return `https://${cid ? cid : this.cid}.ipfs.dweb.link/`;
  }

  getResourceUrl(cid, filename) {
    return `https://${cid ? cid : this.cid}.ipfs.dweb.link/${filename ? encodeURI(filename) : encodeURI(this.filename)}`;
  }

  async listUploads() {
    let uploads = [];
    for await (const upload of this.client.list()) {
      uploads.push({ cid: upload.cid, size: bytesToSize(upload.dagSize), url: this.getStorageUrl(upload.cid) });
    }
    return uploads;
  }
}

module.exports = Web3StorageProvider;
