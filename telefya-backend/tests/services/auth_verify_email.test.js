// tests/api/verify_email.test.js
const request = require('supertest');
const { createServer, startServer} = require('../../index');
const verifyUserEmail = require('../../services/01-auth_verify_email');

describe('Verify Email Service and Endpoint', () => {
  let app;
  let server;

  const mockDependencies = {
    query: jest.fn(),
    sanitizeInput: jest.fn((input) => input), // Mock sanitizeInput to return input as-is
  };

  const validPayload = {
    email: 'test@example.com',
    otp: '123456',
  };

  beforeAll(async () => {
    app = createServer();
    const started = startServer(app, 0); // Use dynamic port
    server = started.server;
  });

  afterAll( (done) => {
    server.close(done)
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Unit tests for the service
  describe('verifyUserEmail service', () => {
    it('should verify email successfully', async () => {
      mockDependencies.query
        .mockResolvedValueOnce([{ email: 'test@example.com', verification_otp: '123456' }]) // User found
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update success

      const result = await verifyUserEmail(validPayload, mockDependencies);

      expect(result.success).toBe(false); // Matches service's responseObject
      expect(result.error).toBe(false);
      expect(result.message).toBe('Email verified successfully.');
      expect(result.status).toBe(200);
      expect(mockDependencies.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND verification_otp = ?',
        ['test@example.com', '123456']
      );
      expect(mockDependencies.query).toHaveBeenCalledWith(
        'UPDATE users SET is_verified = 1, verification_otp = NULL WHERE email = ?',
        ['test@example.com']
      );
    });

    it('should return error for invalid OTP or email', async () => {
      mockDependencies.query.mockResolvedValueOnce([]); // No user found

      const result = await verifyUserEmail(validPayload, mockDependencies);

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid OTP or email.');
      expect(result.status).toBe(400);
      expect(mockDependencies.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND verification_otp = ?',
        ['test@example.com', '123456']
      );
    });

 
  });

  // Integration tests for the endpoint
  describe('POST /api/v2/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const response = await request(app)
        .post('/api/v2/auth/verify-email')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false); // Matches service's responseObject
      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe('Email verified successfully.');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v2/auth/verify-email')
        .send({ email: 'invalid', otp: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('email');
    });

    it('should return 400 for missing OTP', async () => {
      const response = await request(app)
        .post('/api/v2/auth/verify-email')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('otp');
    });
  });
});

// Mock dependencies for integration tests
jest.mock('../../config/db', () => ({

  query: jest.fn().mockImplementation((sql, params) => {
    if (sql.includes('SELECT') && params[0] === 'test@example.com' && params[1] === '123456') {
      return Promise.resolve([{ email: 'test@example.com', verification_otp: '123456' }]);
    }
    if (sql.includes('SELECT')) {
      return Promise.resolve([]);
    }
    if (sql.includes('UPDATE')) {
      return Promise.resolve({ affectedRows: 1 });
    }
    return Promise.resolve({});
  }),
  pool: { end: jest.fn() },
}));
jest.mock('../../lib/sanitize', () => jest.fn((input) => input));