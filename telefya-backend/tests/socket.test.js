const { createRoomManager } = require('../socket');

describe('RoomManager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = createRoomManager();
  });

  it('should add user to new room', () => {
    const roomId = 'room1';
    const socketId = 'socket1';
    const userData = { userId: 'user1' };

    const room = roomManager.joinRoom(roomId, socketId, userData);
    
    expect(room.size).toBeGreaterThan(0)
    expect(Object.values (room.get(socketId)) ).toContain(roomId)
    
  });

  it('should add user to existing room', () => {
    const roomId = 'room1';
    roomManager.joinRoom(roomId, 'socket1', { userId: 'user1' });
    const room = roomManager.joinRoom(roomId, 'socket2', { userId: 'user2' });
    
    expect((room).size).toBe(2);
    expect(room.get('socket2').userId).toBe('user2');
  });

  it('should remove user and keep room', () => {
    const roomId = 'room1';
    roomManager.joinRoom(roomId, 'socket1', { userId: 'user1' });
    roomManager.joinRoom(roomId, 'socket2', { userId: 'user2' });
    
    const room = roomManager.leaveRoom(roomId, 'socket1');
    expect((room).size).toBe(1);
    expect(room.get('socket2')).toBeDefined();
  });

  it('should delete empty room', () => {
    const roomId = 'room1';
    roomManager.joinRoom(roomId, 'socket1', { userId: 'user1' });
    roomManager.leaveRoom(roomId, 'socket1');
    
    expect(roomManager.rooms.has(roomId)).toBe(false);
  });

  it('should update user status', () => {
    const roomId = 'room1';
    roomManager.joinRoom(roomId, 'socket1', { userId: 'user1', micStatus: true });
    roomManager.updateUserStatus(roomId, 'socket1', 'micStatus', false);
    
    const room = roomManager.rooms.get(roomId);
    expect(room.get('socket1').micStatus).toBe(false);
  });

  
});