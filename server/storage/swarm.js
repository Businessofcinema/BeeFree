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
        this.reference=null;
        this.cid=null;
    }

    async store(file, res) {
        try {
            this.filename = file[0].name.substring(1, file[0].name.length);
            console.log('Uploading video to Swarm', this.filename);
            res.write(formatPayload('upload', 'Uploading video: ' + this.filename + ' to Swarm'));

            const totalSize = file[0].size;

            let uploaded = 0;
            const createbatch = await this.debugclient.createPostageBatch("100",17);

            const allBatches = await this.debugclient.getAllPostageBatch();

            // Filter batches
            const usableBatches = allBatches.filter(batch => batch.usable && !batch.expired);

            if (usableBatches.length === 0) {
                throw new Error("No usable batches found");
            }

            res.write(formatPayload('BATCH ID:' + usableBatches[0].batchID.toString()));
           
          
            this.result = await this.client.uploadFile(usableBatches[0].batchID.toString(), await file[0].stream(), this.filename, { contentType: "video/mp4" });
            this.reference=this.result.reference;
            this.cid=this.result.cid();
            console.log('Uploaded file with reference:', this.result.reference);
            res.write(formatPayload('Uploaded file with reference:' + this.result.reference));
            res.write(formatPayload('Uploaded file with cid:' + this.result.cid()));
            try {
                // Store the reference in Redis
                const result = await redisClient.lPush('uploads', JSON.stringify({ reference: this.result.reference, size: bytesToSize(totalSize), url: this.getStorageUrl(this.result.reference) }));
                res.write(formatPayload('Redis lPush result:', result));
            } catch (error) {
                console.error('Error with Redis lPush:', error);
            }
        }
        catch{
            throw error;
        }
    }


    async storeJob(file, job) {
        try {
            this.filename = file[0].name.substring(1, file[0].name.length);
            await job.updateProgress({ eventType: 'upload', event: 'Uploading video: ' + this.filename + ' to Swarm' });

            
            redisClient.lPush('uploads', JSON.stringify({ reference: this.result.reference, size: bytesToSize(totalSize), url: this.getStorageUrl(this.result.reference) }));

            this.reference = await this.client.uploadData(await file[0].stream(), this.filename);
            res.write(formatPayload('Uploaded file with reference:', this.reference));
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
