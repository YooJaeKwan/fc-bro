import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 다음 일정 찾기 (오늘 이후 가장 가까운 일정)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const nextSchedule = await prisma.schedule.findFirst({
        where: {
            matchDate: { gte: now }
        },
        orderBy: { matchDate: 'asc' }
    })

    if (!nextSchedule) {
        console.log('다음 일정이 없습니다.')
        return
    }

    console.log('다음 일정:', nextSchedule.title, nextSchedule.matchDate)

    // 테스트 사용자 25명 가져오기
    const users = await prisma.user.findMany({
        where: { kakaoId: { startsWith: 'test_kakao_' } },
        take: 25
    })

    console.log('투표할 사용자:', users.length, '명')

    // 기존 참석 기록 삭제 후 새로 생성
    await prisma.scheduleAttendance.deleteMany({
        where: { scheduleId: nextSchedule.id }
    })

    // 25명 참석 투표
    for (const user of users) {
        await prisma.scheduleAttendance.create({
            data: {
                scheduleId: nextSchedule.id,
                userId: user.id,
                status: 'ATTENDING'
            }
        })
    }

    console.log('✅ 25명 참석 투표 완료!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
