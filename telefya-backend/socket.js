const { createClient } = require('redis');

const createRoomManager = () => {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));
  client.connect().catch((err) => console.error('Redis Connection Error:', err));

  const socketIdToRoomId = {};

  const joinRoom = async (roomId, socketId, userData) => {
    try {
      const newUser = {
        id: socketId,
        userName: userData.userName || `User${Math.random().toString(36).substr(2, 5)}`,
        userId: userData.userId,
        micStatus: userData.micStatus ?? false,
        videoStatus: userData.videoStatus ?? true,
        isPresenter: !(await client.exists(`room:${roomId}`)), // First user becomes presenter
        screenSharingStatus: false,
        presenterControlAudio: false,
        presenterControlVideo: false,
        room: roomId,
      };

      await client.hSet(`room:${roomId}`, socketId, JSON.stringify(newUser));
      await client.hSet(`socketId-roomId`, socketId, roomId);

      const users = await client.hVals(`room:${roomId}`);
      return new Map(users.map((user) => [JSON.parse(user).id, JSON.parse(user)]));
    } catch (err) {
      console.error('joinRoom Error:', err);
      throw err;
    }
  };

  const leaveRoom = async (roomId, socketId) => {
    try {
      const userStr = await client.hGet(`room:${roomId}`, socketId);
      if (!userStr) return null;
      const removed_user = JSON.parse(userStr);
      await client.hDel(`room:${roomId}`, socketId);
      await client.hDel('socketId-roomId', socketId)

      const users = await client.hVals(`room:${roomId}`);
      if (users.length === 0) {
        await client.del(`room:${roomId}`);
        return { room: null, removed_user };
      }

      return { room: new Map(users.map((user) => [JSON.parse(user).id, JSON.parse(user)])), removed_user };
    } catch (err) {
      console.error('leaveRoom Error:', err);
      throw err;
    }
  };

  const updateUserStatus = async (roomId, userId, field, status) => {
    try {
      const userStr = await client.hGet(`room:${roomId}`, userId);
      if (!userStr) return { room: null, updatedUser: null };

      const user = JSON.parse(userStr);
      user[field] = status;
      await client.hSet(`room:${roomId}`, userId, JSON.stringify(user));

      const users = await client.hVals(`room:${roomId}`);
      return {
        room: new Map(users.map((user) => [JSON.parse(user).id, JSON.parse(user)])),
        updatedUser: user,
      };
    } catch (err) {
      console.error('updateUserStatus Error:', err);
      throw err;
    }
  };

  const getPresenter = async (roomId) => {
    try {
      const users = await client.hVals(`room:${roomId}`);
      if (users.length === 0) return null;
      return users.map((user) => JSON.parse(user)).find((user) => user.isPresenter) || null;
    } catch (err) {
      console.error('getPresenter Error:', err);
      throw err;
    }
  };

  const getRoom = async (roomId) => {
    try {
      const users = await client.hVals(`room:${roomId}`);
      return users.length > 0
        ? new Map(users.map((user) => [JSON.parse(user).id, JSON.parse(user)]))
        : null;
    } catch (err) {
      console.error('getRoom Error:', err);
      throw err;
    }
  };

  return { joinRoom, leaveRoom, updateUserStatus, getPresenter, getRoom, socketIdToRoomId };
};








