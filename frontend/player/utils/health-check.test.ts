import {
  getVersionInfo,
  getRuntimeInfo,
  getEnvironmentInfo,
  getSystemInfo,
  getBuildInfo,
  checkBackendConnection,
  buildHealthCheckResponse,
} from './health-check';

// Mock fetch for backend connection tests
global.fetch = jest.fn();

describe('Player Frontend Health Check Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVersionInfo', () => {
    it('should return version information', () => {
      const versionInfo = getVersionInfo();
      
      expect(versionInfo).toMatchObject({
        app: expect.any(String),
        node: expect.stringMatching(/^v\d+\.\d+\.\d+/),
        dependencies: expect.objectContaining({
          next: expect.any(String),
          react: expect.any(String),
          'react-dom': expect.any(String),
        }),
      });
    });
  });

  describe('getRuntimeInfo', () => {
    it('should return runtime information', () => {
      const runtimeInfo = getRuntimeInfo();
      
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
      const envInfo = getEnvironmentInfo();
      
      expect(envInfo).toMatchObject({
        nodeEnv: expect.any(String),
      });
    });

    it('should include API_URL environment variable', () => {
      process.env.API_URL = 'http://test-api.com';
      process.env.WS_URL = 'ws://test-ws.com';
      
      const envInfo = getEnvironmentInfo();
      
      expect(envInfo.API_URL).toBe('http://test-api.com');
      expect(envInfo.WS_URL).toBe('ws://test-ws.com');
      
      // Clean up
      delete process.env.API_URL;
      delete process.env.WS_URL;
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', () => {
      const systemInfo = getSystemInfo();
      
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

  describe('getBuildInfo', () => {
    it('should return build information', () => {
      const buildInfo = getBuildInfo();
      
      expect(buildInfo).toBeDefined();
      // Build info fields may be undefined if env vars are not set
    });

    it('should include build environment variables when set', () => {
      process.env.BUILD_ID = 'test-build-123';
      process.env.BUILD_TIME = '2025-01-16T12:00:00Z';
      process.env.GIT_COMMIT = 'abc123def';
      
      const buildInfo = getBuildInfo();
      
      expect(buildInfo).toEqual({
        buildId: 'test-build-123',
        buildTime: '2025-01-16T12:00:00Z',
        gitCommit: 'abc123def',
      });
      
      // Clean up
      delete process.env.BUILD_ID;
      delete process.env.BUILD_TIME;
      delete process.env.GIT_COMMIT;
    });
  });

  describe('checkBackendConnection', () => {
    it('should return connected status when backend is healthy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await checkBackendConnection();
      
      expect(result).toMatchObject({
        status: 'connected',
        latency: expect.any(Number),
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should return error status when backend returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await checkBackendConnection();
      
      expect(result).toMatchObject({
        status: 'error',
        latency: expect.any(Number),
        error: 'Backend returned 500',
      });
    });

    it('should return disconnected status when connection fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkBackendConnection();
      
      expect(result).toMatchObject({
        status: 'disconnected',
        error: 'Network error',
      });
    });

    it('should timeout after 5 seconds', async () => {
      // Mock AbortController
      const mockAbort = jest.fn();
      const mockSignal = { aborted: false };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => ({
        abort: mockAbort,
        signal: mockSignal as any,
      }));

      // Mock setTimeout to capture the timeout callback
      const timeoutCallbacks: Array<() => void> = [];
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        timeoutCallbacks.push(callback);
        return 123 as any; // Return a mock timer ID
      });

      // Mock clearTimeout
      jest.spyOn(global, 'clearTimeout').mockImplementation(() => {});

      // Mock fetch to throw an abort error when called
      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        // Simulate the timeout by calling the abort
        if (timeoutCallbacks.length > 0) {
          mockSignal.aborted = true;
          timeoutCallbacks[0]();
        }
        return Promise.reject(new Error('Request timeout'));
      });

      const result = await checkBackendConnection();
      
      expect(result.status).toBe('disconnected');
      expect(result.error).toBe('Request timeout');
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
      
      // Restore mocks
      jest.restoreAllMocks();
    });
  });

  describe('buildHealthCheckResponse', () => {
    it('should return basic response when verbose is false', async () => {
      const response = await buildHealthCheckResponse(false);
      
      expect(response).toMatchObject({
        status: 'healthy',
        message: 'Player app is running',
        timestamp: expect.any(String),
      });
      
      expect(response.version).toBeUndefined();
      expect(response.runtime).toBeUndefined();
      expect(response.dependencies).toBeUndefined();
    });

    it('should return detailed response when verbose is true', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const response = await buildHealthCheckResponse(true);
      
      expect(response).toMatchObject({
        status: expect.any(String),
        message: 'Player app is running',
        timestamp: expect.any(String),
        version: expect.any(Object),
        runtime: expect.any(Object),
        environment: expect.any(Object),
        system: expect.any(Object),
        build: expect.any(Object),
        dependencies: {
          backend: expect.any(Object),
        },
      });
    });

    it('should set status to unhealthy when backend is down', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const response = await buildHealthCheckResponse(true);
      
      expect(response.status).toBe('unhealthy');
      expect(response.dependencies?.backend?.status).toBe('disconnected');
    });
  });
});