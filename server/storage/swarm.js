const { Bee, BeeDebug } = require('@ethersphere/bee-js');
const AbstractStorageProvider = require('./abstractStorage');
const { formatPayload, bytesToSize } = require('../utils');
const redis = require('redis');
const FormData = require('form-data');
const redisClient = redis.createClient();

class SwarmProvider extends AbstractStorageProvider {
    constructor(url, debugurl) {
        super();
        this.client = new Bee(url);
        this.debugclient = new BeeDebug(debugurl);
        this.result = null;
        this.filename = null;
    }

    async store(file, res) {
        try {
            this.filename = file[0].name.substring(1, file[0].name.length);
            console.log('Uploading video to Swarm', this.filename);
            res.write(formatPayload('upload', 'Uploading video: ' + this.filename + ' to Swarm'));

            const totalSize = file[0].size;

            let uploaded = 0;

            const batches = await this.debugclient.getAllPostageBatch();
            
            res.write(formatPayload('BATCH ID:' + batches[0].batchID.toString()));

            //console.log(file, batchID);
            this.result = await this.client.uploadFile(batches[0].batchID.toString(), await file[0].stream(), this.filename, { contentType: "video/mp4" });
            console.log('Uploaded file with reference:', this.result.reference);
            res.write(formatPayload('Uploaded file with reference:' + this.result.reference));

            // Store the reference in Redis
            redisClient.lPush('uploads', JSON.stringify({ reference: this.result.reference, size: bytesToSize(totalSize), url: this.getStorageUrl(this.result.reference) }));
        } catch (error) {
            throw error;
        }
    }

    async storeJob(file, job) {
        try {
            this.filename = file[0].name.substring(1, file[0].name.length);
            await job.updateProgress({ eventType: 'upload', event: 'Uploading video: ' + this.filename + ' to Swarm' });

            
            redisClient.lPush('uploads', JSON.stringify({ reference: this.result.reference, size: bytesToSize(totalSize), url: this.getStorageUrl(this.result.reference) }));

            this.reference = await this.client.uploadData(await file[0].stream(), this.filename);
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
            redisClient.lRange('uploads', 0, -1, (err, uploads) => {
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
