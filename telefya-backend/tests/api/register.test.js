const request = require('supertest');
const { createServer, startServer } = require('../../index');
const { query } = require('../../config/db');
const { count } = require('console');
const { hash } = require('crypto');

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation((pwd, hash) =>
    pwd === 'Password123!' && hash === 'hashed' ? true : false
  ),
  hash: jest.fn().mockImplementation((pwd) => `hashed-${pwd}`),
}));


describe('Server', () => {
  const validPayload = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john3.doe@example.com',
    phone_number: '1234567898',
    password: 'ValidPass123!',
    country: 'USA',
    state: 'CA',
    city: 'Los Angeles',
    date_of_birth: '1990-01-01',
    country_code: '+1',
  };
  let app;
  let server;

  beforeAll(() => {
    app = createServer();
    const started = startServer(app, 0); // Use port 0 to let the OS assign a free port
    server = started.server;
  });

  afterAll((done) => {
    server.close(done); // Close the server after all tests
    
  });
 
  it('Should return 400 for missing fields', async () => {
    const response = await request(app).post('/api/v2/auth/register').send({}); // No payload
    
    expect(response.status).toBe(400); // Adjust based on your expected status
   // expect(response.body).toHaveProperty('message', 'All fields are required.');
  })
  

  it('should register a user', async () => {
    const response = await request(app).post('/api/v2/auth/register').send(validPayload);
    
    if (response.body.message === "Email or phone number already exists." ){
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email or phone number already exists.');
      return;
    }
   
    expect(response.status).toBe(200); 
    expect(response.body).toHaveProperty('message', 'User registered successfully. Please verify your email.');
  });


});