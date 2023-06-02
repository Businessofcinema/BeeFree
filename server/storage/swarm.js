const { Bee } = require('@ethersphere/bee-js');
const AbstractStorageProvider = require('./abstractStorage');
const { formatPayload, bytesToSize } = require('../utils');
const redis = require('redis');
const redisClient = redis.createClient();

class SwarmProvider extends AbstractStorageProvider {
    constructor(url) {
        super();
        this.client = new Bee(url);
        this.reference = null;
        this.filename = null;
    }

    async store(file, res) {
        try {
            this.filename = file[0].name.substring(1, file[0].name.length);
            console.log('Uploading video to Swarm', this.filename);
            res.write(formatPayload('upload', 'Uploading video: ' + this.filename + ' to Swarm'));

            const totalSize = file[0].size;

            let uploaded = 0;
            const onUploadProgress = (progress) => {
                uploaded += progress.loaded;
                const pct = 100 * (uploaded / totalSize);
                res.write(this.formatPayload('upload', `${pct.toFixed(2)}% complete`));
                console.log(`Uploading... ${pct.toFixed(2)}% complete`);
            };

            this.reference = await this.client.uploadData(file, { onUploadProgress });
            console.log('Uploaded file with reference:', this.reference);

            // Store the reference in Redis
            redisClient.lpush('uploads', JSON.stringify({ reference: this.reference, size: bytesToSize(totalSize), url: this.getStorageUrl(this.reference) }));
        } catch (error) {
            throw error;
        }
    }

    async storeJob(file, job) {
        try {
            this.filename = file[0].name.substring(1, file[0].name.length);
            await job.updateProgress({ eventType: 'upload', event: 'Uploading video: ' + this.filename + ' to Swarm' });

            const totalSize = file[0].size;

            let uploaded = 0;
            const onUploadProgress = async (progress) => {
                uploaded += progress.loaded;
                const pct = 100 * (uploaded / totalSize);
                await job.updateProgress({ eventType: 'upload', event: `${pct.toFixed(2)}% complete` });
            };

            this.reference = await this.client.uploadData(file, { onUploadProgress });
            console.log('Uploaded file with reference:', this.reference);
        } catch (error) {
            throw error;
        }
    }

    getStorageUrl(reference) {
        return `${this.client.url}/bzz/${reference ? reference : this.reference}/`;
    }

    getResourceUrl(reference, filename) {
        return `${this.client.url}/bzz/${reference ? reference : this.reference}/${filename ? encodeURI(filename) : encodeURI(this.filename)}`;
    }

    async listUploads() {
        return new Promise((resolve, reject) => {
            redisClient.lrange('uploads', 0, -1, (err, uploads) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(uploads.map(upload => JSON.parse(upload)));
                }
            });
        });
    }
}

module.exports = SwarmProvider;
