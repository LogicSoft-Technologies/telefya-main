const request = require('supertest');
const { createServer } = require('../index');

describe('Server', () => {
  let app;

  beforeEach(() => {
    app = createServer();
  });

  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'Server is running' });
  });

  it('should handle errors', async () => {
    app.use((req, res, next) => next(new Error('Test error')));
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(500);
    expect(Object.keys(response.body).length>0).toBe(false);
  });
});