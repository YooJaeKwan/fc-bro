import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkEligibleBadges } from '@/lib/badges'

// GET /api/user/badges - 사용자 뱃지 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const onlyNew = searchParams.get('onlyNew') === 'true'

        if (!userId) {
            return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
        }

        const where: any = { userId }
        if (onlyNew) {
            where.acknowledged = false
        }

        const userBadges = await prisma.userBadge.findMany({
            where,
            include: {
                badge: true
            },
            orderBy: { earnedAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            badges: userBadges,
            count: userBadges.length
        })
    } catch (error) {
        console.error('뱃지 조회 오류:', error)
        return NextResponse.json({ success: false, error: '뱃지 조회 실패' }, { status: 500 })
    }
}

// POST /api/user/badges/check - 뱃지 조건 체크 및 수여
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
        }

        // 현재 사용자의 뱃지 조회
        const existingUserBadges = await prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true }
        })
        const existingBadgeCodes = existingUserBadges.map(ub => ub.badge.code)

        // 사용자 통계 계산
        const currentYear = new Date().getFullYear()
        const yearStart = new Date(currentYear, 0, 1)
        yearStart.setHours(0, 0, 0, 0)

        const allSchedules = await prisma.schedule.findMany({
            where: {
                matchDate: {
                    gte: yearStart
                }
            },
            select: {
                id: true,
                type: true,
                ourScore: true,
                opponentScore: true,
                teamFormation: true,
                attendances: {
                    where: {
                        userId,
                        status: 'ATTENDING'
                    }
                }
            }
        })

        const totalMatches = allSchedules.length
        const attendedMatches = allSchedules.filter(s => s.attendances.length > 0).length
        const attendanceRate = totalMatches > 0 ? (attendedMatches / totalMatches) * 100 : 0

        // 경기 결과 통계
        let wins = 0, losses = 0, draws = 0
        let hasWin = false, hasLoss = false, hasDraw = false

        allSchedules.forEach(schedule => {
            if (schedule.type === 'internal' && schedule.teamFormation &&
                schedule.ourScore !== null && schedule.opponentScore !== null &&
                schedule.attendances.length > 0) {

                const formation: any = schedule.teamFormation
                const yellowTeam = formation.yellowTeam || []
                const blueTeam = formation.blueTeam || []
                const isOnYellow = yellowTeam.some((p: any) => p.userId === userId)
                const isOnBlue = blueTeam.some((p: any) => p.userId === userId)

                if (!isOnYellow && !isOnBlue) return

                let result: 'win' | 'draw' | 'loss' | null = null

                if (isOnYellow) {
                    if (schedule.ourScore > schedule.opponentScore) result = 'win'
                    else if (schedule.ourScore === schedule.opponentScore) result = 'draw'
                    else result = 'loss'
                } else if (isOnBlue) {
                    if (schedule.opponentScore > schedule.ourScore) result = 'win'
                    else if (schedule.opponentScore === schedule.ourScore) result = 'draw'
                    else result = 'loss'
                }

                if (result === 'win') { wins++; hasWin = true }
                else if (result === 'draw') { draws++; hasDraw = true }
                else if (result === 'loss') { losses++; hasLoss = true }
            }
        })

        const stats = {
            totalMatches,
            attendedMatches,
            attendanceRate,
            wins,
            losses,
            draws,
            hasWin,
            hasLoss,
            hasDraw
        }

        // 획득 가능한 새 뱃지 확인
        const newBadgeCodes = checkEligibleBadges(stats, existingBadgeCodes)

        // 새 뱃지 저장
        const newBadges = []
        for (const badgeCode of newBadgeCodes) {
            // 뱃지 정보 조회
            const badge = await prisma.badge.findUnique({
                where: { code: badgeCode }
            })

            if (!badge) continue

            // 사용자 뱃지 생성
            const userBadge = await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: badge.id
                },
                include: {
                    badge: true
                }
            })
            newBadges.push(userBadge)
        }

        return NextResponse.json({
            success: true,
            newBadges,
            stats
        })
    } catch (error) {
        console.error('뱃지 체크 오류:', error)
        return NextResponse.json({ success: false, error: '뱃지 체크 실패' }, { status: 500 })
    }
}

// PATCH /api/user/badges - 뱃지 확인 처리
export async function PATCH(request: NextRequest) {
    try {
        const { userId, badgeIds } = await request.json()

        if (!userId || !badgeIds || !Array.isArray(badgeIds)) {
            return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
        }

        await prisma.userBadge.updateMany({
            where: {
                userId,
                id: { in: badgeIds }
            },
            data: {
                acknowledged: true,
                acknowledgedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('뱃지 확인 처리 오류:', error)
        return NextResponse.json({ success: false, error: '뱃지 확인 처리 실패' }, { status: 500 })
    }
}
