const MediaSoupService = require('./services/07_media_soup_service');
const { createClient } = require('redis');

const mediasoupServer = (io) => {
  const mediaSoupService = new MediaSoupService();
  const redisClient = createClient({
    url: 'redis://localhost:6379' // Adjust Redis connection URL as needed
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));

  (async () => {
    await redisClient.connect();
  })();

  io.on('connection', async (socket) => {
    console.log(`New socket connection: ${socket.id}`);
    
    socket.on('joinRoom', async ({ roomId, userName, socketId }, callback) => {
      try {
        socket.join(roomId);
        const user = { socketId, userName, roomId, isHost: false };

        // Check if room exists in Redis
        const roomExists = await redisClient.exists(`room:${roomId}`);
        if (!roomExists) {
          user.isHost = true;
          await redisClient.hSet(`room:${roomId}`, socket.id, JSON.stringify(user));
        } else {
          // Add user to room
          await redisClient.hSet(`room:${roomId}`, socket.id, JSON.stringify(user));
        }

        // Store socketId to roomId mapping
        await redisClient.set(`socket:${socket.id}`, roomId);

        console.log(`User ${userName} joined room ${roomId} with socket ID ${socket.id}`);

        // Get room size
        const roomSize = await redisClient.hLen(`room:${roomId}`);
        io.to(roomId).emit('userHasJoined', { user, count: roomSize });

        const existingProducers = mediaSoupService.getAllProducers(roomId);
        for (const [producerKey, producerInfo] of existingProducers.entries()) {
          if (producerInfo.socketId !== user.socketId) {
            const producerUserStr = await redisClient.hGet(`room:${roomId}`, producerInfo.socketId);
            const producerUser = producerUserStr ? JSON.parse(producerUserStr) : null;
            const producerId = producerKey.split('__');
            socket.emit('newProducer', {
              producerId: producerId[0],
              kind: producerInfo.kind,
              socketId: producerId[1],
              userName: producerUser?.userName || 'Unknown',
            });
          }
        }

        callback({ success: true, existingProducers, user });
      } catch (error) {
        console.error('Error in roomJoin:', error);
        callback({ error: 'Failed to join room' });
      }
    });

    socket.on('getRouterRtpCapabilities', (_data, callback) => {
      try {
        const caps = mediaSoupService.getRouterRtpCapabilities();
        callback(caps);
      } catch (error) {
        console.error('Error getting RTP capabilities:', error);
        callback({ error: 'Failed to get RTP capabilities' });
      }
    });

    socket.on('createTransport', async ({ roomId, isProducer, socketId, userData }, callback) => {
      try {
        const transport = await mediaSoupService.createTransport(roomId, socketId, isProducer, userData, io);
        const transportParams = {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
          smtpParameters: transport.sctpParameters,
        };
        callback(transportParams);
      } catch (error) {
        console.error('Error creating transport:', error);
        callback({ error: `Failed to create transport: ${error.message}` });
      }
    });

    socket.on('connectTransport', async ({ roomId, transportId, dtlsParameters }, callback) => {
      try {
        await mediaSoupService.connectTransport(roomId, socket.id, transportId, dtlsParameters, io);
        callback({ success: true });
      } catch (error) {
        console.error('Error connecting transport:', error);
        callback({ error: `Failed to connect transport: ${error.message}` });
      }
    });

    socket.on('produce', async ({ roomId, socketId, transportId, kind, rtpParameters, userData }, callback) => {
     
      try {
        const producer = await mediaSoupService.produce(roomId, socketId, transportId, kind, rtpParameters, userData);
        const userRoomId = await redisClient.get(`socket:${socketId}`);
        const userStr = await redisClient.hGet(`room:${userRoomId}`, socketId);
        const user = userStr ? JSON.parse(userStr) : null;

        callback({ id: producer.id });

        io.to(roomId).emit('newProducer', {
          producerId: producer.id,
          kind,
          socketId: socketId,
          userName: userData?.userName || 'Unknown',
          userData: userData,
        });
      } catch (error) {
        console.error('Error producing:', error);
        callback({ error: `Failed to produce: ${error.message}` });
      }
    });

    socket.on('consume', async ({ transportId, producerId, rtpCapabilities, userData }, callback) => {
      try {
        const userRoomId = await redisClient.get(`socket:${socket.id}`);
        const consumer = await mediaSoupService.consume(userRoomId, socket.id, transportId, producerId, rtpCapabilities, userData);
        if (consumer) {
          const consumerParams = {
            id: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused,
          };
          callback(consumerParams);
        } else {
          console.warn(`Cannot consume producer ${producerId}`);
          callback({ error: 'Cannot consume - incompatible capabilities' });
        }
      } catch (error) {
        console.error('Error consuming:', error);
        callback({ error: `Failed to consume: ${error.message}` });
      }
    });

    socket.on('resumeConsumer', async ({ consumerId, socketId }, callback) => {
      try {
        console.log('Resuming consumer:', consumerId, socketId);
        const userRoomId = await redisClient.get(`socket:${socket.id}`);
        await mediaSoupService.resumeConsumer(userRoomId, socketId, consumerId);
        callback({ success: true });
      } catch (error) {
        console.error('Error resuming consumer:', error);
        callback({ error: `Failed to resume consumer: ${error.message}` });
      }
    });

    socket.on('pauseConsumer', async ({ consumerId }, callback) => {
      try {
        const userRoomId = await redisClient.get(`socket:${socket.id}`);
        await mediaSoupService.pauseConsumer(userRoomId, socket.id, consumerId);
        callback({ success: true });
      } catch (error) {
        console.error('Error pausing consumer:', error);
        callback({ error: `Failed to pause consumer: ${error.message}` });
      }
    });

    socket.on('resumeConsumerTransport', async ({ transportId }, callback) => {
      try {
        const userRoomId = await redisClient.get(`socket:${socket.id}`);
        await mediaSoupService.resumeConsumerTransport(userRoomId, socket.id);
        callback({ success: true });
      } catch (error) {
        console.error('Error resuming consumer transport:', error);
        callback({ error: `Failed to resume consumer transport: ${error.message}` });
      }
    });

    socket.on('leaveRoom', async () => {
      const roomId = await redisClient.get(`socket:${socket.id}`);
      const userStr = await redisClient.hGet(`room:${roomId}`, socket.id);
      const user = userStr ? JSON.parse(userStr) : null;
      await handleDisconnection(socket.id);
      setTimeout(() => {
        io.to(roomId).emit('userLeftRoom', { message: 'You have left the room.', socketId: socket.id, user });
      }, 1000);
    });

    socket.on('getUserData', async ({ roomId }, callback) => {
      console.log('getUserData called for room:', roomId);
      if (roomId) {
        const users = await redisClient.hGetAll(`room:${roomId}`);
        const parsedUsers = {};
        for (const [key, value] of Object.entries(users)) {
          parsedUsers[key] = JSON.parse(value);
        }
        if (Object.keys(parsedUsers).length > 0) {
          callback({ userData: parsedUsers });
        } else {
          callback({ error: 'User not found in room' });
        }
      } else {
        callback({ error: 'Room not found for this socket' });
      }
    });

    socket.on('muteAll', ({ roomId, socketId, mute }) => {
      io.to(roomId).emit('requestMuteAll', { roomId, socketId, mute });
    });

    socket.on('send-message', ({ roomId, message, time, userName, socketId, messageId }) => {
      io.to(roomId).emit('response-send-message', { roomId, message, time, userName, socketId, messageId });
    });

    socket.on('edit-message', ({ roomId, messageId, newMessage, socketId }) => {
      io.to(roomId).emit('response-edit-message', {
        roomId,
        messageId,
        newMessage,
        socketId
      });
    });

    socket.on('delete-message', ({ roomId, messageId }) => {
      io.to(roomId).emit('response-delete-message', {
        roomId,
        messageId
      });
    });

    socket.on('disconnect', async () => {
      await handleDisconnection(socket.id);
    });

    async function handleDisconnection(socketId) {
      const roomId = await redisClient.get(`socket:${socketId}`);
      if (!roomId) {
        console.warn(`No room found for socket: ${socketId}`);
        return;
      }

      await redisClient.hDel(`room:${roomId}`, socketId);
      const roomSize = await redisClient.hLen(`room:${roomId}`);
      io.to(roomId).emit('participantCount', { count: roomSize });

      if (roomSize === 0) {
        await redisClient.del(`room:${roomId}`);
      }
      await redisClient.del(`socket:${socketId}`);
      mediaSoupService.cleanup(socketId, io, roomId);
    }
  });

  mediaSoupService.init().catch((error) => {
    console.error('Failed to initialize MediaSoup service:', error);
    process.exit(1);
  });

  // Cleanup Redis connection on server shutdown
  process.on('SIGTERM', async () => {
    await redisClient.quit();
  });
};

module.exports = mediasoupServer;