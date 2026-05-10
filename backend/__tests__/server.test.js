/**
 * Server and General API Tests
 * Tests for general server functionality and health endpoints
 */

const request = require('supertest');
const app = require('../server');

describe('Server API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('OK');
    });

    it('should include database connection status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('database');
    });

    it('should include uptime information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('API Versioning', () => {
    it('should mount routes under /api/v1', async () => {
      const response = await request(app)
        .get('/api/v1/ref/kategori')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);
    });
  });

  describe('Content Type', () => {
    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Request Logging', () => {
    it('should process requests without errors', async () => {
      // This test ensures the logging middleware doesn't break requests
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });
});
