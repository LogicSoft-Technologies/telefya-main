const net = require("net");

class PortManager {
  constructor(redisClient, config = {}) {
    this.redis = redisClient || null;

    this.keys = {
      audio: config.audioKey || "recording:port:audio",
      video: config.videoKey || "recording:port:video",
      rtc: config.rtcKey || "recording:port:rtc",
    };

    this.ranges = {
      audio: config.audioRange || { min: 30000, max: 39999 },
      video: config.videoRange || { min: 40000, max: 49999 },
      rtc: config.rtcRange || { min: 50000, max: 59999 },
    };

    this.memoryCounters = {
      audio: this.ranges.audio.min - 1,
      video: this.ranges.video.min - 1,
      rtc: this.ranges.rtc.min - 1,
    };

    this.reservedPorts = new Set();
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once("error", () => resolve(false));

      server.once("listening", () => {
        server.close(() => resolve(true));
      });

      server.listen(port, "127.0.0.1");
    });
  }

  normalize(kind, value) {
    const range = this.ranges[kind];

    if (!range) {
      throw new Error(`Unknown port kind: ${kind}`);
    }

    return ((value - 1) % (range.max - range.min + 1)) + range.min;
  }

  async nextPort(kind) {
    if (this.redis) {
      const value = await this.redis.incr(this.keys[kind]);
      return this.normalize(kind, value);
    }

    this.memoryCounters[kind] += 1;
    return this.normalize(kind, this.memoryCounters[kind]);
  }

  async allocate(kind = "rtc") {
    if (!this.ranges[kind]) {
      throw new Error(`Invalid port kind: ${kind}`);
    }

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const port = await this.nextPort(kind);

      if (this.reservedPorts.has(port)) {
        continue;
      }

      const available = await this.isPortAvailable(port);

      if (!available) {
        continue;
      }

      this.reservedPorts.add(port);
      console.log(`[PortManager] Allocated ${kind} port: ${port}`);
      return port;
    }

    throw new Error(`Unable to allocate available ${kind} port`);
  }

  async release(kind, port) {
    if (!port) return;

    this.reservedPorts.delete(Number(port));
    console.log(`[PortManager] Released ${kind} port: ${port}`);
  }
}

let portManagerInstance = null;

function initPortManager(redisClient, config = {}) {
  portManagerInstance = new PortManager(redisClient, config);
  console.log("[PortManager] Initialized successfully");
  return portManagerInstance;
}

function getPortManager() {
  if (!portManagerInstance) {
    portManagerInstance = new PortManager(null);
    console.log("[PortManager] Initialized with in-memory fallback");
  }

  return portManagerInstance;
}

module.exports = {
  PortManager,
  AdvancedPortManager: PortManager,
  initPortManager,
  getPortManager,
  portManager: {
    get instance() {
      return getPortManager();
    },
  },
};