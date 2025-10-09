import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prsimadb';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { redisClient} from '@/lib/redis';

// Define schema for like request (removed userId - comes from auth)
const likeSchema = z.object({
  likedUserId: z.string(),
});

// POST handler for registering a like
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(req);
    if (!userId) {
      logger.securityEvent('Unauthorized like attempt', undefined, {
        endpoint: '/api/like'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { likedUserId } = likeSchema.parse(body);

    // Prevent liking oneself
    if (userId === likedUserId) {
      return NextResponse.json(
        { error: 'Cannot like yourself' },
        { status: 400 }
      );
    }

    // Create a cache key for this operation to prevent duplicates
    const cacheKey = `like:${userId}:${likedUserId}`;
    
    // Check if this operation was recently performed (debounce)
    const recentlyProcessed = await redisClient.get(cacheKey);
    if (recentlyProcessed) {
      // Parse the previously stored result to maintain consistent response
      const previousResult = JSON.parse(recentlyProcessed);
      return NextResponse.json(previousResult);
    }
    
    // Check if there's already a like from this user to the other user
    const existingUserLike = await prismaClient.match.findFirst({
      where: {
        userAId: userId,
        userBId: likedUserId,
      },
    });
    
    // If user already liked this profile, return the existing like
    if (existingUserLike) {
      const response = {
        isMatch: existingUserLike.mutual,
        like: {
          id: existingUserLike.id,
          userAId: existingUserLike.userAId,
          userBId: existingUserLike.userBId,
          createdAt: existingUserLike.createdAt,
        },
      };
      
      // Cache the result for 30 seconds
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 30 });
      
      return NextResponse.json(response);
    }

    // Check if the other user has already liked this user (potential match)
    const existingLike = await prismaClient.match.findFirst({
      where: {
        userAId: likedUserId,
        userBId: userId,
        mutual: false
      },
    });

    // If other user already liked this user, create a mutual match
    if (existingLike) {
      // Update the existing like to be mutual
      const match = await prismaClient.match.update({
        where: {
          id: existingLike.id,
        },
        data: {
          mutual: true
        },
        include: {
          userA: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              contactInfo: true,
            },
          },
          userB: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              contactInfo: true,
            },
          },
        },
      });

      // Prepare response with match information
      const response = {
        isMatch: true,
        match: {
          id: match.id,
          users: [match.userA, match.userB],
          createdAt: match.createdAt,
        },
      };
      
      // Cache the result for 30 seconds
      await redisClient.set(cacheKey, JSON.stringify(response), { EX: 30 });
      
      // Invalidate matches cache for both users
      await redisClient.del(`matches:${userId}`);
      await redisClient.del(`matches:${likedUserId}`);
      
      // Return match information to trigger the match dialog
      return NextResponse.json(response);
    }

    // If no existing like from the other user, create a new like entry
    const like = await prismaClient.match.create({
      data: {
        userAId: userId,
        userBId: likedUserId,
        mutual: false
      },
    });

    // Prepare response
    const response = {
      isMatch: false,
      like: {
        id: like.id,
        userAId: like.userAId,
        userBId: like.userBId,
        createdAt: like.createdAt,
      },
    };
    
    // Cache the result for 30 seconds
    await redisClient.set(cacheKey, JSON.stringify(response), { EX: 30 });
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error processing like', {
      error: (error as Error).message,
      endpoint: '/api/like'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing a like
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const url = new URL(req.url);
    const likedUserId = url.searchParams.get('likedUserId');
    if (!likedUserId) {
      return NextResponse.json({ error: 'likedUserId is required' }, { status: 400 });
    }
    
    // Find the like to delete
    const existingLike = await prismaClient.match.findFirst({
      where: {
        OR: [
          {
            userAId: userId,
            userBId: likedUserId,
          },
          {
            userAId: likedUserId,
            userBId: userId,
            mutual: true // Only allow removing mutual matches from either side
          }
        ]
      },
    });
    
    if (!existingLike) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }
    
    // Delete or update the like
    if (existingLike.mutual && existingLike.userAId === likedUserId) {
      // This is a mutual match initiated by the other user
      // Instead of deleting, update to remove mutual status
      await prismaClient.match.update({
        where: { id: existingLike.id },
        data: { mutual: false }
      });
    } else {
      // This is a like from the current user or a mutual match initiated by them
      await prismaClient.match.delete({
        where: { id: existingLike.id }
      });
    }
    
    // Invalidate related caches
    await redisClient.del(`like:${userId}:${likedUserId}`);
    await redisClient.del(`like:${likedUserId}:${userId}`);
    await redisClient.del(`matches:${userId}`);
    await redisClient.del(`matches:${likedUserId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Like removed successfully',
    });
  } catch (error) {
    logger.error('Error removing like', {
      error: (error as Error).message,
      endpoint: '/api/like'
    });
    return NextResponse.json(
      { error: 'Failed to remove like' },
      { status: 500 }
    );
  }
}