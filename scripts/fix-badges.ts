/**
 * 잘못 부여된 배지 수정 스크립트
 * 
 * 내부 경기에서 팀(Yellow/Blue)을 고려하지 않고 패배 배지가 부여된 선수들을 수정합니다.
 * 1. 모든 FIRST_LOSS 배지를 가진 유저 조회
 * 2. 실제로 패배한 적이 있는지 재계산
 * 3. 패배한 적이 없는 선수의 FIRST_LOSS 배지 삭제
 * 4. 승리한 적이 있지만 FIRST_WIN 배지가 없는 선수에게 FIRST_WIN 배지 부여
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixBadges() {
    console.log('=== 배지 수정 스크립트 시작 ===\n')

    // 1. FIRST_LOSS 배지 정보 조회
    const firstLossBadge = await prisma.badge.findUnique({
        where: { code: 'FIRST_LOSS' }
    })

    const firstWinBadge = await prisma.badge.findUnique({
        where: { code: 'FIRST_WIN' }
    })

    if (!firstLossBadge) {
        console.log('FIRST_LOSS 배지를 찾을 수 없습니다.')
        return
    }

    // 2. FIRST_LOSS 배지를 가진 모든 유저 조회
    const usersWithLossBadge = await prisma.userBadge.findMany({
        where: { badgeId: firstLossBadge.id },
        include: { user: true }
    })

    console.log(`FIRST_LOSS 배지를 가진 유저 수: ${usersWithLossBadge.length}`)

    // 3. 각 유저별로 실제 승/패 재계산
    let removedCount = 0
    let addedWinCount = 0

    for (const userBadge of usersWithLossBadge) {
        const userId = userBadge.userId
        const userName = userBadge.user?.nickname || userBadge.user?.realName || userId

        // 해당 유저가 참석한 올해 완료된 스케줄 조회
        const currentYear = new Date().getFullYear()
        const yearStart = new Date(currentYear, 0, 1)
        yearStart.setHours(0, 0, 0, 0)

        const schedules = await prisma.schedule.findMany({
            where: {
                matchDate: {
                    gte: yearStart,
                    lte: new Date()
                }
            },
            include: {
                attendances: {
                    where: {
                        userId,
                        status: 'ATTENDING'
                    }
                }
            }
        })

        let actualWins = 0
        let actualLosses = 0

        for (const schedule of schedules) {
            if (schedule.attendances.length === 0) continue
            if (schedule.ourScore === null || schedule.opponentScore === null) continue

            // 내부 경기인 경우 팀 확인
            if (schedule.type === 'internal' && schedule.teamFormation) {
                const formation: any = schedule.teamFormation
                const yellowTeam = formation.yellowTeam || []
                const blueTeam = formation.blueTeam || []
                const isOnYellow = yellowTeam.some((p: any) => p.userId === userId)
                const isOnBlue = blueTeam.some((p: any) => p.userId === userId)

                if (!isOnYellow && !isOnBlue) continue

                if (isOnYellow) {
                    if (schedule.ourScore > schedule.opponentScore) actualWins++
                    else if (schedule.ourScore < schedule.opponentScore) actualLosses++
                } else if (isOnBlue) {
                    if (schedule.opponentScore > schedule.ourScore) actualWins++
                    else if (schedule.opponentScore < schedule.ourScore) actualLosses++
                }
            } else {
                // 외부 경기
                if (schedule.ourScore > schedule.opponentScore) actualWins++
                else if (schedule.ourScore < schedule.opponentScore) actualLosses++
            }
        }

        console.log(`\n유저: ${userName}`)
        console.log(`  실제 승: ${actualWins}, 실제 패: ${actualLosses}`)

        // 4. 실제로 패배한 적이 없으면 FIRST_LOSS 배지 삭제
        if (actualLosses === 0) {
            await prisma.userBadge.delete({
                where: { id: userBadge.id }
            })
            console.log(`  ❌ FIRST_LOSS 배지 삭제 (실제 패배 없음)`)
            removedCount++
        } else {
            // 패배한 적이 있으면 acknowledged를 false로 리셋
            await prisma.userBadge.update({
                where: { id: userBadge.id },
                data: { acknowledged: false, acknowledgedAt: null }
            })
            console.log(`  ✓ FIRST_LOSS 배지 유지, acknowledged 리셋`)
        }

        // 5. 승리한 적이 있지만 FIRST_WIN 배지가 없는 경우 추가
        if (actualWins > 0 && firstWinBadge) {
            const hasWinBadge = await prisma.userBadge.findUnique({
                where: {
                    userId_badgeId: {
                        userId,
                        badgeId: firstWinBadge.id
                    }
                }
            })

            if (!hasWinBadge) {
                await prisma.userBadge.create({
                    data: {
                        userId,
                        badgeId: firstWinBadge.id,
                        acknowledged: false
                    }
                })
                console.log(`  ✅ FIRST_WIN 배지 추가`)
                addedWinCount++
            }
        }
    }

    console.log('\n=== 결과 요약 ===')
    console.log(`삭제된 FIRST_LOSS 배지: ${removedCount}`)
    console.log(`추가된 FIRST_WIN 배지: ${addedWinCount}`)
    console.log('=== 스크립트 완료 ===')
}

fixBadges()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
