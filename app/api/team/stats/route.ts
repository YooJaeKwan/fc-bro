import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface PlayerStat {
    id: string
    name: string
    goals: number
    assists: number
    mvpCount: number
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        // 모든 일정의 골 기록과 MVP 정보 조회
        const schedules = await prisma.schedule.findMany({
            where: {
                status: 'COMPLETED'
            },
            select: {
                id: true,
                goalRecords: true,
                mvpUserId: true,
                teamFormation: true
            }
        })

        // 선수별 통계 집계
        const playerStats: { [key: string]: PlayerStat } = {}

        for (const schedule of schedules) {
            // 골/도움 기록 처리
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
                for (const goal of schedule.goalRecords as any[]) {
                    // 득점자
                    if (goal.scorerId && goal.scorerName && goal.scorerId !== 'own_goal') {
                        if (!playerStats[goal.scorerId]) {
                            playerStats[goal.scorerId] = {
                                id: goal.scorerId,
                                name: goal.scorerName,
                                goals: 0,
                                assists: 0,
                                mvpCount: 0
                            }
                        }
                        playerStats[goal.scorerId].goals += 1
                    }

                    // 어시스트
                    if (goal.assistId && goal.assistName) {
                        if (!playerStats[goal.assistId]) {
                            playerStats[goal.assistId] = {
                                id: goal.assistId,
                                name: goal.assistName,
                                goals: 0,
                                assists: 0,
                                mvpCount: 0
                            }
                        }
                        playerStats[goal.assistId].assists += 1
                    }
                }
            }

            // MVP 처리
            if (schedule.mvpUserId && schedule.teamFormation) {
                const formation = schedule.teamFormation as any
                const allPlayers = [
                    ...(formation.yellowTeam || []),
                    ...(formation.blueTeam || [])
                ]
                const mvp = allPlayers.find((p: any) => p.userId === schedule.mvpUserId)

                if (mvp) {
                    if (!playerStats[schedule.mvpUserId]) {
                        playerStats[schedule.mvpUserId] = {
                            id: schedule.mvpUserId,
                            name: mvp.name,
                            goals: 0,
                            assists: 0,
                            mvpCount: 0
                        }
                    }
                    playerStats[schedule.mvpUserId].mvpCount += 1
                }
            }
        }

        // 배열로 변환
        const statsArray = Object.values(playerStats)

        // TOP5 랭킹
        const topScorers = [...statsArray]
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 5)

        const topAssists = [...statsArray]
            .filter(p => p.assists > 0)
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 5)

        const topMvps = [...statsArray]
            .filter(p => p.mvpCount > 0)
            .sort((a, b) => b.mvpCount - a.mvpCount)
            .slice(0, 5)

        // 개인 통계 (userId가 있는 경우)
        let myStats = null
        if (userId && playerStats[userId]) {
            myStats = playerStats[userId]
        } else if (userId) {
            myStats = {
                id: userId,
                name: '',
                goals: 0,
                assists: 0,
                mvpCount: 0
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                topScorers,
                topAssists,
                topMvps,
                myStats,
                totalMatches: schedules.length
            }
        })

    } catch (error) {
        console.error('팀 통계 조회 오류:', error)
        return NextResponse.json(
            { error: '통계 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
