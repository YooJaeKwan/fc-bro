import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface PlayerStat {
    id: string
    name: string
    goals: number
    assists: number
    mvpCount: number
    attendanceCount: number // 추가: 출석 수
    gamesPlayed: number     // 추가: 승률 계산용 경기 수
    wins: number            // 추가: 승수
    cleanSheets: number     // 추가: 무실점 방어 (수비수, 골키퍼)
    attendanceRate?: number // 파생: 출석율
    winRate?: number        // 파생: 승률
    mainPosition?: string   // 추가: 클린시트 판별용 주 포지션
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        // 모든 일정의 기록과 MVP 정보, 참석자 정보 조회
        const schedules = await prisma.schedule.findMany({
            where: {
                status: 'COMPLETED'
            },
            select: {
                id: true,
                type: true,
                ourScore: true,
                opponentScore: true,
                goalRecords: true,
                mvpUserId: true,
                teamFormation: true,
                attendances: {
                    select: {
                        userId: true,
                        status: true
                    }
                }
            }
        })

        const users = await prisma.user.findMany({
            select: { id: true, name: true, nickname: true, realName: true, preferredPosition: true },
            where: { isActive: true }
        })
        const validUserIds = new Set(users.map(u => u.id))

        // 선수별 통계 집계 개체 초기화
        const playerStats: { [key: string]: PlayerStat } = {}
        users.forEach(u => {
            playerStats[u.id] = {
                id: u.id,
                name: u.realName || u.nickname || u.name || '',
                mainPosition: u.preferredPosition || '',
                goals: 0,
                assists: 0,
                mvpCount: 0,
                attendanceCount: 0,
                gamesPlayed: 0,
                wins: 0,
                cleanSheets: 0
            }
        })

        for (const schedule of schedules) {
            // 골/도움 기록 처리
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
                for (const goal of schedule.goalRecords as any[]) {
                    // 득점자
                    if (goal.scorerId && goal.scorerName && goal.scorerId !== 'own_goal') {
                        if (validUserIds.has(goal.scorerId)) {
                            playerStats[goal.scorerId].goals += 1
                        }
                    }

                    // 어시스트
                    if (goal.assistId && goal.assistName) {
                        if (validUserIds.has(goal.assistId)) {
                            playerStats[goal.assistId].assists += 1
                        }
                    }
                }
            }

            // MVP 처리
            if (schedule.mvpUserId && schedule.teamFormation) {
                if (validUserIds.has(schedule.mvpUserId)) {
                    playerStats[schedule.mvpUserId].mvpCount += 1
                }
            }

            // 출석 처리
            if (schedule.attendances && Array.isArray(schedule.attendances)) {
                for (const attendance of schedule.attendances) {
                    if (attendance.status === 'ATTENDING' && attendance.userId && validUserIds.has(attendance.userId)) {
                        playerStats[attendance.userId].attendanceCount += 1
                    }
                }
            }

            // 전적 계산 (자체 경기)
            const isInternalMatch = schedule.type === 'internal' && schedule.teamFormation && schedule.ourScore !== null && schedule.opponentScore !== null
            if (isInternalMatch) {
                const formation: any = schedule.teamFormation
                const yellowTeam: any[] = formation.yellowTeam || []
                const blueTeam: any[] = formation.blueTeam || []

                // 클린시트 대상 수비/골키퍼 포지션 목록 (DB에 저장된 형태 기준)
                const defensivePositions = ['DC', 'DR', 'DL', 'DRL', 'DRLC', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'GK']

                // 해당 팀 구성원 중 수비수의 클린시트를 올려주는 함수
                const rewardCleanSheets = (teamPlayers: any[]) => {
                    teamPlayers.forEach(p => {
                        if (p.userId && validUserIds.has(p.userId)) {
                            const playerPos = playerStats[p.userId].mainPosition?.toUpperCase() || ''
                            if (defensivePositions.includes(playerPos)) {
                                playerStats[p.userId].cleanSheets += 1
                            }
                        }
                    })
                }

                const processMatchResult = (teamPlayers: any[], isWin: boolean) => {
                    teamPlayers.forEach(p => {
                        if (p.userId && validUserIds.has(p.userId)) {
                            playerStats[p.userId].gamesPlayed += 1
                            if (isWin) {
                                playerStats[p.userId].wins += 1
                            }
                        }
                    })
                }

                // 승패 계산
                if (schedule.ourScore! > schedule.opponentScore!) {
                    processMatchResult(yellowTeam, true)
                    processMatchResult(blueTeam, false)
                } else if (schedule.opponentScore! > schedule.ourScore!) {
                    processMatchResult(yellowTeam, false)
                    processMatchResult(blueTeam, true)
                } else {
                    processMatchResult(yellowTeam, false)
                    processMatchResult(blueTeam, false)
                }

                // 노랑팀 무실점 (상대 스코어 === 0)
                if (schedule.opponentScore === 0) {
                    rewardCleanSheets(yellowTeam)
                }

                // 파랑팀 무실점 (우리 스코어 === 0)
                if (schedule.ourScore === 0) {
                    rewardCleanSheets(blueTeam)
                }
            }
        }

        const totalCompletedSchedules = schedules.length

        // 파생 지표(출석율, 승률) 계산 및 배열로 변환
        const statsArray = Object.values(playerStats).map(stat => {
            const attendanceRate = totalCompletedSchedules > 0 ? Math.round((stat.attendanceCount / totalCompletedSchedules) * 100) : 0
            const winRate = stat.gamesPlayed > 0 ? Math.round((stat.wins / stat.gamesPlayed) * 100) : 0
            return {
                ...stat,
                attendanceRate,
                winRate
            }
        })

        // TOP5 랭킹 (공동 순위 포함)
        const getTopWithTies = (stats: PlayerStat[], key: keyof PlayerStat, limit: number, filterCondition?: (p: PlayerStat) => boolean) => {
            let sorted = [...stats];
            if (filterCondition) {
                sorted = sorted.filter(filterCondition);
            }
            sorted = sorted
                .filter(p => (p[key] as number) > 0)
                .sort((a, b) => (b[key] as number) - (a[key] as number));

            if (sorted.length <= limit) return sorted;

            const limitValue = sorted[limit - 1][key];
            let count = limit;
            while (count < sorted.length && sorted[count][key] === limitValue) {
                count++;
            }
            return sorted.slice(0, count);
        }

        const topScorers = getTopWithTies(statsArray, 'goals', 5);
        const topAssists = getTopWithTies(statsArray, 'assists', 5);
        const topCleanSheets = getTopWithTies(statsArray, 'cleanSheets', 5);
        const topAttendance = getTopWithTies(statsArray, 'attendanceRate', 5);
        // 승률은 출석율 50% 이상 기준
        const topWinRate = getTopWithTies(statsArray, 'winRate', 5, (p) => (p.attendanceRate || 0) >= 50);

        // 개인 통계 (userId가 있는 경우)
        let myStats = null
        if (userId && playerStats[userId]) {
            myStats = statsArray.find(s => s.id === userId) || null
        } else if (userId) {
            myStats = {
                id: userId,
                name: '',
                goals: 0,
                assists: 0,
                mvpCount: 0,
                attendanceCount: 0,
                gamesPlayed: 0,
                wins: 0,
                cleanSheets: 0,
                attendanceRate: 0,
                winRate: 0
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                topScorers,
                topAssists,
                topCleanSheets,
                topAttendance,
                topWinRate,
                myStats,
                totalMatches: totalCompletedSchedules
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
