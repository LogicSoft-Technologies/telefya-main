const request = require('supertest');
const { createServer, startServer, stopServer } = require('../../index');

// Required dependency mocks
jest.mock('../../config/db', () => ({
  query: jest.fn().mockImplementation((sql, params) => {
    if (sql.includes('SELECT') && params[0] === 'test@example.com') {
      return Promise.resolve([
        {
          id: 1,
          email: 'test@example.com',
          user_id: 'abc123', // Important: auth_service_login uses user_id
          password: 'hashed',
          role: 'user',
        },
      ]);
    }
    if (sql.includes('SELECT')) {
      return Promise.resolve([]);
    }
    if (sql.includes('INSERT')) {
      return Promise.resolve({ affectedRows: 1 });
    }
    return Promise.resolve([]);
  }),
  pool: { end: jest.fn() },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation((pwd, hash) =>
    pwd === 'Password123!' && hash === 'hashed' ? true : false
  ),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest
    .fn()
    .mockImplementationOnce(() => 'mock-access-token')
    .mockImplementationOnce(() => 'mock-refresh-token'),
}));

// Mock lib functions used in dependencyObject
jest.mock('../../lib/sanitize', () => jest.fn((input) => input));
jest.mock('../../lib/validateEmail', () => jest.fn(() => true));
jest.mock('../../lib/validatePassword', () => jest.fn(() => true));
jest.mock('../../lib/hashGen', () => jest.fn((t) => `hashed-${t}`));
jest.mock('../../lib/responseObject', () => (success, error, payload) => ({
  success,
  error,
  ...payload,
}));

describe('Auth Login Service and Endpoint', () => {
  let app;
  let server;

  const validPayload = {
    email: 'test@example.com',
    password: 'Password123!',
    cookies: {},
  };

  beforeAll(async () => {
    app = createServer();
    const started = startServer(app, 0); // random port
    server = started.server;
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v2/auth/login', () => {
    it('should login successfully via endpoint', async () => {
      const response = await request(app)
        .post('/api/v2/auth/login')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBe('mock-refresh-token');

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v2/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Unauthorized: User not found.');
    });
  });
});
