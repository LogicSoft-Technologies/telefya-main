jest.mock('redisClient'); // adjust import path if needed

const { leaveRoom, setIo, setPubSub, rooms } = require('../mediasoupServer2');
const EventEmitter = require('events');

describe('MediasoupServer2 · leaveRoom', () => {
  let mockPubClient, mockSubClient, io, socket1, socket2;

  beforeEach(() => {
    // Create mocked Pub/Sub clients

    const redisClient = require('redisClient');
    mockPubClient = redisClient.createClient();
    mockSubClient = redisClient.createClient();

    // Spy on publish for validation
    jest.spyOn(mockPubClient, 'publish');

    // Setup socket mocks
    socket1 = new EventEmitter();
    socket1.data = { roomId: 'room1', userId: 'user1' };
    socket1.emit = jest.fn();

    socket2 = new EventEmitter();
    socket2.data = { roomId: 'room1', userId: 'user2' };
    socket2.emit = jest.fn();

    io = {
      of: jest.fn(() => ({
        sockets: new Map([
          ['s1', socket1],
          ['s2', socket2],
        ]),
      })),
    };

    // Inject mocks into your server module
    setIo(io);
    setPubSub(mockPubClient, mockSubClient);

    // Initialize rooms with two users
    rooms.clear();
    rooms.set('room1', {
      peers: new Map([
        ['user1', { consumers: new Map(), producers: new Map(), transports: new Map() }],
        ['user2', { consumers: new Map(), producers: new Map(), transports: new Map() }],
      ]),
      router: { close: jest.fn() },
      screenSharingUser: undefined,
    });
  });

  afterAll(async () => {
    // Cleanly disconnect Redis mocks
    await mockPubClient.quit();
    await mockSubClient.quit();
  });

  it('publishes leave event and notifies other users', async () => {
    await leaveRoom('room1', 'user1');

    expect(mockPubClient.publish).toHaveBeenCalledWith('leave', expect.stringContaining('"userId":"user1"'));

    expect(socket2.emit).toHaveBeenCalledWith('user-left', { userId: 'user1' });
    expect(socket1.emit).not.toHaveBeenCalledWith('user-left', { userId: 'user1' });
  });

  it('propagates Redis publish errors properly', async () => {
    mockPubClient.publish.mockRejectedValueOnce(new Error('Redis error'));
    await expect(leaveRoom('room1', 'user1')).rejects.toThrow('Redis error');
  });
});
