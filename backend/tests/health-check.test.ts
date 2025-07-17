import request from 'supertest';
import app from '../src/index';
import * as healthCheck from '../src/utils/health-check';

describe('Health Check Endpoint', () => {
  describe('GET /api/health', () => {
    it('should return basic health check without verbose flag', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: expect.any(String),
      });

      // Should not include verbose fields
      expect(response.body.version).toBeUndefined();
      expect(response.body.runtime).toBeUndefined();
      expect(response.body.environment).toBeUndefined();
      expect(response.body.dependencies).toBeUndefined();
      expect(response.body.system).toBeUndefined();
    });

    it('should return basic health check with verbose=false', async () => {
      const response = await request(app)
        .get('/api/health?verbose=false')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: expect.any(String),
      });

      // Should not include verbose fields
      expect(response.body.version).toBeUndefined();
      expect(response.body.runtime).toBeUndefined();
    });

    it('should return detailed health check with verbose=true', async () => {
      const response = await request(app)
        .get('/api/health?verbose=true')
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: expect.any(String),
        version: {
          app: expect.any(String),
          node: expect.any(String),
          dependencies: expect.objectContaining({
            express: expect.any(String),
            cors: expect.any(String),
            helmet: expect.any(String),
          }),
        },
        runtime: {
          uptime: expect.any(Number),
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          },
          pid: expect.any(Number),
        },
        environment: {
          nodeEnv: expect.any(String),
          port: expect.any(Number),
        },
        system: {
          platform: expect.any(String),
          hostname: expect.any(String),
          cpus: expect.any(Number),
          arch: expect.any(String),
          release: expect.any(String),
        },
        dependencies: {
          database: expect.objectContaining({
            status: expect.stringMatching(/^(connected|disconnected|error)$/),
          }),
          redis: expect.objectContaining({
            status: expect.stringMatching(/^(connected|disconnected|error)$/),
          }),
        },
      });
    });

    it('should return 503 status when health is unhealthy', async () => {
      // Mock the buildHealthCheckResponse to return unhealthy status
      jest.spyOn(healthCheck, 'buildHealthCheckResponse').mockResolvedValueOnce({
        status: 'unhealthy',
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
    });

    it('should return 200 status when health is degraded', async () => {
      // Mock the buildHealthCheckResponse to return degraded status
      jest.spyOn(healthCheck, 'buildHealthCheckResponse').mockResolvedValueOnce({
        status: 'degraded',
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('degraded');
    });

    it('should handle errors gracefully', async () => {
      // Mock the buildHealthCheckResponse to throw an error
      jest.spyOn(healthCheck, 'buildHealthCheckResponse').mockRejectedValueOnce(
        new Error('Test error')
      );

      const response = await request(app)
        .get('/api/health')
        .expect(500);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp: expect.any(String),
        error: expect.any(String),
      });
    });
  });
});

describe('Health Check Utilities', () => {
  describe('getVersionInfo', () => {
    it('should return version information', () => {
      const versionInfo = healthCheck.getVersionInfo();
      
      expect(versionInfo).toMatchObject({
        app: expect.any(String),
        node: expect.stringMatching(/^v\d+\.\d+\.\d+/),
        dependencies: expect.any(Object),
      });
    });
  });

  describe('getRuntimeInfo', () => {
    it('should return runtime information', () => {
      const runtimeInfo = healthCheck.getRuntimeInfo();
      
      expect(runtimeInfo).toMatchObject({
        uptime: expect.any(Number),
        memory: {
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
        },
        pid: expect.any(Number),
      });
      
      expect(runtimeInfo.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(runtimeInfo.memory.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return environment information', () => {
      const envInfo = healthCheck.getEnvironmentInfo();
      
      expect(envInfo).toMatchObject({
        nodeEnv: expect.any(String),
        port: expect.any(Number),
      });
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', () => {
      const systemInfo = healthCheck.getSystemInfo();
      
      expect(systemInfo).toMatchObject({
        platform: expect.any(String),
        hostname: expect.any(String),
        cpus: expect.any(Number),
        arch: expect.any(String),
        release: expect.any(String),
      });
      
      expect(systemInfo.cpus).toBeGreaterThan(0);
    });
  });

  describe('checkDatabaseConnection', () => {
    it('should return disconnected status when database is not configured', async () => {
      const dbStatus = await healthCheck.checkDatabaseConnection();
      
      expect(dbStatus).toMatchObject({
        status: 'disconnected',
        error: 'Database not configured',
      });
    });
  });

  describe('checkRedisConnection', () => {
    it('should return disconnected status when Redis is not configured', async () => {
      const redisStatus = await healthCheck.checkRedisConnection();
      
      expect(redisStatus).toMatchObject({
        status: 'disconnected',
        error: 'Redis not configured',
      });
    });
  });

  describe('buildHealthCheckResponse', () => {
    it('should return basic response when verbose is false', async () => {
      const response = await healthCheck.buildHealthCheckResponse(false);
      
      expect(response).toMatchObject({
        status: 'healthy',
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: expect.any(String),
      });
      
      expect(response.version).toBeUndefined();
      expect(response.runtime).toBeUndefined();
    });

    it('should return detailed response when verbose is true', async () => {
      const response = await healthCheck.buildHealthCheckResponse(true);
      
      expect(response).toMatchObject({
        status: expect.any(String),
        message: 'Hello from Scavenger Hunt Backend!',
        timestamp: expect.any(String),
        version: expect.any(Object),
        runtime: expect.any(Object),
        environment: expect.any(Object),
        system: expect.any(Object),
        dependencies: expect.any(Object),
      });
    });

    it('should set status to degraded when non-critical dependencies are down', async () => {
      // Mock Redis as down (non-critical)
      jest.spyOn(healthCheck, 'checkRedisConnection').mockResolvedValueOnce({
        status: 'error',
        error: 'Connection failed',
      });
      
      // Mock database as connected
      jest.spyOn(healthCheck, 'checkDatabaseConnection').mockResolvedValueOnce({
        status: 'connected',
        latency: 5,
      });

      const response = await healthCheck.buildHealthCheckResponse(true);
      
      expect(response.status).toBe('degraded');
    });

    it('should set status to unhealthy when critical dependencies are down', async () => {
      // Mock database as down (critical)
      jest.spyOn(healthCheck, 'checkDatabaseConnection').mockResolvedValueOnce({
        status: 'error',
        error: 'Connection failed',
      });

      const response = await healthCheck.buildHealthCheckResponse(true);
      
      expect(response.status).toBe('unhealthy');
    });
  });
});