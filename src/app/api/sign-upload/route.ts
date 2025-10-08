import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      logger.securityEvent('Unauthorized access attempt to Cloudinary upload', undefined, {
        endpoint: '/api/sign-upload'
      });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET!
    );

    // Only return public API key, not the secret
    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, // Use public key only
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    logger.error('Error generating Cloudinary upload signature', {
      error: (error as Error).message,
      endpoint: '/api/sign-upload'
    });
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
  }
}
