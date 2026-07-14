const { createWorker } = require('mediasoup');
const { config } = require('./config/mediaSoupConfig');
const rooms = new Map();

let worker;
let io;
let pubClient;
let subClient;

function setIo(socketIo) {
  io = socketIo;
}

function setPubSub(pub, sub) {
  pubClient = pub;
  subClient = sub;
}

async function setupMediasoup(pub, sub) {
  pubClient = pub;
  subClient = sub;
  try {
    if (!pubClient.isOpen) await pubClient.connect();
    if (!subClient.isOpen) await subClient.connect();
  } catch (err) {
    console.error('Failed to connect Mediasoup Redis clients:', err);
    process.exit(1);
  }

  worker = await createWorker(config.mediasoup.worker);

  worker.on('died', () => {
    console.error('Mediasoup worker died, exiting process...');
    process.exit(1);
  });

  subClient.on('error', (err) => {
    console.error('Mediasoup Redis subClient error:', err);
  });

// 3. Update the Redis subscription handler in setupMediasoup

  const channelList  = [
    'join',
    'new-producer',
    'screen-share-started',
    'screen-share-stopped',
    'leave'
  ];

  await subClient.subscribe(channelList, (channel, message) => {
    try {
    
      if (Buffer.isBuffer(message)) {
        message = message.toString('utf8');
       
      }

       if (Buffer.isBuffer(channel)) {
        channel = channel.toString('utf8');
     
      }
     
    
      if(channelList.indexOf(message) !== -1){  
        let tmpChannel = channel;
        channel = message;
        message = tmpChannel;
      }

      

      if (typeof message !== 'string' || (!message.startsWith('{') && !message.startsWith('['))) {
        console.warn(`Received non-JSON message on channel ${channel}:`, message);
        return;
      }
      const data = JSON.parse(message);
      const { roomId, userId } = data;
      
      if (!rooms.has(roomId)) return;
      switch (channel) {
        case 'join':
          console.log(`Join event`)
          handleRemoteJoin(data);
          break;
        case 'new-producer':
            console.log(`new-producer event`)
          handleRemoteNewProducer(data);
          break;
        case 'screen-share-started':
          handleRemoteScreenShareStarted(data);
          break;
        case 'screen-share-stopped':
          handleRemoteScreenShareStopped(data);
          break;
        case 'leave':
          handleRemoteLeave(data);
          break;
        default:
          console.warn(`Unknown Redis channel: ${channel}`);
      }
    } catch (err) {
      console.error(`Error processing Redis message on channel ${channel}:`, err);
    }
  }, true);

}




async function handleRemoteJoin({ roomId, userId, userName, producers }) {
  try {
    await createRoom(roomId);
    const room = rooms.get(roomId);

    if (!room.peers.has(userId)) {
      room.peers.set(userId, {
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        userName,
        rtpCapabilities: room.router.rtpCapabilities
      });
    }
 
    // for (const [_, sock] of io.sockets) {
    //   if (sock?.data?.roomId === roomId && sock?.data?.userId !== userId) {
    //     sock.emit('existing-producers', {
    //       producers: producers.map(p => ({ ...p, userId, userName })),
    //       screenSharingUser: room.screenSharingUser || null,
    //     });
    //   }
    // }


   for (const [uid, peer] of room.peers) {
    for (const producer of peer.producers.values()) {
     const producerObject =  {
        producerId: producer.id,
        producer: producer,
        kind: producer.kind,
        isScreen: producer.appData?.isScreen || false,
        userId: producer.appData?.userId,
        userName: producer.appData?.userName,
        appData: producer.appData,
        screenSharingUser: room.screenSharingUser || null,
      };

      io.to(roomId).emit('existing-producers', producerObject);

    }
  }


  } catch (error) {
    console.error(`Error handling remote join for room ${roomId} and user ${userId}:`, error);
  }
}







async function handleRemoteNewProducer({ roomId, userId, producerId, kind, isScreen, appData }) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  for (const [uid, peer] of room.peers) {
    for (const producer of peer.producers.values()) {
      console.log(producer.id, producerId, "producer ids finding", appData);
       io.to(roomId).emit('new-producer', { 
        userId, 
        producerId: producer.id, 
        kind, 
        appData,
        uid
      });
    }
  }  

  // for (const [socketId, sock] of io.sockets) {
  //   if (sock?.data?.roomId === roomId && sock?.data?.userId !== userId) {
  //     sock.emit('new-producer', { 
  //       userId, 
  //       producerId, 
  //       kind, 
  //       appData
  //     });
  //   }
  // }

  if (isScreen) {
    room.screenSharingUser = userId;
  }
}









