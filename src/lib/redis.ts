/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { createClient } from 'redis';
import type { User } from '@prisma/client';
import { logger } from './logger';

// Create Redis client (don't connect yet)
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => logger.error('Redis connection error', { error: err.message }));

// Connection state tracking
let isConnecting = false;
let isConnected = false;

// Lazy connection function - only connect when needed
async function ensureRedisConnection() {
  // Skip connection during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    logger.debug('Skipping Redis connection during build phase');
    return false;
  }

  if (isConnected) {
    return true;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    return isConnected;
  }

  try {
    isConnecting = true;
    await redisClient.connect();
    isConnected = true;
    logger.info('Redis connected successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to Redis', { error: (error as Error).message });
    isConnected = false;
    return false;
  } finally {
    isConnecting = false;
  }
}

// Default TTL values (in seconds)
const DEFAULT_TTL = {
  USER_PROFILE: 3600, // 1 hour
  VIEWED_PROFILES: 3600, // 1 hour
  LIKES: 3600, // 1 hour
  MATCHES: 3600 // 1 hour
};

// User likes functions
export async function addLike(userId: string, likedUserId: string): Promise<boolean> {
  if (!await ensureRedisConnection()) return false;
  const result = await redisClient.sAdd(`likes:${userId}`, likedUserId);
  await redisClient.expire(`likes:${userId}`, DEFAULT_TTL.LIKES);
  return result === 1;
}

export async function hasLiked(userId: string, likedUserId: string): Promise<boolean> {
  if (!await ensureRedisConnection()) return false;
  return await redisClient.sIsMember(`likes:${userId}`, likedUserId);
}

// Match queue functions
export async function addToMatchQueue(userId: string, matchUserId: string): Promise<void> {
  if (!await ensureRedisConnection()) return;
  await redisClient.rPush(`matches:${userId}`, matchUserId);
  await redisClient.expire(`matches:${userId}`, DEFAULT_TTL.MATCHES);
}

export async function getNextMatch(userId: string): Promise<string | null> {
  if (!await ensureRedisConnection()) return null;
  return await redisClient.lPop(`matches:${userId}`);
}

// User profile cache functions
export async function cacheUserProfile(user: User): Promise<void> {
  if (!await ensureRedisConnection()) return;
  
  // Cache all fields needed for profile rendering
  const userCache = {
    id: user.id,
    name: user.name,
    description: user.description || '',
    avatarUrl: user.avatarUrl || '',
    location: user.location || '',
    personalityTags: JSON.stringify(user.personalityTags || []),
    workingStyle: user.workingStyle || '',
    collaborationPref: user.collaborationPref || '',
    currentRole: user.currentRole || '',
    yearsExperience: user.yearsExperience?.toString() || '0',
    domainExpertise: JSON.stringify(user.domainExpertise || []),
    skills: JSON.stringify(user.skills || []),
    // Handle nested objects
    pastProjects: JSON.stringify(user.pastProjects || []),
    startupInfo: user.startupInfo ? JSON.stringify(user.startupInfo) : null,
  };
  
  await redisClient.hSet(`user:${user.id}`, userCache);
  await redisClient.expire(`user:${user.id}`, DEFAULT_TTL.USER_PROFILE);
}
export async function getCachedUserProfile(userId: string): Promise<Record<string, string> | null> {
  if (!await ensureRedisConnection()) return null;
  const cachedUser = await redisClient.hGetAll(`user:${userId}`);
  return Object.keys(cachedUser).length > 0 ? cachedUser : null;
}

export async function invalidateUserCache(userId: string): Promise<void> {
  if (!await ensureRedisConnection()) return;
  await redisClient.del(`user:${userId}`);
}

// Viewed profiles functions (simple get/set with TTL)
export async function addViewedProfile(userId: string, viewedId: string): Promise<void> {
  if (!await ensureRedisConnection()) return;
  await redisClient.sAdd(`viewed:${userId}`, viewedId);
  await redisClient.expire(`viewed:${userId}`, DEFAULT_TTL.VIEWED_PROFILES);
}

export async function getViewedProfiles(userId: string): Promise<string[]> {
  if (!await ensureRedisConnection()) return [];
  return await redisClient.sMembers(`viewed:${userId}`);
}

export async function resetViewedProfiles(userId: string): Promise<void> {
  if (!await ensureRedisConnection()) return;
  await redisClient.del(`viewed:${userId}`);
}

export async function isProfileViewed(userId: string, profileId: string): Promise<boolean> {
  if (!await ensureRedisConnection()) return false;
  return await redisClient.sIsMember(`viewed:${userId}`, profileId);
}

// Simple key-value set with TTL
export async function setValue(key: string, value: string, ttl?: number): Promise<void> {
  if (!await ensureRedisConnection()) return;
  await redisClient.set(key, value);
  if (ttl) {
    await redisClient.expire(key, ttl);
  }
}

// Simple key-value get
export async function getValue(key: string): Promise<string | null> {
  if (!await ensureRedisConnection()) return null;
  return await redisClient.get(key);
}

// Export the client for direct use if needed
export { redisClient };