import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // 1. 모든 유저 조회 (게스트 제외, 이름 기준 정렬)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                realName: true,
                nickname: true,
                preferredPosition: true,
                createdAt: true,
            },
            orderBy: { realName: 'asc' }
        })

        // 2. 올해 종료된 일정만 조회 (날짜 순 정렬)
        const now = new Date()
        const currentYear = now.getFullYear()
        const yearStart = new Date(currentYear, 0, 1) // 1월 1일

        const schedules = await prisma.schedule.findMany({
            where: {
                matchDate: {
                    gte: yearStart  // 올해 1월 1일 이후
                },
                OR: [
                    { status: 'COMPLETED' },
                    {
                        status: { not: 'CANCELLED' },
                        matchDate: { lte: now }
                    }
                ]
            },
            select: {
                id: true,
                matchDate: true,
                title: true,
                type: true,
                attendances: {
                    select: { userId: true, status: true }
                }
            },
            orderBy: { matchDate: 'asc' }
        })

        // 3. 출석 매트릭스 생성
        // 각 유저별로, 각 일정에 참석했는지 여부를 O(참석)/X(불참)/N(노쇼)/-(가입전)로 기록
        const attendanceMatrix: Record<string, Record<string, 'O' | 'X' | 'N' | '-'>> = {}

        users.forEach(user => {
            attendanceMatrix[user.id] = {}
            schedules.forEach(schedule => {
                // 가입일 이전 경기는 '-'로 표시
                const isAfterJoin = new Date(schedule.matchDate) >= new Date(user.createdAt)
                if (!isAfterJoin) {
                    attendanceMatrix[user.id][schedule.id] = '-'
                    return
                }

                const att = schedule.attendances.find(a => a.userId === user.id)
                const attStatus = (att?.status || '').toUpperCase()
                if (attStatus === 'ATTENDING' || attStatus === 'ATTENDED') {
                    attendanceMatrix[user.id][schedule.id] = 'O'
                } else if (attStatus === 'NO_SHOW') {
                    attendanceMatrix[user.id][schedule.id] = 'N'
                } else {
                    attendanceMatrix[user.id][schedule.id] = 'X'
                }
            })
        })

        // 4. 월별 및 개별 통계 계산
        const memberStats = users.map(user => {
            const userMatrix = attendanceMatrix[user.id] || {}
            
            // 참석(O) 수 계산
            const attendedCount = Object.values(userMatrix).filter(val => val === 'O').length
            
            // 전체 대상 경기 수 (가입전 '-' 제외)
            const eligibleSchedules = schedules.filter(s => {
                const isAfterJoin = new Date(s.matchDate) >= new Date(user.createdAt)
                return isAfterJoin
            })
            
            const totalEligible = eligibleSchedules.length
            const attendanceRate = totalEligible > 0 ? Math.round((attendedCount / totalEligible) * 100) : 0

            return {
                id: user.id,
                userId: user.id,
                name: user.realName || user.nickname || '이름 없음',
                position: user.preferredPosition || 'MC',
                attendedCount,
                totalEligible,
                totalSchedules: totalEligible,
                rate: attendanceRate,
                attendanceRate,
                matrix: userMatrix
            }
        })

        // 5. 일정 정보 간소화
        const scheduleList = schedules.map(s => ({
            id: s.id,
            date: new Date(s.matchDate.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
            title: s.title,
            type: s.type
        }))

        return NextResponse.json({
            success: true,
            data: {
                users: memberStats,
                schedules: scheduleList,
                matrix: attendanceMatrix
            }
        })

    } catch (error) {
        console.error('출석 통계 조회 실패:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
