const mediasoup = require('mediasoup');
const { config } = require('../config/mediaSoupConfig');


class MediaSoupService {

  constructor() {

    this.worker = null;
    this.router = null;
    this.transports = new Map(); // roomId -> Map(transportKey -> transport)
    this.producers = new Map(); // roomId -> Map(producerKey -> producer)
    this.consumers = new Map(); // roomId -> Map(consumerKey -> consumer)
  }
  

  /**
   *  Initializes the MediaSoup worker and router.
   *  This method should be called once at the start of the application.
   */
  
  async init() {
    try {
      this.worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
      });

      this.worker.on('died', (error) => {
        console.error('MediaSoup worker died:', error);
        setTimeout(() => process.exit(1), 2000);
      });

      this.router = await this.worker.createRouter({
        mediaCodecs: config.mediasoup.router.mediaCodecs,
      });

      
    } catch (error) {
      console.error('Failed to initialize MediaSoup:', error);
      throw error;
    }
  }

  /**
   * getRouterRtpCapabilities - Function to get the RTP capabilities of the router.
   * @returns The RTP capabilities of the router.
   * @throws {Error} If the router is not initialized.
   */
  getRouterRtpCapabilities() {
    if (!this.router) {
      throw new Error('Router not initialized');
    }
    return this.router.rtpCapabilities;
  }

  /**
   * getRouter - Returns the MediaSoup router instance.
   * @returns {mediasoup.types.Router} The router.
   * @throws {Error} If the router is not initialized.
   */
  getRouter() {
    if (!this.router) {
      throw new Error('Router not initialized');
    }

    return this.router;
  }

  /**
   * getRoomProducerInfos - Returns all producer info objects for a room.
   * @param {*} roomId
   * @returns {Array} Array of producer info objects.
   */
  getRoomProducerInfos(roomId) {
    const roomProducers = this.producers.get(roomId) || new Map();
    return [...roomProducers.values()];
  }

  /**
   * getProducerInfo - Finds a producer's info within a room by producer id.
   * @param {*} roomId
   * @param {*} producerId
   * @returns {Object|null} The producer info object, or null if not found.
   */
  getProducerInfo(roomId, producerId) {
    const roomProducers = this.producers.get(roomId) || new Map();

    for (const info of roomProducers.values()) {
      if (info?.producer?.id === producerId) {
        return info;
      }
    }

    return null;
  }

  /**
   * createRecordingPlainTransport - Creates a PlainTransport for use with recording.
   * @returns {Promise<mediasoup.types.PlainTransport>} The created plain transport.
   * @throws {Error} If the router is not initialized.
   */
  async createRecordingPlainTransport() {
    if (!this.router) {
      throw new Error('Router not initialized');
    }

    return this.router.createPlainTransport({
      listenIp: {
        ip: process.env.MEDIASOUP_LISTEN_IP || '127.0.0.1',
        announcedIp: undefined,
      },
      rtcpMux: true,
      comedia: false,
    });
  }


  /**
   * createTransporter - Creates a WebRTC transport for producing or consuming media.
   * This method is used to set up the media flow between the client and the server.
   * @param {*} roomId 
   * @param {*} socketId 
   * @param {*} isProducer 
   * @returns {mediasoup.types.AppData} The created transport.
   */
  async createTransport(roomId, socketId, isProducer = true, userData = {}, io= null) {
    
    try {
      if (!this.router) {
        throw new Error('Router not initialized');
      }

      const transport = await this.router.createWebRtcTransport({
        listenIps: config.mediasoup.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: config.mediasoup.webRtcTransport.initialAvailableOutgoingBitrate,
        maxIncomingBitrate: config.mediasoup.webRtcTransport.maxIncomingBitrate,
        maxOutgoingBitrate: config.mediasoup.webRtcTransport.maxOutgoingBitrate,
      });

      const transportKey = `${transport.id}__${socketId}`;

      if (!this.transports.has(roomId)) {
        this.transports.set(roomId, new Map());
      }
      this.transports.get(roomId).set(transportKey, {transport, userData});

      transport.on('dtlsstatechange', (state) => {
        // DO not add transpoter in not in active state // stremaing failed
        if (state === 'failed' || state === 'closed') {
          const roomTransports = this.transports.get(roomId);
          if (roomTransports) {
            roomTransports.delete(transportKey);
            if (roomTransports.size === 0) {
              this.transports.delete(roomId);
            }
          } 
           if (io){
            io.to(socketId).emit('transportClosed', { reason: state, socketId, roomId });
           }
        }
        
       
      });

      transport.on('icestatechange', (state) => {
        // Handle ICE state change if needed; detect transport failure for ip/port changes
        if (state === 'failed' || state === 'closed') {
          
          const roomTransports = this.transports.get(roomId);
          if (roomTransports) {
            roomTransports.delete(transportKey);
            if (roomTransports.size === 0) {
              this.transports.delete(roomId);
            }
          }
        }
        
          if (io){
            io.to(socketId).emit('transportClosed', { reason: state, socketId, roomId });
        }
      });

      transport.on('iceselectedtuplechange', (tuple) => {
        // Handle ICE selected tuple change if needed
      });

      transport.on('close', () => {
          
        const roomTransports = this.transports.get(roomId);
        if (roomTransports) {
          roomTransports.delete(transportKey);
          if (roomTransports.size === 0) {
            this.transports.delete(roomId);
          }
        }
      });
      
      return transport;
    } catch (error) {
      console.error('Error creating transport:', error);
      throw error;
    }
  }
   
  /**
   * connectTransporter - Connects a WebRTC transport with DTLS parameters.
   * This method is used to establish a secure connection for media transport.
   * between the client and the server.
   * @param {*} roomId 
   * @param {*} socketId 
   * @param {*} transportId 
   * @param {*} dtlsParameters 
   */
  async connectTransport(roomId, socketId, transportId, dtlsParameters, io) {
    try {
      const roomTransports = this.transports.get(roomId);
      if (!roomTransports) {
        throw new Error(`No transports found for room: ${roomId}`);
      }

      const transportKey = `${transportId}__${socketId}`;
      const transport = roomTransports.get(transportKey);
      
      if (!transport?.transport) {
        throw new Error(`Transport not found: ${transportKey}`);
      }

      await transport?.transport.connect({ dtlsParameters });

     
      // clite Emit coonect --> listen for connect before proceed
      //the client will emit a 'transportConnected' event
      // and wait for the server to acknowledge the connection
     // return { success: true, transportId: transport.id };
      
    } catch (error) {
      console.error('Error connecting transport:', error);
      throw error;
    }
  }



