import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import geohash from 'ngeohash';

import prismaClient from '@/lib/prsimadb';

export async function GET(
  req: NextRequest,
) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.indexOf('user') + 1];
    const auth = getAuth(req)

    // Check authentication
    if (!id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only allow users to access their own locations
    if (id !== auth.userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get user location
    const location = await prismaClient.userLocation.findUnique({
      where: {
        userId: id
      }
    });

    if (!location) {
      return new NextResponse(JSON.stringify({ message: 'No location found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json(location);
  } catch (error) {
    logger.error('Error fetching location', {
      error: (error as Error).message,
      endpoint: '/api/user/[id]/location'
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.indexOf('user') + 1];
    const auth = getAuth(req)

    // Check authentication
    if (!id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only allow users to create locations for themselves
    if (id !== auth.userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { latitude, longitude } = body;

    // Validate required fields
    if (!latitude || !longitude) {
      return new NextResponse('Latitude and longitude are required', { status: 400 });
    }

    // Generate geohash
    const generatedGeohash = geohash.encode(latitude, longitude, 7);

    // Check if location already exists for user
    const existingLocation = await prismaClient.userLocation.findUnique({
      where: {
        userId: id
      }
    });

    let location;

    if (existingLocation) {
      // Update existing location
      location = await prismaClient.userLocation.update({
        where: {
          userId: id
        },
        data: {
          latitude,
          longitude,
          geohash: generatedGeohash
        }
      });
    } else {
      // Create new location
      location = await prismaClient.userLocation.create({
        data: {
          userId: id,
          latitude,
          longitude,
          geohash: generatedGeohash
        }
      });
    }

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    logger.error('Error creating/updating location', {
      error: (error as Error).message,
      endpoint: '/api/user/[id]/location'
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}