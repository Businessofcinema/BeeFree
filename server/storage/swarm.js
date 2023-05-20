const AbstractStorageProvider = require('./abstractStorage');

class SwarmProvider extends AbstractStorageProvider {
  async store(file, options) {
    // Implement the store method for Ethereum Swarm
  }
}

module.exports = SwarmProvider;
