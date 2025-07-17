import os from 'os';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  version?: VersionInfo;
  runtime?: RuntimeInfo;
  environment?: EnvironmentInfo;
  dependencies?: DependenciesInfo;
  system?: SystemInfo;
  build?: BuildInfo;
}

export interface VersionInfo {
  app: string;
  node: string;
  dependencies: Record<string, string>;
}

export interface RuntimeInfo {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  pid: number;
}

export interface EnvironmentInfo {
  nodeEnv: string;
  [key: string]: any;
}

export interface DependenciesInfo {
  [key: string]: {
    status: 'connected' | 'disconnected' | 'error';
    latency?: number;
    error?: string;
  };
}

export interface SystemInfo {
  platform: string;
  hostname: string;
  cpus: number;
  arch: string;
  release: string;
}

export interface BuildInfo {
  buildId?: string;
  buildTime?: string;
  gitCommit?: string;
}

export function getVersionInfo(): VersionInfo {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    );
    
    return {
      app: packageJson.version || '0.0.0',
      node: process.version,
      dependencies: {
        next: packageJson.dependencies?.next || 'unknown',
        react: packageJson.dependencies?.react || 'unknown',
        'react-dom': packageJson.dependencies?.['react-dom'] || 'unknown',
        axios: packageJson.dependencies?.axios || 'unknown',
      },
    };
  } catch (error) {
    console.error('Error reading package.json:', error);
    return {
      app: '0.0.0',
      node: process.version,
      dependencies: {},
    };
  }
}

export function getRuntimeInfo(): RuntimeInfo {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const usedMem = memUsage.heapUsed + memUsage.external;
  
  return {
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100 * 100) / 100,
    },
    pid: process.pid,
  };
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const publicEnvVars: EnvironmentInfo = {
    nodeEnv: process.env.NODE_ENV || 'development',
  };

  // Add all NEXT_PUBLIC_ environment variables
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      publicEnvVars[key] = process.env[key] as string;
    }
  });

  return publicEnvVars;
}

export function getSystemInfo(): SystemInfo {
  return {
    platform: os.platform(),
    hostname: os.hostname(),
    cpus: os.cpus().length,
    arch: os.arch(),
    release: os.release(),
  };
}

export function getBuildInfo(): BuildInfo {
  return {
    buildId: process.env.BUILD_ID,
    buildTime: process.env.BUILD_TIME,
    gitCommit: process.env.GIT_COMMIT,
  };
}

export async function checkBackendConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  error?: string;
}> {
  const backendUrl = process.env.BACKEND_BASE_URL || 'http://localhost/api';
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${backendUrl}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'connected',
        latency,
      };
    } else {
      return {
        status: 'error',
        latency,
        error: `Backend returned ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function getDependenciesInfo(): Promise<DependenciesInfo> {
  const backend = await checkBackendConnection();
  
  return {
    backend,
  };
}

export async function buildHealthCheckResponse(
  verbose: boolean = false
): Promise<HealthCheckResponse> {
  const baseResponse: HealthCheckResponse = {
    status: 'healthy',
    message: 'Player app is running',
    timestamp: new Date().toISOString(),
  };

  if (!verbose) {
    return baseResponse;
  }

  // Get all health information
  const [version, runtime, environment, system, build, dependencies] = await Promise.all([
    Promise.resolve(getVersionInfo()),
    Promise.resolve(getRuntimeInfo()),
    Promise.resolve(getEnvironmentInfo()),
    Promise.resolve(getSystemInfo()),
    Promise.resolve(getBuildInfo()),
    getDependenciesInfo(),
  ]);

  // Determine overall health status based on dependencies
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (dependencies.backend?.status === 'error' || dependencies.backend?.status === 'disconnected') {
    // Backend is critical for the player app, so mark as unhealthy if it's down
    status = 'unhealthy';
  }

  return {
    ...baseResponse,
    status,
    version,
    runtime,
    environment,
    system,
    build,
    dependencies,
  };
}