async function handleRemoteScreenShareStarted({ roomId, userId, producerId }) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.screenSharingUser = userId;
  for (const [_, sock] of io.sockets) {
    if (sock?.data?.roomId === roomId && sock?.data?.userId !== userId) {
      sock.emit('screen-share-started', { userId, producerId });
    }
  }
}

async function handleRemoteScreenShareStopped({ roomId, userId }) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.screenSharingUser = undefined;
  for (const [_, sock] of io.sockets) {
    if (sock?.data?.roomId === roomId && sock?.data?.userId !== userId) {
      sock.emit('screen-share-stopped', { userId });
    }
  }
}

async function handleRemoteLeave({ roomId, userId }) {
  cleanupPeer(roomId, userId);
  // Notify all other users in the room that this user has left
  const room = rooms.get(roomId);
  if (room && io) {
    // Use the correct way to access sockets depending on your Socket.IO version and namespace usage
    const sockets = io.sockets;
    for (const sock of sockets.values()) {
      if (sock?.data?.roomId === roomId && sock?.data?.userId !== userId) {
        sock.emit('user-left', { userId });
      }
    }
  }
}



/**
 * createRoom - Function for creation meeting room
 * type peer = {
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
      userName,
      userId,
      rtpCapabilities: null
    }
  @description-  every user is a member of peer, and each  member save it own transports, producers, consumers
 * @roomId {string} room id
 * @return {Promise<new Map<string new Map<string, peer>>>} string: rooId, string: userId
 */
async function createRoom(roomId) {
  if (!rooms.has(roomId)) {
    const router = await worker.createRouter(config.mediasoup.router);
    rooms.set(roomId, {
      router,
      peers: new Map(),
      screenSharingUser: undefined
    });
  }
  return rooms.get(roomId);
}



async function joinRoom(socket, roomId, userId, userName = '') {
  await createRoom(roomId);
  const room = rooms.get(roomId);
  const currentUser = {
      transports: new Map(),//your two transports: send and recv
      producers: new Map(), //Your two producers: audio and vidoe
      consumers: new Map(), //your consumers, use to consume
      userName,
      userId,
      isHost: room?.peers?.size === 0,
      rtpCapabilities: null
    };


  if (!room.peers.has(userId)) {
    room.peers.set(userId, currentUser);
  }

   
// check who is host 
let thierIsHost = false;
for (const [userId, user] of room.peers){
   if(user.isHost){
     thierIsHost = true;
     break;
   }
}


if (!thierIsHost) {
  currentUser.isHost = true;  
}

  socket.data.roomId = roomId;
  socket.data.userId = userId;
  socket.data.userName = userName;

  try {
    await pubClient.publish(
      'join',
      JSON.stringify({ roomId, userId, userName, producers: getExistingProducers(room) })
    );
  } catch (err) {
    console.error(`Error publishing join event for user ${userId} in room ${roomId}:`, err);
    throw err;
  }
  return {rtpCapabilities:room.router.rtpCapabilities, isHost: currentUser.isHost};
}





async function getRTCCapacity(roomId) { 
  await createRoom(roomId);
  const room = rooms.get(roomId);
  return room.router.rtpCapabilities;
}



function getExistingProducers(room) {
  const producers = new Map();
  for (const [uid, peer] of room.peers) {
    for (const producer of peer.producers.values()) {
      producers.set(producer.id, {
        producerId: producer.id,
        producer: producer,
        kind: producer.kind,
        isScreen: producer.appData?.isScreen || false,
        userId: producer.appData?.userId,
        userName: producer.appData?.userName,
        appData: producer.appData
      });
    }
  }
  return producers;
}

async function createTransport(roomId, userId, direction) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');

  const peer = room.peers.get(userId);
  if (!peer) throw new Error('Peer not found');

  const transport = await room.router.createWebRtcTransport(config.mediasoup.webRtcTransport);

  peer.transports.set(transport.id, transport);

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'closed') {
      transport.close();
    }
  });

  transport.on('close', () => {
    peer.transports.delete(transport.id);
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
    sctpParameters: transport.sctpParameters
  };
}

async function connectTransport(roomId, userId, transportId, dtlsParameters) {
  const room = rooms.get(roomId);
  if (!room) {
    console.error(`connectTransport: Room ${roomId} not found`);
    throw new Error('Room not found');
  }

  const peer = room.peers.get(userId);
  if (!peer) {
    console.error(`connectTransport: Peer ${userId} not found in room ${roomId}`);
    throw new Error('Peer not found');
  }

  const transport = peer.transports.get(transportId);
  if (!transport) {
    console.error(`connectTransport: Transport ${transportId} not found for user ${userId} in room ${roomId}`);
    throw new Error('Transport not found');
  }

  // Check if transport is already connected or connecting
  if (transport.dtlsState === 'connected') {
    console.log(`connectTransport: Transport ${transportId} already connected, skipping`);
    return;
  }
  if (transport.dtlsState === 'connecting') {
    console.log(`connectTransport: Transport ${transportId} is connecting, skipping`);
    return;
  }

  try {
    await transport.connect({ dtlsParameters });
  } catch (err) {
    console.error(`connectTransport: Error connecting transport ${transportId}:`, err.message);
    throw err;
  }
}





