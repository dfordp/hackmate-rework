import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prsimadb';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { addViewedProfile, redisClient } from '@/lib/redis';

// Define schema for unlike request (removed userId - comes from auth)
const unlikeSchema = z.object({
  unlikedUserId: z.string(),
});

// POST handler for registering an unlike (passing on a profile)
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(req);
    if (!userId) {
      logger.securityEvent('Unauthorized unlike attempt', undefined, {
        endpoint: '/api/unlike'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { unlikedUserId } = unlikeSchema.parse(body);

    // Create a cache key for this operation to prevent duplicates
    const cacheKey = `unlike:${userId}:${unlikedUserId}`;
    
    // Check if this operation was recently performed (debounce)
    const recentlyProcessed = await redisClient.get(cacheKey);
    if (recentlyProcessed) {
      return NextResponse.json({
        success: true,
        message: 'Profile already marked as passed',
      });
    }
    
    // Set a temporary marker to prevent duplicate requests (30 second TTL)
    await redisClient.set(cacheKey, '1', { EX: 30 });

    // Find any existing like from this user to the unliked user
    const existingLike = await prismaClient.match.findFirst({
      where: {
        userAId: userId,
        userBId: unlikedUserId,
        mutual: false
      },
    });

    // If a like exists, delete it
    if (existingLike) {
      await prismaClient.match.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Track this profile as viewed in Redis cache
      await addViewedProfile(userId, unlikedUserId);

      // Clear the temporary marker
      await redisClient.del(cacheKey);

      return NextResponse.json({
        success: true,
        message: 'Like removed successfully',
      });
    } else {
      // If no like exists, create a view record to track that this profile was seen
      // First check if a view already exists
      const existingView = await prismaClient.view.findFirst({
        where: {
          userAId: userId,
          userBId: unlikedUserId,
        },
      });

      // If no view exists, create one
      if (!existingView) {
        await prismaClient.view.create({
          data: {
            userAId: userId,
            userBId: unlikedUserId,
          },
        });
        
        // Also track this profile as viewed in Redis cache for faster future lookups
        await addViewedProfile(userId, unlikedUserId);
        
        // Invalidate relevant user list caches that might need to exclude this viewed profile
        const cachePattern = `users:fullset:*userId*${userId}*excludeViewed*true*`;
        const keys = await redisClient.keys(cachePattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }

      // Clear the temporary marker
      await redisClient.del(cacheKey);

      return NextResponse.json({
        success: true,
        message: 'Profile marked as passed',
      });
    }
  } catch (error) {
    logger.error('Error processing unlike', {
      error: (error as Error).message,
      endpoint: '/api/unlike'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process unlike' },
      { status: 500 }
    );
  }
}