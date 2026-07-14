// redisRoomsManager.js - Centralized Redis-based room state management
// code ----> process --> thread
const { createWorker } = require('mediasoup');
const { config } = require('./config/mediaSoupConfig');

class RedisRoomsManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.localWorker = null;
    this.localRouters = new Map(); // Keep routers in memory (can't serialize)
    this.ROOM_PREFIX = 'room:';
    this.PEER_PREFIX = 'peer:';
    this.ROUTER_PREFIX = 'router:';
  }

  /**
   * Initialize Mediasoup worker
   */
  async initializeWorker() {
    if (!this.localWorker) {
      
      this.localWorker = await createWorker(config.mediasoup.worker);
      
      this.localWorker.on('died', () => {
        console.error('Mediasoup worker died, exiting process...');
        process.exit(1);
      });
    }
    return this.localWorker;
  }

  /**
   * Create or get router for room
   */
  async getOrCreateRouter(roomId) {
    // Check if router exists locally
    if (this.localRouters.has(roomId)) {
      return this.localRouters.get(roomId);
    }

    // Check if router info exists in Redis
    const routerKey = `${this.ROUTER_PREFIX}${roomId}`;
    const routerData = await this.redis.get(routerKey);

    if (routerData) {
      // Router exists but not in this process, create new one
      const router = await this.localWorker.createRouter(config.mediasoup.router);
      this.localRouters.set(roomId, router);
      return router;
    }

    // Create new router
    const router = await this.localWorker.createRouter(config.mediasoup.router);
    this.localRouters.set(roomId, router);

    // Store router metadata in Redis
    await this.redis.set(routerKey, JSON.stringify({
      roomId,
      rtpCapabilities: router.rtpCapabilities,
      createdAt: new Date().toISOString()
    }), { EX: 86400 }); // 24 hour expiry

    return router;
  }

  /**
   * Create room in Redis
   */
  async createRoom(roomId) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    const exists = await this.redis.exists(roomKey);

    if (!exists) {
      await this.getOrCreateRouter(roomId);
      
      const roomData = {
        roomId,
        peers: {},
        screenSharingUser: null,
        createdAt: new Date().toISOString()
      };

      await this.redis.set(roomKey, JSON.stringify(roomData), { EX: 86400 });
    }

    return this.getRoom(roomId);
  }

  /**
   * Get room from Redis
   */
  async getRoom(roomId) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    const roomData = await this.redis.get(roomKey);
    
    if (!roomData) return null;

    const room = JSON.parse(roomData);
    
    // Attach router
    room.router = await this.getOrCreateRouter(roomId);
    
    return room;
  }

  /**
   * Update room in Redis
   */
  async updateRoom(roomId, updates) {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const updatedRoom = {
      ...room,
      ...updates,
      router: undefined // Remove router before saving
    };

    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    await this.redis.set(roomKey, JSON.stringify(updatedRoom), { EX: 86400 });
  }

  /**
   * Add peer to room
   */
  async addPeer(roomId, userId, peerData) {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const peerKey = `${this.PEER_PREFIX}${roomId}:${userId}`;
    const peer = {
      userId,
      userName: peerData.userName,
      isHost: peerData.isHost,
      rtpCapabilities: peerData.rtpCapabilities,
      transports: [], // Store transport IDs only
      producers: [], // Store producer IDs only
      consumers: [], // Store consumer IDs only
      createdAt: new Date().toISOString()
    };

    await this.redis.set(peerKey, JSON.stringify(peer), { EX: 86400 });

    // Update room's peer list
    room.peers[userId] = true;
    await this.updateRoom(roomId, { peers: room.peers });

    return peer;
  }

  /**
   * Get peer from Redis
   */
  async getPeer(roomId, userId) {
    const peerKey = `${this.PEER_PREFIX}${roomId}:${userId}`;
    const peerData = await this.redis.get(peerKey);
    
    if (!peerData) return null;
    
    return JSON.parse(peerData);
  }

  /**
   * Update peer in Redis
   */
  async updatePeer(roomId, userId, updates) {
    const peer = await this.getPeer(roomId, userId);
    if (!peer) throw new Error('Peer not found');

    const updatedPeer = { ...peer, ...updates };
    const peerKey = `${this.PEER_PREFIX}${roomId}:${userId}`;
    
    await this.redis.set(peerKey, JSON.stringify(updatedPeer), { EX: 86400 });
  }

  /**
   * Get all peers in room
   */
  async getRoomPeers(roomId) {
    const room = await this.getRoom(roomId);
    if (!room) return [];

    const peerIds = Object.keys(room.peers);
    const peers = [];

    for (const userId of peerIds) {
      const peer = await this.getPeer(roomId, userId);
      if (peer) peers.push(peer);
    }

    return peers;
  }

  /**
   * Add transport to peer
   */
  async addTransport(roomId, userId, transportId, transportData) {
    const peer = await this.getPeer(roomId, userId);
    if (!peer) throw new Error('Peer not found');

    if (!peer.transports.includes(transportId)) {
      peer.transports.push(transportId);
    }

    // Store transport metadata
    const transportKey = `transport:${roomId}:${userId}:${transportId}`;
    await this.redis.set(transportKey, JSON.stringify(transportData), { EX: 86400 });

    await this.updatePeer(roomId, userId, { transports: peer.transports });
  }

  /**
   * Add producer to peer
   */
  async addProducer(roomId, userId, producerId, producerData) {
    const peer = await this.getPeer(roomId, userId);
    if (!peer) throw new Error('Peer not found');

    if (!peer.producers.includes(producerId)) {
      peer.producers.push(producerId);
    }

    // Store producer metadata
    const producerKey = `producer:${roomId}:${producerId}`;
    await this.redis.set(producerKey, JSON.stringify({
      producerId,
      userId,
      kind: producerData.kind,
      rtpParameters: producerData.rtpParameters,
      appData: producerData.appData,
      createdAt: new Date().toISOString()
    }), { EX: 86400 });

    await this.updatePeer(roomId, userId, { producers: peer.producers });
  }

  /**
   * Get producer metadata
   */
  async getProducer(roomId, producerId) {
    const producerKey = `producer:${roomId}:${producerId}`;
    const producerData = await this.redis.get(producerKey);
    
    if (!producerData) return null;
    
    return JSON.parse(producerData);
  }

  /**
   * Get all producers in room
   */
  async getRoomProducers(roomId) {
    const peers = await this.getRoomPeers(roomId);
    const producers = [];

    for (const peer of peers) {
      for (const producerId of peer.producers) {
        const producer = await this.getProducer(roomId, producerId);
        if (producer) producers.push(producer);
      }
    }

    return producers;
  }

  /**
   * Add consumer to peer
   */
  async addConsumer(roomId, userId, consumerId, consumerData) {
    const peer = await this.getPeer(roomId, userId);
    if (!peer) throw new Error('Peer not found');

    if (!peer.consumers.includes(consumerId)) {
      peer.consumers.push(consumerId);
    }

    // Store consumer metadata
    const consumerKey = `consumer:${roomId}:${consumerId}`;
    await this.redis.set(consumerKey, JSON.stringify({
      consumerId,
      userId,
      producerId: consumerData.producerId,
      kind: consumerData.kind,
      rtpParameters: consumerData.rtpParameters,
      appData: consumerData.appData,
      createdAt: new Date().toISOString()
    }), { EX: 86400 });

    await this.updatePeer(roomId, userId, { consumers: peer.consumers });
  }

  /**
   * Remove producer
   */
  async removeProducer(roomId, userId, producerId) {
    const peer = await this.getPeer(roomId, userId);
    if (!peer) return;

    peer.producers = peer.producers.filter(id => id !== producerId);
    await this.updatePeer(roomId, userId, { producers: peer.producers });

    // Delete producer metadata
    const producerKey = `producer:${roomId}:${producerId}`;
    await this.redis.del(producerKey);
  }

  /**
   * Remove consumer
   */
  async removeConsumer(roomId, userId, consumerId) {
    const peer = await this.getPeer(roomId, userId);
    if (!peer) return;

    peer.consumers = peer.consumers.filter(id => id !== consumerId);
    await this.updatePeer(roomId, userId, { consumers: peer.consumers });

    // Delete consumer metadata
    const consumerKey = `consumer:${roomId}:${consumerId}`;
    await this.redis.del(consumerKey);
  }

  /**
   * Remove peer from room
   */
  async removePeer(roomId, userId) {
    const room = await this.getRoom(roomId);
    if (!room) return;

    const peer = await this.getPeer(roomId, userId);
    if (!peer) return;

    // Delete peer data
    const peerKey = `${this.PEER_PREFIX}${roomId}:${userId}`;
    await this.redis.del(peerKey);

    // Delete all transports
    for (const transportId of peer.transports) {
      const transportKey = `transport:${roomId}:${userId}:${transportId}`;
      await this.redis.del(transportKey);
    }

    // Delete all producers
    for (const producerId of peer.producers) {
      await this.removeProducer(roomId, userId, producerId);
    }

    // Delete all consumers
    for (const consumerId of peer.consumers) {
      await this.removeConsumer(roomId, userId, consumerId);
    }

    // Update room's peer list
    delete room.peers[userId];
    await this.updateRoom(roomId, { peers: room.peers });

    // If room is empty, delete it
    if (Object.keys(room.peers).length === 0) {
      await this.deleteRoom(roomId);
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomId) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    const routerKey = `${this.ROUTER_PREFIX}${roomId}`;

    await this.redis.del(roomKey);
    await this.redis.del(routerKey);

    // Close local router if exists
    if (this.localRouters.has(roomId)) {
      const router = this.localRouters.get(roomId);
      try {
        router.close();
      } catch (err) {
        console.warn('Error closing router:', err);
      }
      this.localRouters.delete(roomId);
    }
  }

  /**
   * Set screen sharing user
   */
  async setScreenSharingUser(roomId, userId) {
    await this.updateRoom(roomId, { screenSharingUser: userId });
  }

  /**
   * Clear screen sharing user
   */
  async clearScreenSharingUser(roomId) {
    await this.updateRoom(roomId, { screenSharingUser: null });
  }

  /**
   * Check if room exists
   */
  async roomExists(roomId) {
    const roomKey = `${this.ROOM_PREFIX}${roomId}`;
    return await this.redis.exists(roomKey) === 1;
  }

  /**
   * Get room count
   */
  async getRoomCount() {
    const keys = await this.redis.keys(`${this.ROOM_PREFIX}*`);
    return keys.length;
  }

  /**
   * Get all room IDs
   */
  async getAllRoomIds() {
    const keys = await this.redis.keys(`${this.ROOM_PREFIX}*`);
    return keys.map(key => key.replace(this.ROOM_PREFIX, ''));
  }
}

module.exports = { RedisRoomsManager };