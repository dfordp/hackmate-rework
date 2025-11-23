import prismaClient from '@/lib/prsimadb'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch matches where userB is current user and isMatched is false
    // (meaning userA liked userB but userB hasn't reciprocated)
    const matches = await prismaClient.match.findMany({
      where: {
        userBId: userId,
        mutual: false,
      },
      select: {
        userAId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Error fetching incoming matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incoming matches' },
      { status: 500 }
    )
  }
}