async function  produce(roomId, transportId, kind, rtpParameters, appData = {}) {
  const room = rooms.get(roomId);
  const { userId, userName, isScreen } = appData;
  if (!room) throw new Error('Room not found');

  const peer = room.peers.get(userId); 
  if (!peer) throw new Error('Peer not found');

  const transport = peer.transports.get(transportId);
  if (!transport) throw new Error('Send transport not found');

  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData
  });
  
  peer.producers.set(producer.id, producer);

  try {
    await pubClient.publish(
      'new-producer',
      JSON.stringify({ 
        roomId, 
        producerId: producer.id, 
        kind, 
        isScreen: isScreen || false,
        userId,
        userName,
        appData
      })
    );
  } catch (err) {
    console.error(`Error publishing new-producer event for user ${userId} in room ${roomId}:`, err);
    throw err;
  }


  if (isScreen) {
    room.screenSharingUser = userId;
    try {
      await pubClient.publish(
        'screen-share-started',
        JSON.stringify({ roomId, userId, producerId: producer.id })
      );
    } catch (err) {
      console.error(`Error publishing screen-share-started event for user ${userId} in room ${roomId}:`, err);
    }
  }



  producer.on('transportclose', () => {

    try {
      producer.close();
    } catch (err) {
      console.warn('Error closing producer:', err);
    }
    peer.producers.delete(producer.id);

    if (isScreen && room.screenSharingUser === userId) {
      room.screenSharingUser = undefined;
      pubClient.publish(
        'screen-share-stopped',
        JSON.stringify({ roomId, userId })
      ).catch(err => {
        console.error(`Error publishing screen-share-stopped on transport close:`, err);
      });
    }
  });

  producer.on('close', () => {
    peer.producers.delete(producer.id);
    
    // Clean up screen sharing if this was a screen producer
    if (isScreen && room.screenSharingUser === userId) {
      room.screenSharingUser = undefined;
      pubClient.publish(
        'screen-share-stopped',
        JSON.stringify({ roomId, userId })
      ).catch(err => {
        console.error(`Error publishing screen-share-stopped on producer close:`, err);
      });
    }
  });

  return producer.id;
}


async function stopScreenShare(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.screenSharingUser !== userId) return;

  const peer = room.peers.get(userId);
  if (!peer) return;

  for (const [id, producer] of peer.producers) {
    if (producer.appData?.isScreen) {
      try {
        producer.close();
      } catch (err) {
        console.warn('Error closing screen share producer:', err);
      }
      peer.producers.delete(id);
    }
  }

  room.screenSharingUser = undefined;

  try {
    await pubClient.publish(
      'screen-share-stopped',
      JSON.stringify({ roomId, userId })
    );
  } catch (err) {
    console.error(`Error publishing screen-share-stopped event for user ${userId} in room ${roomId}:`, err);
  }
}




async function stopConsumerScreenSharing(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.screenSharingUser === userId) return;

  const peer = room.peers.get(userId);
  if (!peer) return;

  for (const [id, consumer] of peer.consumers) {
    if (consumer.appData?.isScreen) {
      try {
        consumer.close();
      } catch (err) {
        console.warn('Error closing screen share consumer:', err);
      }
      peer.consumers.delete(id);
    }
  }


}