const setupSocket = (io, roomManager = createRoomManager()) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id, 'IP:', socket.request.headers['x-forwarded-for']);
    io.emit('has_connection', { socketId: socket.id });

    socket.on('join-room', async ({ roomId, userId, userName }) => {
      try {
        socket.join(roomId);
        const room = await roomManager.joinRoom(roomId, socket.id, { userId, userName });
      
        const output = {
          roomUsers: Array.from(room.values()),
          currentUserId: socket.id,
          isPresenter: room.get(socket.id).isPresenter,
        };

        io.to(roomId).emit('room-users', output);

        const presenter = await roomManager.getPresenter(roomId);
        if (presenter?.screenSharingStatus) {
          socket.emit('screen-sharing-update', {
            userId: presenter.id,
            status: true,
            user: presenter,
          });
        }
      } catch (err) {
        console.error('join-room Error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    /**
     * Event: request-streams
     * Description: When a client requests to receive streams from other participants in the room.
     * Payload: { roomId, senderId, user }
     */
    socket.on('request-streams', async ({ roomId, senderId, user }) => {
      const room = await roomManager.getRoom(roomId);
      if (!room) return;
      io.to(roomId).emit('send-streams', {
        receiverId: senderId,
        user,
      });
    });

    socket.on('user_response_its_video_toggle_by_presenter', ({ roomId, ...data }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      io.to(roomId).emit('user_response_its_video_toggle_by_presenter_received', data);
    });

    socket.on('user_response_its_audio_toggle_by_presenter', ({ roomId, ...data }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      io.to(roomId).emit('user_response_its_audio_toggle_by_presenter_received', data);
    });

    socket.on('signal', async ({ receiverId, signal, senderId, roomId, isScreen, isPresenter }) => {
      const room = await roomManager.getRoom(roomId);
      console.log(senderId, "SIGNAL FROM PEER", isScreen, room);
      if (!room) return;
      const user = room.get(senderId);
      io.to(receiverId).emit('signal', { senderId, signal, isScreen, isPresenter, user });
    });

    socket.on('signal-file', async ({ receiverId, signal, senderId, roomId }) => {
      const room = await roomManager.getRoom(roomId);
      if (!room) return;
      const user = room.get(senderId);
      io.to(receiverId).emit('signal-file-response', { senderId, signal, receiverId, user, roomId });
    });

    socket.on('send-message', ({ roomId, message, time, userName, userId, messageId }) => {
      io.to(roomId).emit('response-send-message', { roomId, message, time, userName, userId, messageId });
    });

    socket.on('edit-message', ({ roomId, messageId, newMessage, userId }) => {
      io.to(roomId).emit('response-edit-message', {
        roomId,
        messageId,
        newMessage,
        userId,
      });
    });

    socket.on('delete-message', ({ roomId, messageId }) => {
      io.to(roomId).emit('response-delete-message', {
        roomId,
        messageId,
      });
    });

    socket.on('toggle-mic', async ({ userId, status, roomId, isPresenter, condition }) => {
      const { room, updatedUser } = await roomManager.updateUserStatus(roomId, userId, 'micStatus', status);
      if (isPresenter) {
        await roomManager.updateUserStatus(roomId, userId, 'presenterControlAudio', true);
      }
      if (room) {
        io.to(roomId).emit('toggle-mic-update', { userId, status, user: updatedUser, condition });
      }
    });

    socket.on('toggle-video', async ({ userId, status, roomId, isPresenter, condition }) => {
      const { room, updatedUser } = await roomManager.updateUserStatus(roomId, userId, 'videoStatus', status);
      if (isPresenter) {
        await roomManager.updateUserStatus(roomId, userId, 'presenterControlVideo', true);
      }
      if (room) {
        io.to(roomId).emit('toggle-video-update', { userId, status, user: updatedUser, isPresenter, condition });
      }
    });

    socket.on('screen-sharing-status', async ({ userId, status, roomId }) => {
      const { room, updatedUser } = await roomManager.updateUserStatus(roomId, userId, 'screenSharingStatus', status);
      if (room) {
        io.to(roomId).emit('screen-sharing-update', { userId, status, user: updatedUser, roomId });
      }
    });

    socket.on('request-feedback-control-media', ({ roomId, userId, type, enabled, reason }) => {
      io.to(roomId).emit('response-feedback-control-media', {
        roomId,
        userId,
        type,
        enabled,
        reason,
      });
    });

    socket.on('request-control-media', ({ roomId, userId, type, enabled }) => {
      io.to(roomId).emit('response-control-media', {
        roomId,
        userId,
        type,
        enabled,
      });
    });

    socket.on('request-raise-hand', ({ roomId, userId, userName, hasRaiseHand }) => {
      io.to(roomId).emit('response-raise-hand', {
        roomId,
        userId,
        userName,
        hasRaiseHand,
      });
    });

    socket.on('request-peer-knockout', ({ roomId, userId }) => {
      io.to(roomId).emit('response-peer-knockout', {
        roomId,
        userId,
      });
    });

    socket.on('request-presenter-screen', ({ presenterId, roomId, receiverId }) => {
      io.to(roomId).emit('response-presenter-screen', {
        roomId,
        receiverId,
      });
    });

    socket.on('request-peer-close-camera', ({ roomId, receiverId }) => {
      io.to(roomId).emit('peer-close-camera', {
        roomId,
        receiverId,
      });
    });

    socket.on('user-leave', ({ userSocketId, roomId }) => {
      io.to(roomId).emit('response-to-user-leave', { userSocketId, roomId });
    });

    socket.on('disconnect', async () => {
      try {
        const roomId = roomManager.socketIdToRoomId[socket.id];
        if (roomId) {
          const { room, removed_user } = await roomManager.leaveRoom(roomId, socket.id);
          if (room) {
            io.to(roomId).emit('user-disconnected', removed_user);
            const presenter = await roomManager.getPresenter(roomId);
            if (presenter?.id === socket.id && presenter.screenSharingStatus) {
              io.to(roomId).emit('screen-sharing-update', { userId: socket.id, status: false });
            }
          }
        }
        console.log('Client disconnected:', socket.id);
      } catch (err) {
        console.error('disconnect Error:', err);
      }
    });
  });
};

module.exports = { setupSocket, createRoomManager };


/*const rooms = new Map();
const socketIdToRoomId = {};

const createRoomManager = () => {
  const joinRoom = (roomId, socketId, userData) => {
    const newUser = {
      id: socketId,
      userName: userData.userName || `User${Math.random().toString(36).substr(2, 5)}`,
      userId: userData.userId,
      micStatus: userData.micStatus ?? false,
      videoStatus: userData.videoStatus ?? true,
      isPresenter: !rooms.has(roomId), // First user becomes presenter
      screenSharingStatus: false,
      presenterControlAudio: false,
      presenterControlVideo: false,
      room: roomId,
    };

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map([[socketId, newUser]]));
    } else {
      rooms.get(roomId).set(socketId, newUser);
    }
    socketIdToRoomId[socketId] = roomId; // Store the mapping of socketId to roomId
    
    return rooms.get(roomId);
  };

  const leaveRoom = (roomId, socketId) => {
    const room = rooms.get(roomId);
    if (!room) return null;
    const removed_user = room.get(socketId)
    room.delete(socketId);
    if (room.size === 0) rooms.delete(roomId);
    return {room, removed_user};
  };

  const updateUserStatus = (roomId, userId, field, status) => {
    const room = rooms.get(roomId);
    if (room?.has(userId)) {
      room.get(userId)[field] = status;
      return { room, updatedUser: room.get(userId) };
    }
    return { room: null, updatedUser: null };
  };

  const getPresenter = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return null;
    return Array.from(room.values()).find(user => user.isPresenter) || null;
  };

  return { joinRoom, leaveRoom, updateUserStatus, rooms, getPresenter, socketIdToRoomId };
};




const setupSocket = (io, roomManager = createRoomManager()) => {
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    io.emit('has_connection', { socketId: socket.id });


    socket.on('join-room', ({ roomId, userId, userName }) => {
  
      if (!rooms.has(roomId)) {
        socket.join(roomId);
      } 
      const room = roomManager.joinRoom(roomId, socket.id, { userId, userName });
      //
      console.log(room, socket.id, "roomManager.joinRoom");                               
      const output  = {
        roomUsers: Array.from(room.values()),
        currentUserId: socket.id,
        isPresenter: room.get(socket.id).isPresenter,
      }

      io.to(roomId).emit('room-users', output );

      const presenter = roomManager.getPresenter(roomId);
      if (presenter?.screenSharingStatus) {
        socket.emit('screen-sharing-update', {
          userId: presenter.id,
          status: true,
          user: presenter,
        });
      }
    });
    

    socket.on('request-streams', ({ roomId, senderId, user }) => {
      const room = roomManager.rooms.get(roomId);
      if (!room) return;
      io.to(roomId).emit('send-streams', {
          receiverId: senderId,//send the stream to requester
          user
      });
    
    });

    socket.on('user_response_its_video_toggle_by_presenter', (data) => {
      const room = roomManager.rooms.get(data.roomId);
      if (!room) return;
      io.to(data.roomId).emit('user_response_its_video_toggle_by_presenter_received', data);
    
    });

    socket.on('user_response_its_audio_toggle_by_presenter', (data) => {
      const room = roomManager.rooms.get(data.roomId);
    //  
      if (!room) return;
      io.to(data.roomId).emit('user_response_its_audio_toggle_by_presenter_received', data);
    
    });

    socket.on('signal', ({ receiverId, signal, senderId, roomId, isScreen, isPresenter }) => {
      //
      const room = roomManager.rooms.get(roomId);
      if (!room) return;
      console.log(senderId, "asakfbdfdf", isScreen)
      const user = room.get(senderId);
      io.to(receiverId).emit('signal', { senderId, signal, isScreen, isPresenter, user });
    });


    
    socket.on('signal-file', ({ receiverId, signal, senderId, roomId }) => {
     // console.log('signal-file', { receiverId, senderId, roomId });
      const room = roomManager.rooms.get(roomId);
      if (!room) return;
      const user = room.get(senderId);
      console.log(receiverId, roomId)
      io.to(receiverId).emit('signal-file-response', { senderId, signal,receiverId, user, roomId });
    });


    
     socket.on('send-message', ({  roomId, message, time, userName, userId, messageId }) => {
        console.log("message", userId)
        io.to(roomId).emit('response-send-message', { roomId, message, time, userName, userId, messageId });
    });

    // Add these to your socket event handlers
socket.on('edit-message', ({ roomId, messageId, newMessage, userId }) => {
  io.to(roomId).emit('response-edit-message', {
    roomId,
    messageId,
    newMessage,
    userId
  });
});

socket.on('delete-message', ({ roomId, messageId }) => {
  io.to(roomId).emit('response-delete-message', {
    roomId,
    messageId
  });
});

    socket.on('toggle-mic', ({ userId, status, roomId, isPresenter, condition }) => {
      const { room, updatedUser } = roomManager.updateUserStatus(roomId, userId, 'micStatus', status);
      if (isPresenter) {
        roomManager.updateUserStatus(roomId, userId, 'presenterControlAudio', true);
      }
      if (room) {
        io.to(roomId).emit('toggle-mic-update', { userId, status, user: updatedUser, condition });
      }
    });

    socket.on('toggle-video', ({ userId, status, roomId, isPresenter, condition }) => {
      const { room, updatedUser } = roomManager.updateUserStatus(roomId, userId, 'videoStatus', status);
      if (isPresenter) {
        roomManager.updateUserStatus(roomId, userId, 'presenterControlVideo', true);
      }
      if (room) {
        io.to(roomId).emit('toggle-video-update', { userId, status, user: updatedUser, isPresenter, condition });
      }
    });

    socket.on('screen-sharing-status', ({ userId, status, roomId }) => {
      const { room, updatedUser } = roomManager.updateUserStatus(roomId, userId, 'screenSharingStatus', status);
      if (room) {
        io.to(roomId).emit('screen-sharing-update', { userId, status, user: updatedUser, roomId });
      }
    });
 

    //Media control event

  socket.on('request-feedback-control-media', ({
          roomId,
          userId,
          type,
          enabled,
          reason

        }) => {
       
  io.to( roomId).emit('response-feedback-control-media', {
          roomId,
          userId,
          type,
          enabled,
          reason
        });
});

  socket.on('request-control-media', ({
          roomId,
          userId,
          type,
          enabled,
        }) => {
  io.to( roomId).emit('response-control-media', {
          roomId,
          userId,
          type,
          enabled,
        });
});

socket.on('request-raise-hand', ({
          roomId,
          userId,
          userName,
          hasRaiseHand,
        }) => {
  io.to( roomId).emit('response-raise-hand', {
          roomId,
          userId,
          userName,
          hasRaiseHand
        });
});
     
  socket.on('request-peer-knockout', ({
          roomId,
          userId,
       
        }) => {
  io.to( roomId).emit('response-peer-knockout', {
          roomId,
          userId,
         
        });
});
     



  socket.on('request-presenter-screen', ({ presenterId, roomId, receiverId }) => {
  io.to( roomId).emit('response-presenter-screen', {
    roomId,
    receiverId
  });
});

  socket.on('request-peer-close-camera', ({ roomId, receiverId }) => {
  io.to( roomId).emit('peer-close-camera', {
    roomId,
    receiverId
  });
});

socket.on('user-leave', ({userSocketId, roomId})=>{
      io.to(roomId).emit('response-to-user-leave', {userSocketId, roomId})
    })
    

    socket.on('disconnect', () => {
      let rooms = roomManager.rooms;
      const roomId = roomManager.socketIdToRoomId[socket.id];  
      

      //for (const [roomId_, roomSockets] of roomManager.rooms) {
        // Check if the socketId exists in the roomSockets Map
      //   if (roomSockets.has(socket.id)) {
        //  roomId  = roomId_
         // 
          //break; // Exit loop once we find the room
       // }
      //}
        
      
      if (roomId) {
        const {room,removed_user} = roomManager.leaveRoom(roomId, socket.id);
        if (room) {
          io.to(roomId).emit('user-disconnected', removed_user);
          const presenter = roomManager.getPresenter(roomId);
          if (presenter?.id === socket.id && presenter.screenSharingStatus) {
            io.to(roomId).emit('screen-sharing-update', { userId: socket.id, status: false });
          }
        }
      }
    });
  });
};

module.exports = { setupSocket, createRoomManager };
*/