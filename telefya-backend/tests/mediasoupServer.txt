const EventEmitter = require('events');
const { leaveRoom } = require('../mediasoupServer2');

describe('leaveRoom', () => {
  let pubClient, io, rooms, roomId, userId, socket1, socket2;

  beforeEach(() => {
    // Mock pubClient
    pubClient = {
      publish: jest.fn(() => Promise.resolve()),
    };
    // Mock io namespace and sockets
    socket1 = new EventEmitter();
    socket1.data = { roomId: 'room1', userId: 'user1' };
    socket1.emit = jest.fn();
    socket2 = new EventEmitter();
    socket2.data = { roomId: 'room1', userId: 'user2' };
    socket2.emit = jest.fn();
    io = {
      of: jest.fn(() => ({
        sockets: new Map([
          ['socket1', socket1],
          ['socket2', socket2],
        ]),
      })),
    };
    // Mock rooms
    rooms = new Map();
    rooms.set('room1', {
      peers: new Map([
        ['user1', { consumers: new Map(), producers: new Map(), transports: new Map() }],
        ['user2', { consumers: new Map(), producers: new Map(), transports: new Map() }],
      ]),
      router: { close: jest.fn() },
      screenSharingUser: undefined,
    });
    // Patch global variables in module
    require('../mediasoupServer2').rooms = rooms;
    require('../mediasoupServer2').setIo(io);
    require('../mediasoupServer2').setPubSub(pubClient, {});
    roomId = 'room1';
    userId = 'user1';
  });

  afterAll(async () => {
    try {
          if (pubsubClient && pubsubClient.quit) await pubsubClient.quit();
          if (subClient && subClient.quit) await subClient.quit();
    } catch (error) {
        
         try {
             if (pubsubClient && pubsubClient.disconnect) await pubsubClient.disconnect();
           if (subClient && subClient.disconnect) await subClient.disconnect();
         } catch (error) {
            console.error('Error during cleanup:', error);
         }
    } 

});

  it('should publish leave event and emit user-left to other users', async () => {
    await leaveRoom(roomId, userId);
    expect(pubClient.publish).toHaveBeenCalledWith('leave', expect.any(String));
    // socket2 should receive user-left, but not socket1
    expect(socket2.emit).toHaveBeenCalledWith('user-left', { userId });
    expect(socket1.emit).not.toHaveBeenCalledWith('user-left', { userId });
  });

  it('should handle errors in pubClient.publish', async () => {
    pubClient.publish.mockRejectedValueOnce(new Error('fail'));
    await expect(leaveRoom(roomId, userId)).rejects.toThrow('fail');
  });
});
