import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prsimadb';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      logger.securityEvent('Unauthorized access attempt to skills and domains', undefined, {
        endpoint: '/api/skills-and-domains',
        ip: 'unknown'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch all users with just the fields we need
    const users = await prismaClient.user.findMany({
      select: {
        skills: true,
        domainExpertise: true
      }
    });
    
    // Extract unique skills and domains
    const allSkills = Array.from(
      new Set(users.flatMap((user: { skills: string[]; })  => user.skills))
    ).sort();
    
    const allDomains = Array.from(
      new Set(users.flatMap((user: { domainExpertise: string[]; }) => user.domainExpertise))
    ).sort();
    
    // Add caching headers
    const headers = {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    };
    
    return NextResponse.json({ allSkills, allDomains }, { headers });
  } catch (error) {
    logger.error('Error fetching skills and domains', { 
      error: (error as Error).message,
      endpoint: '/api/skills-and-domains'
    });
    return NextResponse.json(
      { error: 'Failed to fetch skills and domains' }, 
      { status: 500 }
    );
  }
}