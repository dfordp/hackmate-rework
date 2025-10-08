// =============================================================================
// Health Check API Endpoint
// =============================================================================
// Purpose: Provide a simple health check endpoint for Docker/Kubernetes
// Used by Docker HEALTHCHECK and load balancers to monitor service status
// =============================================================================

import { NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';
import prismaClient from '@/lib/prsimadb';
import { logger } from '@/lib/logger';

/**
 * GET /api/health
 * Returns 200 OK if service is healthy, 503 if unhealthy
 * Checks:
 * - Next.js server is responding
 * - Redis connection is alive
 * - Database connection is alive
 */
export async function GET() {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      server: 'ok',
      redis: 'unknown',
      database: 'unknown'
    }
  };

  try {
    // Check Redis connection
    try {
      await redisClient.ping();
      healthCheck.checks.redis = 'ok';
    } catch (error) {
      logger.error('Redis health check failed', { 
        error: (error as Error).message,
        endpoint: '/api/health'
      });
      healthCheck.checks.redis = 'error';
      healthCheck.status = 'degraded';
    }

    // Check database connection
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      healthCheck.checks.database = 'ok';
    } catch (error) {
      logger.error('Database health check failed', { 
        error: (error as Error).message,
        endpoint: '/api/health'
      });
      healthCheck.checks.database = 'error';
      healthCheck.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    logger.error('Health check endpoint failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      endpoint: '/api/health'
    });
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      }, 
      { status: 503 }
    );
  }
}
