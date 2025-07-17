import * as os from 'os';
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
  port: number | string;
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

export function getVersionInfo(): VersionInfo {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8')
    );
    
    return {
      app: packageJson.version || '0.0.0',
      node: process.version,
      dependencies: {
        express: packageJson.dependencies?.express || 'unknown',
        cors: packageJson.dependencies?.cors || 'unknown',
        helmet: packageJson.dependencies?.helmet || 'unknown',
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
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
  };
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

export async function checkDatabaseConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  error?: string;
}> {
  // TODO: Implement actual database connectivity check when Prisma is set up
  // For now, return a mock response
  return {
    status: 'disconnected',
    error: 'Database not configured',
  };
}

export async function checkRedisConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  error?: string;
}> {
  // TODO: Implement actual Redis connectivity check when Redis client is set up
  // For now, return a mock response
  return {
    status: 'disconnected',
    error: 'Redis not configured',
  };
}

export async function getDependenciesInfo(): Promise<DependenciesInfo> {
  const [database, redis] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  return {
    database,
    redis,
  };
}

export async function buildHealthCheckResponse(
  verbose: boolean = false
): Promise<HealthCheckResponse> {
  const baseResponse: HealthCheckResponse = {
    status: 'healthy',
    message: 'Hello from Scavenger Hunt Backend!',
    timestamp: new Date().toISOString(),
  };

  if (!verbose) {
    return baseResponse;
  }

  // Get all health information
  const [version, runtime, environment, system, dependencies] = await Promise.all([
    Promise.resolve(getVersionInfo()),
    Promise.resolve(getRuntimeInfo()),
    Promise.resolve(getEnvironmentInfo()),
    Promise.resolve(getSystemInfo()),
    getDependenciesInfo(),
  ]);

  // Determine overall health status based on dependencies
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (dependencies.database?.status === 'error' || dependencies.database?.status === 'disconnected') {
    // Database is critical, so mark as unhealthy if it's down
    status = 'unhealthy';
  } else if (dependencies.redis?.status === 'error' || dependencies.redis?.status === 'disconnected') {
    // Redis is non-critical, so mark as degraded if it's down
    status = 'degraded';
  }

  return {
    ...baseResponse,
    status,
    version,
    runtime,
    environment,
    system,
    dependencies,
  };
}