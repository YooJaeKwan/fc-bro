import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // API 캐싱 방지

export async function GET(request: NextRequest) {
    try {
        // URL에서 limit 파라미터 가져오기
        const { searchParams } = new URL(request.url)
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam) : 5

        console.log(`다가오는 일정 조회 요청 (limit: ${limit})`)

        // 현재 날짜 이후의 일정만 조회
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const schedules = await prisma.schedule.findMany({
            where: {
                matchDate: {
                    gte: today
                }
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        realName: true,
                        nickname: true
                    }
                }
            },
            orderBy: {
                matchDate: 'asc'
            },
            take: limit
        })

        console.log(`다가오는 일정 ${schedules.length}개 조회 완료`)

        // 클라이언트에 전송할 데이터 구성
        const formattedSchedules = schedules.map(schedule => {
            return {
                id: schedule.id,
                title: schedule.title,
                type: schedule.type,
                date: (() => {
                    // 한국시간으로 저장된 DateTime을 한국시간 기준 날짜 문자열로 변환
                    const kstDate = new Date(schedule.matchDate.getTime() + (9 * 60 * 60 * 1000))
                    return kstDate.toISOString().split('T')[0]
                })(),
                time: schedule.startTime,
                gatherTime: schedule.gatherTime,
                location: schedule.location,
                description: schedule.description,
                opponentTeam: schedule.opponentTeam,
                status: schedule.status.toLowerCase(),
                createdBy: {
                    id: schedule.creator.id,
                    name: schedule.creator.realName || schedule.creator.nickname
                }
            }
        })

        return NextResponse.json({
            success: true,
            schedules: formattedSchedules,
            count: formattedSchedules.length
        })

    } catch (error) {
        console.error('다가오는 일정 조회 중 오류:', error)

        return NextResponse.json(
            { error: '일정 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
