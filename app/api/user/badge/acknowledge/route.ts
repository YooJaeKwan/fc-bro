import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 해당 유저의 모든 미확인 뱃지를 확인 완료로 업데이트
    await prisma.userBadge.updateMany({
      where: {
        userId,
        acknowledged: false
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, message: 'Badges acknowledged' })

  } catch (error) {
    console.error('뱃지 확인 업데이트 실패:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
