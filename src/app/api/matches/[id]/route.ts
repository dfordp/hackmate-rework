import { NextRequest, NextResponse } from 'next/server'
import prismaClient from '@/lib/prsimadb'
import { getValue, setValue } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id
    const cacheKey = `matches:${targetUserId}`
    
    const cachedMatches = await getValue(cacheKey)
    if (cachedMatches) {
      return NextResponse.json(JSON.parse(cachedMatches))
    }

    const matches = await prismaClient.match.findMany({
      where: {
        OR: [
          { userAId: targetUserId },
          { userBId: targetUserId }
        ]
      },
      include: {
        userA: {
          include: {
            pastProjects: true,
            startupInfo: true
          }
        },
        userB: {
          include: {
            pastProjects: true,
            startupInfo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedMatches = matches.map((match: any) => ({
      id: match.id,
      mutual: match.mutual,
      createdAt: match.createdAt,
      profile: match.userAId === targetUserId ? match.userB : match.userA
    }))

    await setValue(cacheKey, JSON.stringify(formattedMatches), 300)
    
    return NextResponse.json(formattedMatches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}