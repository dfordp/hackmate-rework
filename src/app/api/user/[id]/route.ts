import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prsimadb';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { 
  cacheUserProfile, 
  getCachedUserProfile, 
  redisClient 
} from '@/lib/redis';
import { logger } from '@/lib/logger';

// Define the request body schema for updates
const userUpdateSchema = z.object({ 
  id: z.string(),
  name: z.string().min(2),
  description: z.string().min(50, { message: "Tell us a bit more about yourself (min 50 characters)" }).optional(),
  avatarUrl: z.string().url().optional(),
  location: z.string(),
  personalityTags: z.array(z.string()),
  workingStyle: z.enum(['ASYNC', 'REAL_TIME', 'FLEXIBLE', 'STRUCTURED']),
  collaborationPref: z.enum(['REMOTE', 'HYBRID', 'IN_PERSON', 'DOESNT_MATTER']),
  currentRole: z.string(),
  yearsExperience: z.number().min(0),
  domainExpertise: z.array(z.string()),
  skills: z.array(z.string()),
  pastProjects: z.array(z.object({
    id: z.string().optional(), // For existing projects
    name: z.string(),
    description: z.string(),
    link: z.string().optional()
  })).optional(),
  startupInfo: z.object({
    stage: z.enum(['IDEA', 'MVP', 'SCALING', 'EXITED']),
    goals: z.string(),
    commitment: z.enum(['EXPLORING', 'BUILDING', 'LAUNCHING', 'FULL_TIME_READY']),
    lookingFor: z.array(z.string())
  }).optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    twitterUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    scheduleUrl: z.string().url().optional().or(z.literal(''))
  }).optional()
});