/**
 * 
 * @param {*} roomId 
 * @param {*} socketId 
 * @param {*} transportId 
 * @param {*} kind 
 * @param {*} rtpParameters 
 * @returns 
 */
  async produce(roomId, socketId, transportId, kind, rtpParameters, userData=null) {
      console.log('Producing media:', { roomId, socketId, transportId, kind });
    try {
      const roomTransports = this.transports.get(roomId);
    
      if (!roomTransports) {
        throw new Error(`No transports found in room: ${roomId}`);
      }

      const transportKey = `${transportId}__${socketId}`;
      const transport = roomTransports.get(transportKey);
      if (!transport) {
        throw new Error(`Transport not found: ${transportKey}`);
      }

      const producer = await transport?.transport.produce({
        kind,
        rtpParameters,
        ...(kind === 'video' && {
          encodings: [
            { maxBitrate: 1000000, scalabilityMode: 'L1T3' },
            { maxBitrate: 500000, scalabilityMode: 'L1T3' },
            { maxBitrate: 100000, scalabilityMode: 'L1T3' },
          ],
        }),
      });

      if (!this.producers.has(roomId)) {
        this.producers.set(roomId, new Map());
      }
      const producerKey = `${producer.id}__${socketId}`;
      this.producers.get(roomId).set(producerKey, {
        producer,
        socketId,
        kind: producer.kind,
        userData: userData || null,
      });

      console.log('Producer created:', this.producers.get(roomId)) ;

      producer.on('transportclose', () => {
        
        const roomProducers = this.producers.get(roomId);
        if (roomProducers) {
          roomProducers.delete(producerKey);
          if (roomProducers.size === 0) {
            this.producers.delete(roomId);
          }
        }
      });

      producer.on('close', () => {
        
        const roomProducers = this.producers.get(roomId);
        if (roomProducers) {
          roomProducers.delete(producerKey);
          if (roomProducers.size === 0) {
            this.producers.delete(roomId);
          }
        }
      });
      
      
      
      return producer;
    } catch (error) {
      console.error('Error creating producer:', error);
      throw error;
    }
  }
  

  /**
   * consume - Creates a consumer for a specific producer in a room.
   * This method is used to receive media from a producer.
   * @param {*} roomId 
   * @param {*} socketId 
   * @param {*} transportId 
   * @param {*} producerId 
   * @param {*} rtpCapabilities 
   * @param {*} userData 
   * @returns 
   */
  async consume(roomId, socketId, transportId, producerId, rtpCapabilities, userData=null) {
    try {
      let producerInfo = null;
      let producerSocketId = null;

      for (const [room, roomProducers] of this.producers.entries()) {
        for (const [key, info] of roomProducers.entries()) {

          if (key.startsWith(producerId + '__')) {
            producerInfo = info;
            producerSocketId = info.socketId;
           // break;
          }
        }
        if (producerInfo) break;
      }

      if (!producerInfo) {
        throw new Error(`Producer ${producerId} not found`);
      }

      if (!this.router.canConsume({ producerId: producerInfo.producer.id, rtpCapabilities })) {
        console.warn(`Cannot consume producer ${producerId}: incompatible RTP capabilities`);
        return null;
      }

      const roomTransports = this.transports.get(roomId);
      if (!roomTransports) {
        throw new Error(`No transports found for room: ${roomId}`);
      }

      const transportKey = `${transportId}__${socketId}`;
      const transport = roomTransports.get(transportKey);
      if (!transport) {
        throw new Error(`Transport not found: ${transportKey}`);
      }

      const consumer = await transport?.transport?.consume({
        producerId: producerInfo.producer.id,
        rtpCapabilities,
        paused: true, //The server will not send any media (audio/video packets) to 
        // the consumer until you explicitly resume it using consumer.resume().
      });

      if (!this.consumers.has(roomId)) {
        this.consumers.set(roomId, new Map());
      }
      const consumerKey = `${consumer.id}__${socketId}`;
      this.consumers.get(roomId).set(consumerKey, {consumer,userData});

       


      consumer.on('transportclose', () => {
        
        const roomConsumers = this.consumers.get(roomId);
        if (roomConsumers) {
          roomConsumers.delete(consumerKey);
          if (roomConsumers.size === 0) {
            this.consumers.delete(roomId);
          }
        }
      });

      consumer.on('producerclose', () => {
        
        const roomConsumers = this.consumers.get(roomId);
        if (roomConsumers) {
          roomConsumers.delete(consumerKey);
          if (roomConsumers.size === 0) {
            this.consumers.delete(roomId);
          }
        }
      });

      consumer.on('close', () => {
        
        const roomConsumers = this.consumers.get(roomId);
        if (roomConsumers) {
          roomConsumers.delete(consumerKey);
          if (roomConsumers.size === 0) {
            this.consumers.delete(roomId);
          }
        }
      });

      
      return consumer;  
    } catch (error) {
      console.error('Error creating consumer:', error);
      throw error;
    }
  }

  async resumeConsumer(roomId, socketId, consumerId) {
    try {
      const roomConsumers = this.consumers.get(roomId);
      if (!roomConsumers) {
        throw new Error(`No consumers found for room: ${roomId}`);
      }

      const consumerKey = `${consumerId}__${socketId}`;
      
      const consumer = roomConsumers.get(consumerKey);
      if (!consumer) {
        throw new Error(`Consumer not found: ${consumerKey}`);
      }

      await consumer?.consumer?.resume();
      
    } catch (error) {
      console.error('Error resuming consumer:', error);
      throw error;
    }
  }

  async pauseConsumer(roomId, socketId, consumerId) {
    try {
      const roomConsumers = this.consumers.get(roomId);
      if (!roomConsumers) {
        throw new Error(`No consumers found for room: ${roomId}`);
      }

      const consumerKey = `${consumerId}__${socketId}`;
      const consumer = roomConsumers.get(consumerKey);
      if (!consumer) {
        throw new Error(`Consumer not found: ${consumerKey}`);
      }

      await consumer?.consumer?.pause();
      
    } catch (error) {
      console.error('Error pausing consumer:', error);
      throw error;
    }
  }

  async resumeConsumerTransport(roomId, socketId) {
    try {
      const roomConsumers = this.consumers.get(roomId);
      if (!roomConsumers) {
        
        return;
      }

      for (const [key, consumer] of roomConsumers.entries()) {
        if (key.endsWith(`__${socketId}`)) {
          if (consumer.paused) {
            await consumer?.consumer?.resume();
            
          }
        }
      }
    } catch (error) {
      console.error('Error resuming consumer transport:', error);
      throw error;
    }
  }

  getAllProducers(roomId) {
    
    const roomProducers = this.producers.get(roomId) || new Map();
    
    return roomProducers;
  }

  cleanup(socketId, io, roomId) {
    

    const roomConsumers = this.consumers.get(roomId);
    if (roomConsumers) {
      const consumersToDelete = [];
      for (const [key, consumer] of roomConsumers.entries()) {
        if (key.endsWith(`__${socketId}`)) {
          try {
            consumer?.consumer.close();
            consumersToDelete.push(key);
          } catch (e) {
            console.warn('Error closing consumer:', e);
          }
        }
      }
      consumersToDelete.forEach((key) => roomConsumers.delete(key));
      if (roomConsumers.size === 0) {
        this.consumers.delete(roomId);
      }
    }

    const roomProducers = this.producers.get(roomId);
    if (roomProducers) {
      const producersToDelete = [];
      for (const [key, producerInfo] of roomProducers.entries()) {
        if (key.endsWith(`__${socketId}`)) {
          try {
            io.to(roomId).emit('producerClosed', { producerId: producerInfo.producer.id });
            producerInfo.producer.close();
            producersToDelete.push(key);
          } catch (e) {
            console.warn('Error closing producer:', e);
          }
        }
      }
      producersToDelete.forEach((key) => roomProducers.delete(key));
      if (roomProducers.size === 0) {
        this.producers.delete(roomId);
      }
    }

    const roomTransports = this.transports.get(roomId);
    if (roomTransports) {
      const transportsToDelete = [];
      for (const [key, transport] of roomTransports.entries()) {
        if (key.endsWith(`__${socketId}`)) {
          try {
            transport?.transport?.close();
            transportsToDelete.push(key);
          } catch (e) {
            console.warn('Error closing transport:', e);
          }
        }
      }
      transportsToDelete.forEach((key) => roomTransports.delete(key));
      if (roomTransports.size === 0) {
        this.transports.delete(roomId);
      }
    }
  }
}




module.exports = MediaSoupService;