async function consume(roomId, userId, transportId, producerId, rtpCapabilities, appData) {
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  const peer = room.peers.get(userId);
  if (!peer) {
    console.error(`consume: Peer ${userId} not found in room ${roomId}`);
    throw new Error('Peer not found');
  }
 
  const transport = peer.transports.get(transportId);
  if (!transport) {
    console.error(`consume: Transport ${transportId} not found for user ${userId} in room ${roomId}`);
    throw new Error('Transport not found');
  }

  const producerData = getExistingProducers(room).get(producerId);

  if (!producerData) {
    console.error(`consume: Producer ${producerId} not found in room ${roomId}`);
    throw new Error('Producer not found');
  }

  const producer = producerData.producer;

  // Don't consume your own producer
  if (producer.appData?.userId === userId) {
    console.log(`consume: Skipping self-consumption for user ${userId}, producer ${producerId}`);
  }
  
  if (!room.router.canConsume({ producerId: producer?.id, rtpCapabilities })) {
    console.error(`consume: Cannot consume producer ${producerId} with given rtpCapabilities`);
    throw new Error('Cannot consume with given rtpCapabilities');
  }

  try {
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });
    
    peer.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      console.log(`Consumer ${consumer.id} closed due to transport close`);
      peer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      console.log(`Consumer ${consumer.id} closed due to producer close`);
      peer.consumers.delete(consumer.id);
    });

    consumer.on('trackended', () => {
      console.log(`Consumer ${consumer.id} track ended`);
    });

    // CRITICAL FIX: Build appData from producer's appData, not from request
    const finalAppData = {
      ...producer.appData,  // Get all data from producer (includes correct isScreen)
      isScreen: producer.appData?.isScreen || false,  // Explicitly ensure isScreen is set
    };

    console.log(`[consume] Created consumer ${consumer.id}:`, {
      producerId,
      kind: consumer.kind,
      isScreen: finalAppData.isScreen,
      producerUserId: producer.appData?.userId,
      consumerUserId: userId
    });

    // Return with producer's appData, not request appData
    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      isScreen: finalAppData.isScreen,
      userId: producer.appData?.userId,
      track: consumer.track,
      userName: producer.appData?.userName,
      appData: finalAppData  // ← FIXED: Use producer's appData
    };
  } catch (err) {
    console.error(`consume: Error creating consumer for producer ${producerId}:`, err.message);
    throw err;
  }
}


async function resumeConsumer(roomId, userId, consumerId) {
  try {
    const room = rooms.get(roomId);
    if (!room) {
      console.error(`resumeConsumer: Room ${roomId} not found`);
      throw new Error('Room not found');
    }

    const peer = room.peers.get(userId);
    if (!peer) {
      console.error(`resumeConsumer: Peer ${userId} not found in room ${roomId}`);
      throw new Error('Peer not found');
    }

    if (peer.consumers.size === 0) {
      console.error(`resumeConsumer: No consumers found for user ${userId} in room ${roomId}`);
      throw new Error('No consumers found');
    }

    const consumer = peer.consumers.get(consumerId);
    if (!consumer) {
      console.error(`resumeConsumer: Consumer ${consumerId} not found for user ${userId} in room ${roomId}`);
      throw new Error('Consumer not found');
    }

    await consumer.resume();
    
      
  } catch (error) {
    console.error('Error resuming consumer:', error);
    throw error;
  }
}

function cleanupPeer(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const peer = room.peers.get(userId);
  if (!peer) return;

  for (const [, consumer] of peer.consumers) {
    try {
      consumer.close();
    } catch (err) {
      console.warn('Error closing consumer during cleanup:', err);
    }
  }

  for (const [, producer] of peer.producers) {
    try {
      producer.close();
    } catch (err) {
      console.warn('Error closing producer during cleanup:', err);
    }
  }

  for (const [, transport] of peer.transports) {
    try {
      transport.close();
    } catch (err) {
      console.warn('Error closing transport during cleanup:', err);
    }
  }

  room.peers.delete(userId);

  if (room.screenSharingUser === userId) {
    room.screenSharingUser = undefined;
    try {
      pubClient.publish(
        'screen-share-stopped',
        JSON.stringify({ roomId, userId })
      );
    } catch (err) {
      console.error(`Error publishing screen-share-stopped during cleanup for user ${userId} in room ${roomId}:`, err);
    }
  }

  if (room.peers.size === 0) {
    try {
      room.router.close();
      rooms.delete(roomId);
    } catch (err) {
      console.warn('Error closing router during cleanup:', err);
    }
  }
}

async function leaveRoom(roomId, userId) {
    cleanupPeer(roomId, userId);
  try {
    await pubClient.publish(
      'leave',
      JSON.stringify({ roomId, userId })
    );
    return true;
  } catch (err) {
    console.error(`Error publishing leave event for user ${userId} in room ${roomId}:`, err);
    throw err;
  }
}

async function savePeerRtpCapabilities(roomId, userId, rtpCapabilities) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');

  const peer = room.peers.get(userId);
  if (!peer) throw new Error('Peer not found');

  peer.rtpCapabilities = rtpCapabilities;
}

module.exports = {
  setupMediasoup,
  setIo,
  setPubSub,
  createRoom,
  joinRoom,
  createTransport,
  connectTransport,
  produce,
  consume,
  stopScreenShare,
  leaveRoom,
  savePeerRtpCapabilities,
  rooms,
  getExistingProducers,
  getRTCCapacity,
  resumeConsumer,
  stopConsumerScreenSharing
};