export async function GET(
  request: NextRequest,
) {
  try {
    const { userId: authUserId } = getAuth(request);
    const userId = request.url.split('/').pop();

    if (!userId) {
      return new NextResponse('ID is required', { status: 400 });
    }

    // Check authentication
    if (!authUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Allow users to access their own profile or public profiles
    // For now, we'll allow access to any profile, but you might want to restrict this
    // based on your privacy requirements

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=120'); // Cache for 1 minute browser, 2 minutes CDN
    headers.set('Vary', 'Accept, Cookie'); // Vary cache by these headers
    
    // Try to get user from Redis cache first
    const cachedUser = await getCachedUserProfile(userId);
    
    if (cachedUser) {
      
      // Get related data from cache
      const cachedRelations = {
        pastProjects: [],
        startupInfo: null,
        contactInfo: null
      };
      
      try {
        // Get projects from cache
        if (cachedUser.pastProjects) {
          cachedRelations.pastProjects = JSON.parse(cachedUser.pastProjects);
        }
        
        // Get startup info from cache
        if (cachedUser.startupInfo) {
          cachedRelations.startupInfo = JSON.parse(cachedUser.startupInfo);
        }
        
        // Get contact info from cache
        if (cachedUser.contactInfo) {
          cachedRelations.contactInfo = JSON.parse(cachedUser.contactInfo);
        }
        
        // Assemble full user object
        const formattedUser = {
          id: cachedUser.id,
          name: cachedUser.name,
          description: cachedUser.description,
          avatarUrl: cachedUser.avatarUrl,
          location: cachedUser.location,
          personalityTags: JSON.parse(cachedUser.personalityTags || '[]'),
          workingStyle: cachedUser.workingStyle,
          collaborationPref: cachedUser.collaborationPref,
          currentRole: cachedUser.currentRole,
          yearsExperience: parseInt(cachedUser.yearsExperience || '0'),
          domainExpertise: JSON.parse(cachedUser.domainExpertise || '[]'),
          skills: JSON.parse(cachedUser.skills || '[]'),
          ...cachedRelations
        };
        
        return NextResponse.json(formattedUser, { headers });
      } catch (parseError) {
        logger.error('Error parsing cached user data', {
          error: (parseError as Error).message,
          endpoint: '/api/user/[id]'
        });
        // Continue to fetch from database if parsing fails
      }
    }
    
    
    // Fetch the user and all related data from the database
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        pastProjects: {
          select: {
            id: true,
            name: true,
            description: true,
            link: true
          }
        },
        startupInfo: {
          select: {
            startupStage: true,
            startupGoals: true,
            startupCommitment: true,
            lookingFor: true
          }
        },
        contactInfo: {
          select: {
            id: true,
            email: true,
            twitterUrl: true,
            linkedinUrl: true,
            scheduleUrl: true
          }
        },
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Cache the user profile for future requests
    await cacheUserProfile(user);
    
    return NextResponse.json(user, { headers });
  } catch (error) {
    logger.error('Error fetching user', {
      error: (error as Error).message,
      endpoint: '/api/user/[id]'
    });
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId: authUserId } = getAuth(request);
    // Get the user ID from the URL
    const userId = request.url.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check authentication
    if (!authUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure users can only update their own profile
    if (authUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only update your own profile' }, { status: 403 });
    }
    
    // Process as multipart form data
    const formData = await request.formData();
    
    // Parse the JSON data from the form
    const userData = JSON.parse(formData.get('userData') as string);
    
    // Make sure the ID in the URL matches the ID in the data
    if (userData.id !== userId) {
      return NextResponse.json({ 
        error: 'ID mismatch', 
        message: 'The ID in the URL does not match the ID in the request body' 
      }, { status: 400 });
    }
    
    // Validate user data
    const validatedData = userUpdateSchema.parse(userData);

    // Check if user exists - try Redis first for a faster check
    const cachedUser = await getCachedUserProfile(userId);
    let existingUser;
    
    if (cachedUser) {
      // If in cache, we know the user exists, but still need the full profile
      existingUser = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
          pastProjects: true,
          startupInfo: true,
          contactInfo: true
        }
      });
    } else {
      // If not in cache, we need to check if the user exists
      existingUser = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
          pastProjects: true,
          startupInfo: true,
          contactInfo: true
        }
      });
      
      if (!existingUser) {
        return NextResponse.json({ 
          error: 'User not found', 
          message: 'The user you are trying to update does not exist' 
        }, { status: 404 });
      }
    }

    try {
      // Update user with transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedUser = await prismaClient.$transaction(async (tx: { user: { update: (arg0: { where: { id: string; }; data: { name: string; avatarUrl: string | undefined; description: string | undefined; location: string; personalityTags: string[]; workingStyle: "ASYNC" | "REAL_TIME" | "FLEXIBLE" | "STRUCTURED"; collaborationPref: "REMOTE" | "HYBRID" | "IN_PERSON" | "DOESNT_MATTER"; currentRole: string; yearsExperience: number; domainExpertise: string[]; skills: string[]; }; }) => any; }; contactInfo: { update: (arg0: { where: { userId: string; }; data: { email: string | undefined; twitterUrl: string | null; linkedinUrl: string | null; scheduleUrl: string | null; }; }) => any; create: (arg0: { data: { userId: string; email: string | undefined; twitterUrl: string | null; linkedinUrl: string | null; scheduleUrl: string | null; }; }) => any; }; project: { deleteMany: (arg0: { where: { id: { in: any; }; }; }) => any; update: (arg0: { where: { id: string; }; data: { name: string; description: string; link: string | null; }; }) => any; create: (arg0: { data: { name: string; description: string; link: string | null; userId: string; }; }) => any; }; startupinfo: { update: (arg0: { where: { userId: string; }; data: { startupStage: "IDEA" | "MVP" | "SCALING" | "EXITED"; startupGoals: string; startupCommitment: "EXPLORING" | "BUILDING" | "LAUNCHING" | "FULL_TIME_READY"; lookingFor: string[]; }; }) => any; create: (arg0: { data: { userId: string; startupStage: "IDEA" | "MVP" | "SCALING" | "EXITED"; startupGoals: string; startupCommitment: "EXPLORING" | "BUILDING" | "LAUNCHING" | "FULL_TIME_READY"; lookingFor: string[]; }; }) => any; }; }) => {
        // Update base user data
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            name: validatedData.name,
            avatarUrl: validatedData.avatarUrl,
            description: validatedData.description,
            location: validatedData.location,
            personalityTags: validatedData.personalityTags,
            workingStyle: validatedData.workingStyle,
            collaborationPref: validatedData.collaborationPref,
            currentRole: validatedData.currentRole,
            yearsExperience: validatedData.yearsExperience,
            domainExpertise: validatedData.domainExpertise,
            skills: validatedData.skills,
          }
        });

        // Update contact info
        if (validatedData.contactInfo) {
          if (existingUser?.contactInfo) {
            // Update existing contact info
            await tx.contactInfo.update({
              where: { userId: userId },
              data: {
                email: validatedData.contactInfo.email,
                twitterUrl: validatedData.contactInfo.twitterUrl || null,
                linkedinUrl: validatedData.contactInfo.linkedinUrl || null,
                scheduleUrl: validatedData.contactInfo.scheduleUrl || null
              }
            });
          } else {
            // Create new contact info
            await tx.contactInfo.create({
              data: {
                userId: userId,
                email: validatedData.contactInfo.email,
                twitterUrl: validatedData.contactInfo.twitterUrl || null,
                linkedinUrl: validatedData.contactInfo.linkedinUrl || null,
                scheduleUrl: validatedData.contactInfo.scheduleUrl || null
              }
            });
          }
        }
        
        // Handle past projects
        if (validatedData.pastProjects) {
          // Get existing project IDs
          const existingProjectIds = existingUser?.pastProjects.map((p: { id: string; }) => p.id);
          
          if(!existingProjectIds){
            throw Error("User doesn't have any existing projects")
          }
          
          // Get project IDs from the updated data
          const updatedProjectIds = validatedData.pastProjects
            .filter(p => p.id)
            .map(p => p.id as string);
          
          // Find projects to delete (exist in DB but not in updated data)
          const projectIdsToDelete = existingProjectIds.filter(
            (id: string) => !updatedProjectIds.includes(id)
          );
          
          // Delete projects that are no longer in the updated data
          if (projectIdsToDelete.length > 0) {
            await tx.project.deleteMany({
              where: {
                id: { in: projectIdsToDelete }
              }
            });
          }
          
          // Update or create projects
          for (const project of validatedData.pastProjects) {
            if (project.id) {
              // Update existing project
              await tx.project.update({
                where: { id: project.id },
                data: {
                  name: project.name,
                  description: project.description,
                  link: project.link || null
                }
              });
            } else {
              // Create new project
              await tx.project.create({
                data: {
                  name: project.name,
                  description: project.description,
                  link: project.link || null,
                  userId: userId
                }
              });
            }
          }
        }
        
        // Handle startup info
        if (validatedData.startupInfo) {
          if (existingUser?.startupInfo) {
            // Update existing startup info
            await tx.startupinfo.update({
              where: { userId: userId },
              data: {
                startupStage: validatedData.startupInfo.stage,
                startupGoals: validatedData.startupInfo.goals,
                startupCommitment: validatedData.startupInfo.commitment,
                lookingFor: validatedData.startupInfo.lookingFor
              }
            });
          } else {
            // Create new startup info
            await tx.startupinfo.create({
              data: {
                userId: userId,
                startupStage: validatedData.startupInfo.stage,
                startupGoals: validatedData.startupInfo.goals,
                startupCommitment: validatedData.startupInfo.commitment,
                lookingFor: validatedData.startupInfo.lookingFor
              }
            });
          }
        }
        
        return user;
      });

      // Update user profile in Redis cache
      const updatedUserWithRelations = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
          pastProjects: true,
          startupInfo: true,
          contactInfo: true
        }
      });
      
      // Cache the updated user profile
      if (updatedUserWithRelations) {
        await cacheUserProfile(updatedUserWithRelations);
      }
      
      // Invalidate any related user list caches
      const cachePatterns = ['users:*', 'users:fullset:*'];
      for (const pattern of cachePatterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }

      return NextResponse.json(updatedUser, { status: 200 });
    } catch (dbError) {
      logger.error('Database operation error during user update', {
        error: (dbError as Error).message,
        endpoint: '/api/user/[id]',
        operation: 'update_user'
      });
      throw dbError;
    }
  } catch (error) {
    logger.error('Error updating user', {
      error: (error as Error).message,
      endpoint: '/api/user/[id]',
      operation: 'update_user'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: authUserId } = getAuth(request);
    const userId = request.url.split('/').pop();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check authentication
    if (!authUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure users can only delete their own profile
    if (authUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only delete your own profile' }, { status: 403 });
    }

    // Check if user exists - try Redis first for a faster check
    const cachedUser = await getCachedUserProfile(userId);
    let userExists = cachedUser !== null;
    
    // If not found in Redis, check the database
    if (!userExists) {
      const existingUser = await prismaClient.user.findUnique({
        where: { id: userId }
      });
      userExists = existingUser !== null;
    }

    if (!userExists) {
      return NextResponse.json({ 
        error: 'User not found', 
        message: 'The user you are trying to delete does not exist' 
      }, { status: 404 });
    }

    // Delete user and all related data (will cascade delete related records)

    await prismaClient.$transaction([
      prismaClient.project.deleteMany({ where: { userId } }),
      prismaClient.startupinfo.deleteMany({ where: { userId } }),
      prismaClient.contactInfo.deleteMany({ where: { userId } }),
      prismaClient.user.delete({ where: { id: userId } }),
    ]);

    // Delete user from Redis cache
    await redisClient.del(`user:${userId}`);
    
    // Invalidate any related user list caches
    const cachePatterns = ['users:*', 'users:fullset:*'];
    for (const pattern of cachePatterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    logger.error('Error deleting user', {
      error: (error as Error).message,
      endpoint: '/api/user/[id]',
      operation: 'delete_user'
    });
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}