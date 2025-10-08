import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prsimadb';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '@/lib/logger';
import { 
  getViewedProfiles,
  getCachedUserProfile,
} from '@/lib/redis';

// Define the request body schema for user creation
const userCreateSchema = z.object({ 
  id: z.string(),
  name: z.string().min(2),
  description: z.string().min(50, { message: "Tell us a bit more about yourself (min 50 characters)" }).optional(),
  avatarUrl: z.string().optional(),
  location: z.string(),
  personalityTags: z.array(z.string()),
  workingStyle: z.enum(['ASYNC', 'REAL_TIME', 'FLEXIBLE', 'STRUCTURED']),
  collaborationPref: z.enum(['REMOTE', 'HYBRID', 'IN_PERSON', 'DOESNT_MATTER']),
  currentRole: z.string(),
  yearsExperience: z.number().min(0),
  domainExpertise: z.array(z.string()),
  skills: z.array(z.string()),
  pastProjects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    link: z.string().optional()
  })).optional(),
  startupInfo: z.object({
    stage: z.enum(['IDEA', 'MVP', 'SCALING', 'EXITED']),
    goals: z.string(),
    commitment: z.enum(['EXPLORING', 'BUILDING', 'LAUNCHING', 'FULL_TIME_READY']),
    lookingFor: z.array(z.string()).optional(),
  }).optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    twitterUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    scheduleUrl: z.string().url().optional().or(z.literal(''))
  }).optional()
});

// Define filter schema for GET requests with excludeUserIds
const filterSchema = z.object({
  userId: z.string(), // Current user ID
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  skills: z.string().optional().transform(val => val ? val.split(',') : []),
  domains: z.string().optional().transform(val => val ? val.split(',') : []),
  workingStyles: z.string().optional().transform(val => {
    return val ? val.split(',').filter(style => 
      ['ASYNC', 'REAL_TIME', 'FLEXIBLE', 'STRUCTURED'].includes(style)
    ) : [];
  }),
  collaborationPrefs: z.string().optional().transform(val => {
    return val ? val.split(',').filter(pref => 
      ['REMOTE', 'HYBRID', 'IN_PERSON', 'DOESNT_MATTER'].includes(pref)
    ) : [];
  }),
  experienceMin: z.coerce.number().min(0).default(0),
  experienceMax: z.coerce.number().min(0).default(50),
  startupStages: z.string().optional().transform(val => {
    return val ? val.split(',').filter(stage => 
      ['IDEA', 'MVP', 'SCALING', 'EXITED'].includes(stage)
    ) : [];
  }),
  enableLocationBasedMatching: z.string().transform(val => val === 'true').default('false'),
  maxDistance: z.coerce.number().min(0).max(10000).default(50), // in km
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  excludeViewed: z.string().transform(val => val !== 'false').default('true'),
  excludeUserIds: z.string().optional().transform(val => val ? val.split(',') : []),
});

// Helper function to calculate cosine similarity between two arrays of strings
function calculateCosineSimilarity(array1: string[], array2: string[]): number {
  // Create a set of all unique elements
  const allItems = new Set([...array1, ...array2]);
  
  // Create vectors
  const vector1: number[] = [];
  const vector2: number[] = [];
  
  // Fill vectors with binary values (1 if present, 0 if not)
  allItems.forEach(item => {
    vector1.push(array1.includes(item) ? 1 : 0);
    vector2.push(array2.includes(item) ? 1 : 0);
  });
  
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
  }
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  // Return cosine similarity
  return dotProduct / (magnitude1 * magnitude2);
}

// Helper function to calculate distance between two coordinates using Haversine formula
// function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371; // Earth's radius in km
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
  
//   const a = 
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in km
// }

