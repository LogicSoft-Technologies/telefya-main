// __mocks__/redisClient.js
const EventEmitter = require('events');
// becuse redis use event
class MockRedisClient extends EventEmitter {
  
  constructor() {
    this.eventdata = {};
    super();
    this.isConnected = false;
  }

  on(/* event, handler */) {
    return super.on.apply(this, arguments);
  }

  connect() {
    this.isConnected = true;
    return Promise.resolve();
  }

  publish(channel, message) {
    this.eventdata[channel] = message;
    return Promise.resolve();
  }

  quit() {
    this.isConnected = false;
    this.eventdata = {};
    return Promise.resolve();
  }

  disconnect() {
    this.isConnected = false;
    this.eventdata = {};
    return Promise.resolve();
  }
}

module.exports = {
  createClient: () => new MockRedisClient(),
};
