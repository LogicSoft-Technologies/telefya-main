const auth_service_login = require('../../services/02-auth_service_login');

describe('Auth Login Service and Endpoint', () => {
  const mockDependencies = {
    query: jest.fn(),
    bcrypt: {
      compare: jest.fn(),
    },
    jwt: {
      sign: jest.fn(),
    },
    accessTokenSecret: 'mock-access-secret',
    refreshTokenSecret: 'mock-refresh-secret',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
    sanitizeInput: jest.fn().mockImplementation((input) => input),
    validateEmail: jest.fn().mockReturnValue(true),
    validatePassword: jest.fn().mockReturnValue(true),
    generateHash: jest.fn().mockImplementation((token) => `hashed-${token}`),
    responseObject: (success, error, payload) => ({ success, error, ...payload }),
    ip: '192.12.0.1',
    userAgent: 'Mozilla/5.0',
    cookies: {},
  };

  const validPayload = {
    email: 'test@example.com',
    password: 'Password123!',
    cookies: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auth_service_login', () => {
    it('should return error for missing email or password', async () => {
      const result = await auth_service_login(
        { email: '', password: '' },
        mockDependencies
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toBe('Email and password are required.');
      expect(result.status).toBe(400);
    });

    it('should return unauthorized if user not found', async () => {
      mockDependencies.query.mockResolvedValueOnce([]);
      const result = await auth_service_login(validPayload, mockDependencies);
      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toBe('Unauthorized: User not found.');
      expect(result.status).toBe(401);
    });

    it('should return unauthorized if password is incorrect', async () => {
      mockDependencies.query.mockResolvedValueOnce([
        { id: 1, email: 'test@example.com', password: 'hashed', role: 'user', user_id: 'abc123' },
      ]);
      mockDependencies.bcrypt.compare.mockResolvedValueOnce(false);

      const result = await auth_service_login(validPayload, mockDependencies);
      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toBe('Unauthorized: Incorrect password.');
      expect(result.status).toBe(401);
    });

    it('should login successfully and return access token and cookie', async () => {
      mockDependencies.query
        .mockResolvedValueOnce([
          { id: 1, email: 'test@example.com', password: 'hashed', role: 'user', user_id: 'abc123' },
        ])
        .mockResolvedValueOnce([]) // No existing refresh tokens
        .mockResolvedValueOnce({ affectedRows: 1 }); // Insert/Update refresh token

      mockDependencies.bcrypt.compare.mockResolvedValueOnce(true);
      mockDependencies.jwt.sign
        .mockReturnValueOnce('mock-access-token') // Access token
        .mockReturnValueOnce('mock-refresh-token'); // Refresh token

      const result = await auth_service_login(validPayload, mockDependencies);

      expect(result.success).toBe(true);
      expect(result.error).toBe(false);
      expect(result.message).toBe('User logged in successfully.');
      expect(result.status).toBe(200);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeUndefined(); // Refresh token is not sent in body

      expect(result.cookie).toEqual({
        name: 'bww_jwt',
        value: 'mock-refresh-token',
        options: expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      });
    });
  });
});
