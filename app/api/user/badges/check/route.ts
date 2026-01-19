import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkEligibleBadges } from '@/lib/badges'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId } = body

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // 1. 올해 종료된 스케줄 조회 (과거 일정, 올해만)
        const now = new Date()
        const currentYear = now.getFullYear()
        const yearStart = new Date(currentYear, 0, 1)
        yearStart.setHours(0, 0, 0, 0)

        const completedSchedules = await prisma.schedule.findMany({
            where: {
                matchDate: {
                    gte: yearStart,
                    lte: now
                }
            },
            include: {
                attendances: true
            }
        })

        // 2. 통계 계산
        let totalMatches = 0
        let attendedMatches = 0
        let wins = 0
        let draws = 0
        let losses = 0

        completedSchedules.forEach(schedule => {
            totalMatches++

            // 내 참석 정보 확인
            const myAttendance = schedule.attendances.find(a => a.userId === userId && a.status === 'ATTENDING')

            if (myAttendance) {
                attendedMatches++

                // 승무패 계산 (스코어가 있는 경우만)
                if (schedule.ourScore !== null && schedule.opponentScore !== null) {
                    // 내부 경기인 경우 팀편성에서 내가 어느 팀인지 확인
                    if (schedule.type === 'internal' && schedule.teamFormation) {
                        const formation: any = schedule.teamFormation
                        const yellowTeam = formation.yellowTeam || []
                        const blueTeam = formation.blueTeam || []
                        const isOnYellow = yellowTeam.some((p: any) => p.userId === userId)
                        const isOnBlue = blueTeam.some((p: any) => p.userId === userId)

                        // 팀에 배정되지 않은 경우 승패 계산 스킵
                        if (!isOnYellow && !isOnBlue) return

                        // Yellow팀: ourScore가 내 팀 점수
                        // Blue팀: opponentScore가 내 팀 점수
                        if (isOnYellow) {
                            if (schedule.ourScore > schedule.opponentScore) wins++
                            else if (schedule.ourScore === schedule.opponentScore) draws++
                            else losses++
                        } else if (isOnBlue) {
                            if (schedule.opponentScore > schedule.ourScore) wins++
                            else if (schedule.opponentScore === schedule.ourScore) draws++
                            else losses++
                        }
                    } else {
                        // 외부 경기(A매치 등)는 기존 로직 유지
                        if (schedule.ourScore > schedule.opponentScore) {
                            wins++
                        } else if (schedule.ourScore === schedule.opponentScore) {
                            draws++
                        } else {
                            losses++
                        }
                    }
                }
            }
        })

        const attendanceRate = totalMatches > 0 ? (attendedMatches / totalMatches) * 100 : 0

        const stats = {
            totalMatches,
            attendedMatches,
            attendanceRate,
            wins,
            draws,
            losses,
            hasWin: wins > 0,
            hasDraw: draws > 0,
            hasLoss: losses > 0
        }

        // 3. 기존 뱃지 조회
        const userBadges = await prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true }
        })
        const existingBadgeCodes = userBadges.map(ub => ub.badge.code)

        // 4. 자격 요건 체크
        const newBadgeCodes = checkEligibleBadges(stats, existingBadgeCodes)

        // 5. 새 뱃지 지급
        const allocatedBadges = []
        if (newBadgeCodes.length > 0) {
            // 뱃지 정보를 조회해서 ID를 알아냄
            const badgeDefinitions = await prisma.badge.findMany({
                where: {
                    code: {
                        in: newBadgeCodes
                    }
                }
            })

            for (const badgeDef of badgeDefinitions) {
                const created = await prisma.userBadge.create({
                    data: {
                        userId,
                        badgeId: badgeDef.id,
                        acknowledged: false
                    },
                    include: {
                        badge: true
                    }
                })
                allocatedBadges.push(created)
            }

            console.log(`[Badge Check] User ${userId} earned ${newBadgeCodes.length} new badges: ${newBadgeCodes.join(', ')}`)
        }

        return NextResponse.json({
            success: true,
            newBadges: allocatedBadges,
            stats // 디버깅용 통계 정보 반환
        })

    } catch (error) {
        console.error('Error checking badges:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
