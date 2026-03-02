import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 부상 이력 조회 API
 * GET: 특정 사용자의 부상 이력 목록
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const requesterId = searchParams.get('requesterId')

        if (!userId || !requesterId) {
            return NextResponse.json(
                { error: '사용자 ID와 요청자 ID가 필요합니다.' },
                { status: 400 }
            )
        }

        // 권한 확인 (본인 또는 총무)
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { role: true }
        })

        const isAdmin = requester?.role === 'ADMIN'
        const isSelf = userId === requesterId

        if (!isAdmin && !isSelf) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        // 부상 이력 조회
        const injuries = await prisma.injury.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' }
        })

        return NextResponse.json({
            success: true,
            injuries
        })

    } catch (error) {
        console.error('부상 이력 조회 중 오류:', error)
        return NextResponse.json(
            { error: '부상 이력 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