// GET handler for filtering and matching users
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const validatedFilters = filterSchema.parse(params);

    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');

    // Step 1: Prepare excludeIds
    let viewedProfiles: string[] = [];
    if (validatedFilters.excludeViewed) {
      viewedProfiles = await getViewedProfiles(validatedFilters.userId);
      if (viewedProfiles.length === 0) {
        const views = await prismaClient.view.findMany({
          where: { userAId: validatedFilters.userId },
          select: { userBId: true },
        });
        viewedProfiles = views.map(v => v.userBId);
      }
    }

    const excludeIds = [
      validatedFilters.userId,
      ...(validatedFilters.excludeUserIds || []),
      ...viewedProfiles,
    ];

    // Step 2: Build Prisma filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      id: { notIn: excludeIds },
    };

    if (validatedFilters.skills.length > 0) {
      where.skills = { hasSome: validatedFilters.skills };
    }
    if (validatedFilters.domains.length > 0) {
      where.domainExpertise = { hasSome: validatedFilters.domains };
    }
    if (validatedFilters.workingStyles.length > 0) {
      where.workingStyle = { in: validatedFilters.workingStyles };
    }
    if (validatedFilters.collaborationPrefs.length > 0) {
      where.collaborationPref = { in: validatedFilters.collaborationPrefs };
    }
    if (validatedFilters.startupStages.length > 0) {
      where.startupInfo = { startupStage: { in: validatedFilters.startupStages } };
    }
    where.yearsExperience = {
      gte: validatedFilters.experienceMin,
      lte: validatedFilters.experienceMax,
    };

    // Step 3: DB-level pagination
    const page = validatedFilters.page || 1;
    const pageSize = validatedFilters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [totalCount, users] = await prismaClient.$transaction([
      prismaClient.user.count({ where }),
      prismaClient.user.findMany({
        where,
        include: { contactInfo: true, pastProjects: true, startupInfo: true },
        skip,
        take: pageSize,
      }),
    ]);

    // Step 4: Fetch current user profile fields for similarity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentUserProfile: any = {};
  if (validatedFilters.skills.length > 0) {
    const cachedCurrentUser = await getCachedUserProfile(validatedFilters.userId);
    if (cachedCurrentUser) {
      currentUserProfile = {
        skills: JSON.parse(cachedCurrentUser.skills || '[]'),
        domainExpertise: JSON.parse(cachedCurrentUser.domainExpertise || '[]'),
        personalityTags: JSON.parse(cachedCurrentUser.personalityTags || '[]'),
        workingStyle: cachedCurrentUser.workingStyle ? [cachedCurrentUser.workingStyle] : [],
        collaborationPref: cachedCurrentUser.collaborationPref ? [cachedCurrentUser.collaborationPref] : [],
      };
    } else {
      const currentUser = await prismaClient.user.findUnique({
        where: { id: validatedFilters.userId },
        select: { skills: true, domainExpertise: true, personalityTags: true, workingStyle: true, collaborationPref: true },
      });
      if (currentUser) {
        currentUserProfile = {
          skills: currentUser.skills,
          domainExpertise: currentUser.domainExpertise,
          personalityTags: currentUser.personalityTags,
          workingStyle: currentUser.workingStyle ? [currentUser.workingStyle] : [],
          collaborationPref: currentUser.collaborationPref ? [currentUser.collaborationPref] : [],
        };
      }
    }
  }

    // Step 5: Optional in-memory scoring and location filtering
    let processedUsers = users;

  //   if (validatedFilters.enableLocationBasedMatching && validatedFilters.latitude && validatedFilters.longitude) {
  //   processedUsers = processedUsers.filter(u => {
  //     if (!u.latitude || !u.longitude) return false;
  //     const distance = calculateDistance(validatedFilters.latitude, validatedFilters.longitude, u.latitude, u.longitude);
  //     (u as any).distance = Math.round(distance);
  //     return distance <= validatedFilters.maxDistance;
  //   });
  // }

    if (currentUserProfile.skills && currentUserProfile.domainExpertise && currentUserProfile.personalityTags) {
    processedUsers = processedUsers.map(u => {
      const userVector = [
        ...(u.skills || []),
        ...(u.domainExpertise || []),
        ...(u.personalityTags || []),
        ...(u.workingStyle ? [u.workingStyle] : []),
        ...(u.collaborationPref ? [u.collaborationPref] : []),
      ];
      const currentUserVector = [
        ...(currentUserProfile.skills || []),
        ...(currentUserProfile.domainExpertise || []),
        ...(currentUserProfile.personalityTags || []),
        ...(currentUserProfile.workingStyle || []),
        ...(currentUserProfile.collaborationPref || []),
      ];
      return {
        ...u,
        similarityScore: Math.round(calculateCosineSimilarity(currentUserVector, userVector) * 100) / 100,
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processedUsers.sort((a, b) => (b as any).similarityScore - (a as any).similarityScore);
  }

    // Step 6: Format response
    const formattedUsers = processedUsers.map(u => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      location: u.location || null,
      description: u.description,
      personalityTags: u.personalityTags,
      workingStyle: u.workingStyle,
      collaborationPref: u.collaborationPref,
      currentRole: u.currentRole,
      yearsExperience: u.yearsExperience,
      domainExpertise: u.domainExpertise,
      skills: u.skills,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      similarityScore: (u as any).similarityScore,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      distance: (u as any).distance,
      pastProjects: u.pastProjects,
      startupInfo: u.startupInfo,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    }, { headers });

  } catch (err) {
    logger.error('Failed to fetch users', { 
      error: (err as Error).message,
      stack: (err as Error).stack,
      endpoint: '/api/user'
    });
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST handler for creating a new user
export async function POST(request: Request) {
  try {
    // Process as multipart form data
    const formData = await request.formData();
    
    // Parse the JSON data from the form
    const userData = JSON.parse(formData.get('userData') as string);
    
    // Validate user data
    const validatedData = userCreateSchema.parse(userData);

    const id = validatedData.id;

    // Check if user already exists - try Redis first for a faster check
    const cachedUser = await getCachedUserProfile(id);
    let userExists = cachedUser !== null;
    
    // If not found in Redis, check the database
    if (!userExists) {
      const existingUser = await prismaClient.user.findUnique({
        where: { id }
      });
      userExists = existingUser !== null;
    }

    if (userExists) {
      // Return error if user already exists
      return NextResponse.json({ 
        error: 'User already exists', 
        message: 'A user with this ID already exists. Use the update endpoint instead.' 
      }, { status: 409 });
    }

    
    try {
      // Create a new user
      // Use a transaction to ensure all database operations succeed or fail together
      const user = await prismaClient.$transaction(async (tx) => {
        // Create the base user first
        const createdUser = await tx.user.create({
          data: {
            id,
            name: validatedData.name,
            description : validatedData.description,
            avatarUrl: validatedData.avatarUrl,
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

        // Create contact info if provided
        if (validatedData.contactInfo) {
          await tx.contactInfo.create({
            data: {
              userId: createdUser.id,
              email: validatedData.contactInfo.email,
              twitterUrl: validatedData.contactInfo.twitterUrl || null,
              linkedinUrl: validatedData.contactInfo.linkedinUrl || null,
              scheduleUrl: validatedData.contactInfo.scheduleUrl || null
            }
          });
        }
        
        // Create past projects if provided
        if (validatedData.pastProjects && validatedData.pastProjects.length > 0) {
          for (const project of validatedData.pastProjects) {
            await tx.project.create({
              data: {
                name: project.name,
                description: project.description,
                link: project.link,
                userId: createdUser.id
              }
            });
          }
        }
        
        // Create startup info if provided
        if (validatedData.startupInfo) {
          await tx.startupinfo.create({
            data: {
              userId: createdUser.id,
              startupStage: validatedData.startupInfo.stage,
              startupGoals: validatedData.startupInfo.goals,
              startupCommitment: validatedData.startupInfo.commitment,
              lookingFor: validatedData.startupInfo.lookingFor
            }
          });
        }
        
        // Return the created user
        return createdUser;
      });
      
      return NextResponse.json(user, { status: 201 });
    } catch (dbError) {
      logger.error('Database operation error during user creation', { 
        error: (dbError as Error).message,
        stack: (dbError as Error).stack,
        endpoint: '/api/user',
        operation: 'create_user'
      });
      if (dbError instanceof PrismaClientKnownRequestError && dbError.code === 'P2002') {
        return NextResponse.json({ 
          error: 'User already exists', 
          message: 'A user with this ID already exists' 
        }, { status: 409 });
      }
      throw dbError;
    }
  } catch (error) {
    logger.error('Error creating user', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      endpoint: '/api/user',
      operation: 'create_user'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create user', message: (error as Error).message }, { status: 500 });
  }
}