import { NextRequest, NextResponse } from 'next/server';
import { buildHealthCheckResponse } from '@/utils/health-check';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verbose = searchParams.get('verbose') === 'true';
    const healthCheck = await buildHealthCheckResponse(verbose);
    
    // Set appropriate HTTP status code based on health status
    let statusCode = 200;
    if (healthCheck.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (healthCheck.status === 'degraded') {
      statusCode = 200; // Still return 200 for degraded to not trigger unnecessary alerts
    }
    
    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'production' ? 'Internal error' : (error as Error).message,
      },
      { status: 500 }
    );
  }
}