// backend/config/ports.js
class PortManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.keys = {
      audio: 'recording:port:audio',
      video: 'recording:port:video'
    };
    this.ranges = {
      audio: { min: 30000, max: 39999 },
      video: { min: 40000, max: 49999 }
    };
  }

  async allocate(kind) {
    if (!this.redis) {
      throw new Error('Redis client not initialized in PortManager');
    }
    
    const { min, max } = this.ranges[kind];
    const key = this.keys[kind];

    try {
      const port = await this.redis.incr(key);
      const normalized = ((port - 1) % (max - min + 1)) + min;
      console.log(`[PortManager] Allocated ${kind} port: ${normalized}`);
      return normalized;
    } catch (err) {
      console.error(`[PortManager] Error allocating ${kind} port:`, err);
      throw err;
    }
  }

  async release(kind, port) {
    console.log(`[PortManager] Released ${kind} port: ${port}`);
    // No need to free – Redis counter handles reuse
  }
}

// Singleton instance
let portManagerInstance = null;

function initPortManager(redisClient) {
  if (!redisClient) {
    throw new Error('Redis client is required to initialize PortManager');
  }
  
  portManagerInstance = new PortManager(redisClient);
  console.log('[PortManager] Initialized successfully');
  return portManagerInstance;
}

function getPortManager() {
  if (!portManagerInstance) {
    throw new Error('PortManager not initialized. Call initPortManager(redisClient) first.');
  }
  return portManagerInstance;
}

// Export getter function as 'portManager' for backward compatibility
const portManager = {
  get instance() {
    return getPortManager();
  }
};




module.exports = { 
  portManager: portManagerInstance, // Direct access (will be null until initialized)
  initPortManager, 
  getPortManager,

};

