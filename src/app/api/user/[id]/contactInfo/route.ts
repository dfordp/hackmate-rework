import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import prismaClient from '@/lib/prsimadb';

export async function GET(
  req: NextRequest,
) {
  try {
    // Check authentication
    const { userId: authUserId } = getAuth(req);
    if (!authUserId) {
      logger.securityEvent('Unauthorized contact info access attempt', undefined, {
        endpoint: '/api/user/[id]/contactInfo'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.indexOf('user') + 1];
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Authorization: Only allow access if:
    // 1. User is viewing their own contact info, OR
    // 2. Users have a mutual match
    if (authUserId !== userId) {
      const hasMatch = await prismaClient.match.findFirst({
        where: {
          OR: [
            { userAId: authUserId, userBId: userId, mutual: true },
            { userAId: userId, userBId: authUserId, mutual: true }
          ]
        }
      });

      if (!hasMatch) {
        logger.securityEvent('Unauthorized contact info access', authUserId, {
          endpoint: '/api/user/[id]/contactInfo',
          targetUserId: userId,
          reason: 'No mutual match'
        });
        return NextResponse.json(
          { error: 'Contact information only visible after matching' },
          { status: 403 }
        );
      }
    }
    
    // Fetch only the contact information for the user
    const contactInfo = await prismaClient.contactInfo.findUnique({
      where: {
        userId: userId
      },
      select: {
        id: true,
        email: true,
        twitterUrl: true,
        linkedinUrl: true,
        scheduleUrl: true
      }
    });
    
    if (!contactInfo) {
      return NextResponse.json(
        { error: 'Contact information not found for this user' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ contactInfo });
    
  } catch (error) {
    logger.error('Error fetching contact info', {
      error: (error as Error).message,
      endpoint: '/api/user/[id]/contactInfo'
    });
    return NextResponse.json(
      { error: 'Failed to fetch contact information' },
      { status: 500 }
    );
  }
}