const { formatPayload } = require('../utils');

class AbstractStorageProvider {
  constructor() {
    if (new.target === AbstractStorageProvider) {
      throw new TypeError('Cannot construct Abstract instances directly');
    }
  }

  async store(file, options) {
    throw new Error('store method must be implemented by subclass');
  }

  async storeJob(file, options) {
    throw new Error('store Job method must be implemented by subclass');
  }

  getStorageUrl(hash) {
    throw new Error('Method "getStorageUrl" must be implemented');
  }

  getResourceUrl(hash, filename) {
    throw new Error('Method "getStorageUrl" must be implemented');
  }

  formatPayload(eventType, event) {
    return formatPayload(eventType, event);
  }
}

module.exports = AbstractStorageProvider;
