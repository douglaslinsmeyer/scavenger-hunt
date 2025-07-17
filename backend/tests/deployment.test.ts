import request from 'supertest';

describe('Backend Deployment', () => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  describe('Health Check Endpoint', () => {
    it('should respond with hello world message on /api/health', async () => {
      const response = await request(backendUrl)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Hello from Scavenger Hunt Backend!',
        status: 'healthy',
        timestamp: expect.any(String),
      });
    });

    it('should return detailed health check with verbose flag', async () => {
      const response = await request(backendUrl)
        .get('/api/health?verbose=true')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Hello from Scavenger Hunt Backend!',
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(String),
        version: expect.any(Object),
        runtime: expect.any(Object),
        environment: expect.any(Object),
        system: expect.any(Object),
        dependencies: expect.any(Object),
      });
    });

    it('should include proper CORS headers', async () => {
      const response = await request(backendUrl)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle 404 for unknown routes', async () => {
      const response = await request(backendUrl)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Application Deployment Verification', () => {
    it('should be accessible and running', async () => {
      // Test that the application is deployed and accessible
      const response = await request(backendUrl)
        .get('/api/health')
        .timeout(5000); // 5 second timeout

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should have required environment configuration', async () => {
      const response = await request(backendUrl)
        .get('/api/health')
        .expect(200);

      // Verify the deployment has proper configuration
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });
});