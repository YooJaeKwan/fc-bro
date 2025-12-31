import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { scheduleId, userId } = body

        if (!scheduleId || !userId) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            )
        }

        // 사용자 권한 확인 (총무만 가능)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '팀편성 확정 권한이 없습니다. 총무만 확정할 수 있습니다.' },
                { status: 403 }
            )
        }

        // 일정 조회
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                teamFormation: true,
                formationConfirmed: true
            }
        })

        if (!schedule) {
            return NextResponse.json(
                { error: '일정을 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (!schedule.teamFormation) {
            return NextResponse.json(
                { error: '팀편성 결과가 없습니다.' },
                { status: 400 }
            )
        }

        if (schedule.formationConfirmed) {
            return NextResponse.json(
                { error: '이미 확정된 팀편성입니다.' },
                { status: 400 }
            )
        }

        // 팀편성 확정
        const updatedSchedule = await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                formationConfirmed: true
            }
        })

        console.log('팀편성 확정 완료:', scheduleId)

        return NextResponse.json({
            success: true,
            schedule: updatedSchedule
        })

    } catch (error) {
        console.error('팀편성 확정 중 오류:', error)
        return NextResponse.json(
            { error: '팀편성 확정 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
