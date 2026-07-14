const request = require('supertest');
const { createServer, startServer } = require('../../index');


describe('Password Reset Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = createServer();
    const started = startServer(app, 0);
    server = started.server;
  });

  afterAll((done) => {
    server.close(done);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request password reset successfully', async () => {
    const response = await request(app)
      .post('/api/v2/auth/request-password-reset')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      error: false,
      message: 'Password request successful, OTP sent to your email',
      status: 200,
    });
  });

  it('should reset password successfully', async () => {
    const response = await request(app)
      .post('/api/v2/auth/reset-password')
      .send({ email: 'test@example.com', token: '123456', password: 'NewPass123!' });
      console.log(response.body)
    expect(response.body).toEqual({
      success: true,
      error: false,
      message: 'Password reset successful.',
      status: 200,
    });
  });

  it('should fail to request password reset with invalid email', async () => {
    const response = await request(app)
      .post('/api/v2/auth/request-password-reset')
      .send({ email: 'invalid@example.com' });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: true,
      message: 'User not found',
      status: 404,
    });
  });

  it('should fail with week password', async () => {
    const response = await request(app)
      .post('/api/v2/auth/reset-password')
      .send({ email: 'test@example.com', token: '123455', password: 'NewPass' });
   
    expect(response.body.error).toBe(true);
  });


});

// Mock dependencies
jest.mock('../../config/db', () => ({
    query: jest.fn().mockImplementation((sql, params) => {
      // Mock user lookup
      if (
        sql.includes('SELECT') &&
        sql.includes('users') &&
        params[0] === 'test@example.com' 
     

      ) {
        return Promise.resolve([{ id: 1, email: 'test@example.com' }]);
      }
  
       // Mock OTP verification — invalid OTP
       if (
        params[1] !== '123456' &&
        sql.includes('SELECT') &&
        sql.includes('otps') &&
        sql.includes('users') &&
        params[0] === 'test@example.com'
       
       
      ) {
        console.log("Invalid OTP or email.")
        return Promise.resolve([]); // No OTP found
     
      }
      // Mock OTP verification — valid OTP
      if (  
        params[1] === '123456'&&
        sql.includes('SELECT') &&
        sql.includes('otps') &&
        sql.includes('users') &&
        params[0] === 'test@example.com' 
      
      ) {
        return Promise.resolve([{ otp: '123456', user: 1, id: 1 }]);
      }
  
     
  
      // Debug fallback (optional)
     // console.warn('Unhandled SQL:', sql, 'Params:', params);
      return Promise.resolve([]);
    }),
    pool: { end: jest.fn() },
  }));
  

jest.mock('../../services/sendEmail', () => jest.fn());
jest.mock('../../lib/responseObject', () => (success, error, data) => ({
  success,
  error,
  message: data.message,
  status: data.status,
}));

jest.mock('../../lib/randomStr', () => ({
    
    randomStr: jest.fn().mockReturnValue('123456'),
  }));
  
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));

