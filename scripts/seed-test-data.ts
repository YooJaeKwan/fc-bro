import { PrismaClient } from '@prisma/client'
import { checkEligibleBadges, UserStats } from '../lib/badges'

const prisma = new PrismaClient()

// 유재관 ID (실제 로그인한 사용자의 카카오 ID 등 고유 식별자로 찾거나 생성해야 함)
// 로그에서 확인된 카카오 ID 사용: 4361958168
const TARGET_KAKAO_ID = '4361958168'

async function main() {
    console.log('🚀 테스트 데이터 생성 시작...')

    // 1. 뱃지 데이터 확인
    const badges = await prisma.badge.findMany()
    if (badges.length === 0) {
        console.log('⚠️ 뱃지 데이터가 없습니다. seed-badges.ts를 먼저 실행해주세요.')
        return
    }
    const badgeMap = new Map(badges.map(b => [b.code, b]))

    // 2. 데이터 정리
    console.log('🧹 기존 테스트 데이터 정리 중...')
    await prisma.scheduleAttendance.deleteMany({ where: { user: { kakaoId: { startsWith: 'test_kakao_' } } } })
    await prisma.userBadge.deleteMany({ where: { user: { kakaoId: { startsWith: 'test_kakao_' } } } })
    await prisma.user.deleteMany({ where: { kakaoId: { startsWith: 'test_kakao_' } } })
    await prisma.schedule.deleteMany({ where: { title: { contains: '경기' } } }) // 테스트 일정 삭제

    // 사용자 30명 생성
    const users = []
    console.log('👥 사용자 생성 중...')

    for (let i = 1; i <= 30; i++) {
        const user = await prisma.user.create({
            data: {
                kakaoId: `test_kakao_${i}`,
                provider: 'kakao',
                providerId: `test_kakao_${i}`,
                nickname: `선수${i}`,
                realName: `선수${i}`,
                email: `testuser${i}@example.com`,
                phoneNumber: `010-0000-${String(i).padStart(4, '0')}`,
                birthYear: '1990',
                city: '서울',
                preferredPosition: ['FW', 'MF', 'DF', 'GK'][Math.floor(Math.random() * 4)],
                role: 'MEMBER',
                level: Math.floor(Math.random() * 5) + 1,
                isActive: true
            }
        })
        users.push(user)

        // 신입 선수 뱃지 부여
        await prisma.userBadge.create({
            data: {
                userId: user.id,
                badgeId: badgeMap.get('ROOKIE_MEMBER')!.id,
                earnedAt: new Date()
            }
        })
    }

    // 타겟 유저(유재관) 처리
    let targetUser = await prisma.user.findUnique({ where: { kakaoId: TARGET_KAKAO_ID } })
    if (!targetUser) {
        console.log('👤 유재관 사용자 생성 중...')
        targetUser = await prisma.user.create({
            data: {
                kakaoId: TARGET_KAKAO_ID,
                provider: 'kakao',
                providerId: TARGET_KAKAO_ID,
                nickname: '유재관',
                realName: '유재관',
                phoneNumber: '010-4806-5675',
                birthYear: '1983',
                city: '의왕시',
                preferredPosition: 'RWF',
                subPositions: ['ST', 'LWF'],
                role: 'ADMIN', // 관리자로 생성
                level: 10,
                isActive: true
            }
        })
        // 신입 뱃지
        await prisma.userBadge.create({
            data: {
                userId: targetUser.id,
                badgeId: badgeMap.get('ROOKIE_MEMBER')!.id,
                earnedAt: new Date()
            }
        })
    }
    users.push(targetUser)

    console.log(`✅ 총 ${users.length}명의 사용자 처리 완료`)

    // 3. 일정 생성
    console.log('📅 일정 생성 중...')
    const schedules = []
    const today = new Date()
    const creatorId = users[users.length - 1].id // 마지막에 추가된 targetUser의 ID 사용

    // 과거 일정 10개
    for (let i = 10; i >= 1; i--) {
        const matchDate = new Date(today)
        matchDate.setDate(today.getDate() - (i * 7)) // 1주 간격
        matchDate.setHours(14, 0, 0, 0)

        const schedule = await prisma.schedule.create({
            data: {
                title: `지난 경기 ${i}`,
                type: 'internal',
                matchDate: matchDate,
                startTime: '14:00',
                gatherTime: '13:30',
                location: '테스트 구장',
                status: 'COMPLETED',
                creator: { connect: { id: creatorId } }, // connect 문법 사용
                // 경기 결과 랜덤 생성
                ourScore: Math.floor(Math.random() * 5),
                opponentScore: Math.floor(Math.random() * 5),
                // formationConfirmed 제거 (에러 방지)
            }
        })
        schedules.push(schedule)
    }

    // 미래 일정 10개
    for (let i = 1; i <= 10; i++) {
        const matchDate = new Date(today)
        matchDate.setDate(today.getDate() + (i * 7))
        matchDate.setHours(14, 0, 0, 0)

        const schedule = await prisma.schedule.create({
            data: {
                title: `예정 경기 ${i}`,
                type: 'internal',
                matchDate: matchDate,
                startTime: '14:00',
                gatherTime: '13:30',
                location: '테스트 구장',
                status: 'SCHEDULED',
                creator: { connect: { id: creatorId } } // connect 문법 사용
            }
        })
        // 미래 일정은 teamFormation 등을 생성하지 않음 (참석 투표만)
        schedules.push(schedule) // 목록에는 추가하여 나중에 루프 돌릴 수도 있음
    }

    // 4. 참석 및 팀 편성 처리 (과거 일정)
    console.log('⚽ 참석 및 경기 결과 처리 중...')

    for (const schedule of schedules) {
        if (schedule.status !== 'COMPLETED') continue

        const yellowTeamMembers = []
        const blueTeamMembers = []
        const attendances = []

        // 사용자별 참석 여부 결정 (70% 확률로 참석)
        for (const user of users) {
            if (Math.random() > 0.3) {
                // 참석 처리
                await prisma.scheduleAttendance.create({
                    data: {
                        scheduleId: schedule.id,
                        userId: user.id,
                        status: 'ATTENDING'
                    }
                })
                attendances.push(user)

                // 팀 배정 (반반)
                if (Math.random() > 0.5) {
                    yellowTeamMembers.push({
                        userId: user.id,
                        nickname: user.nickname,
                        position: user.preferredPosition || 'MF'
                    })
                } else {
                    blueTeamMembers.push({
                        userId: user.id,
                        nickname: user.nickname,
                        position: user.preferredPosition || 'MF'
                    })
                }
            } else {
                // 불참 처리
                await prisma.scheduleAttendance.create({
                    data: {
                        scheduleId: schedule.id,
                        userId: user.id,
                        status: 'ABSENT'
                    }
                })
            }
        }

        // 팀 편성 저장
        if (yellowTeamMembers.length > 0 || blueTeamMembers.length > 0) {
            await prisma.schedule.update({
                where: { id: schedule.id },
                data: {
                    teamFormation: {
                        yellowTeam: yellowTeamMembers,
                        blueTeam: blueTeamMembers
                    }
                }
            })
        }
    }

    // 5. 뱃지 부여 로직 실행
    console.log('🏅 뱃지 부여 처리 중...')

    // 모든 일정 다시 조회 (데이터 포함)
    const allSchedules = await prisma.schedule.findMany({
        where: { status: 'COMPLETED' }, // 과거 일정만
        select: {
            id: true, type: true, ourScore: true, opponentScore: true, teamFormation: true,
            attendances: { where: { status: 'ATTENDING' } }
        }
    })

    for (const user of users) {
        // 통계 계산
        const attendedSchedules = allSchedules.filter(s =>
            s.attendances.some(a => a.userId === user.id)
        )

        const attendedMatches = attendedSchedules.length
        const totalMatches = allSchedules.length // 시드된 데이터 기준
        const attendanceRate = totalMatches > 0 ? (attendedMatches / totalMatches) * 100 : 0

        let wins = 0, losses = 0, draws = 0
        let hasWin = false, hasLoss = false, hasDraw = false

        attendedSchedules.forEach(schedule => {
            // @ts-ignore
            const formation = schedule.teamFormation as any
            if (!formation) return

            const yellowTeam = formation.yellowTeam || []
            const blueTeam = formation.blueTeam || []
            const isOnYellow = yellowTeam.some((p: any) => p.userId === user.id)
            const isOnBlue = blueTeam.some((p: any) => p.userId === user.id)

            if (!isOnYellow && !isOnBlue) return

            let result = null
            const ourScore = schedule.ourScore || 0
            const opponentScore = schedule.opponentScore || 0

            if (isOnYellow) {
                if (ourScore > opponentScore) result = 'win'
                else if (ourScore === opponentScore) result = 'draw'
                else result = 'loss'
            } else if (isOnBlue) {
                if (opponentScore > ourScore) result = 'win'
                else if (opponentScore === ourScore) result = 'draw'
                else result = 'loss'
            }

            if (result === 'win') { wins++; hasWin = true }
            if (result === 'draw') { draws++; hasDraw = true }
            if (result === 'loss') { losses++; hasLoss = true }
        })

        const stats: UserStats = {
            totalMatches,
            attendedMatches,
            attendanceRate,
            wins, losses, draws,
            hasWin, hasLoss, hasDraw
        }

        // 현재 보유 뱃지 확인
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: user.id },
            include: { badge: true }
        })
        const existingCodes = userBadges.map(ub => ub.badge.code)

        // 새 뱃지 확인
        const newBadgeCodes = checkEligibleBadges(stats, existingCodes)

        // 뱃지 부여
        for (const code of newBadgeCodes) {
            const badge = badgeMap.get(code)
            if (badge) {
                await prisma.userBadge.create({
                    data: {
                        userId: user.id,
                        badgeId: badge.id,
                        earnedAt: new Date() // 현재 시간 부여
                    }
                })
                process.stdout.write('.')
            }
        }
    }

    console.log('\n✨ 테스트 데이터 생성 완료!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
