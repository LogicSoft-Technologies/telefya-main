// breakoutRoomManager.js - Add to server
const { v4: uuidv4 } = require('uuid');

class BreakoutRoomManager {
  constructor() {
    this.breakoutSessions = new Map(); // mainRoomId -> session data
  }

  /**
   * Create breakout rooms for a main room
   */
  createBreakoutRooms(mainRoomId, config, hostId) {
    const { numberOfRooms, assignmentMethod, duration, allowParticipantsToSwitch } = config;

    const breakoutRooms = [];
    for (let i = 0; i < numberOfRooms; i++) {
      breakoutRooms.push({
        id: `${mainRoomId}-breakout-${i + 1}`,
        name: `Breakout Room ${i + 1}`,
        participants: [],
        maxParticipants: 50,
        createdAt: new Date(),
        isActive: false
      });
    }

    this.breakoutSessions.set(mainRoomId, {
      hostId,
      breakoutRooms,
      assignments: new Map(), // userId -> breakoutRoomId
      isOpen: false,
      duration,
      startTime: null,
      allowParticipantsToSwitch: allowParticipantsToSwitch || false
    });

    return breakoutRooms;
  }

  /**
   * Assign participants to breakout rooms
   */
  assignParticipants(mainRoomId, assignments) {
    const session = this.breakoutSessions.get(mainRoomId);
    if (!session) {
      throw new Error('Breakout session not found');
    }

    assignments.forEach(assignment => {
      session.assignments.set(assignment.userId, assignment.breakoutRoomId);
      
      // Add to breakout room participants
      const room = session.breakoutRooms.find(r => r.id === assignment.breakoutRoomId);
      if (room && !room.participants.includes(assignment.userId)) {
        room.participants.push(assignment.userId);
      }
    });

    return true;
  }

  /**
   * Open all breakout rooms
   */
  openBreakoutRooms(mainRoomId) {
    const session = this.breakoutSessions.get(mainRoomId);
    if (!session) {
      throw new Error('Breakout session not found');
    }

    session.isOpen = true;
    session.startTime = new Date();
    session.breakoutRooms.forEach(room => {
      room.isActive = true;
    });

    return session.breakoutRooms;
  }

  /**
   * Close all breakout rooms
   */
  closeBreakoutRooms(mainRoomId) {
    const session = this.breakoutSessions.get(mainRoomId);
    if (!session) {
      throw new Error('Breakout session not found');
    }

    session.isOpen = false;
    session.breakoutRooms.forEach(room => {
      room.isActive = false;
      room.participants = [];
    });

    return true;
  }

  /**
   * Get user's assigned breakout room
   */
  getUserAssignment(mainRoomId, userId) {
    const session = this.breakoutSessions.get(mainRoomId);
    if (!session) return null;

    const breakoutRoomId = session.assignments.get(userId);
    if (!breakoutRoomId) return null;

    const room = session.breakoutRooms.find(r => r.id === breakoutRoomId);
    return room;
  }

  /**
   * Get all breakout rooms for main room
   */
  getBreakoutRooms(mainRoomId) {
    const session = this.breakoutSessions.get(mainRoomId);
    return session ? session.breakoutRooms : [];
  }

  /**
   * Check if user is in breakout room
   */
  isUserInBreakout(userId, breakoutRoomId) {
    for (const [mainRoomId, session] of this.breakoutSessions) {
      const room = session.breakoutRooms.find(r => r.id === breakoutRoomId);
      if (room && room.participants.includes(userId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Delete breakout session
   */
  deleteSession(mainRoomId) {
    this.breakoutSessions.delete(mainRoomId);
  }

  /**
   * Get session info
   */
  getSession(mainRoomId) {
    return this.breakoutSessions.get(mainRoomId);
  }
}

// Singleton instance
const breakoutManager = new BreakoutRoomManager();

module.exports = { breakoutManager };







