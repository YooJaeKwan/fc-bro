import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('모든 사용자에게 신입 뱃지 수여 시작...')

    // 1. ROOKIE_MEMBER 뱃지 찾기
    const rookieBadge = await prisma.badge.findUnique({
        where: { code: 'ROOKIE_MEMBER' }
    })

    if (!rookieBadge) {
        console.error('ROOKIE_MEMBER 뱃지를 찾을 수 없습니다.')
        return
    }

    // 2. 모든 사용자 조회
    const users = await prisma.user.findMany()
    console.log(`총 ${users.length}명의 사용자 발견`)

    let awardedCount = 0

    // 3. 각 사용자에게 뱃지 부여
    for (const user of users) {
        try {
            // upsert를 사용하여 이미 있는 경우 통과
            await prisma.userBadge.upsert({
                where: {
                    userId_badgeId: {
                        userId: user.id,
                        badgeId: rookieBadge.id
                    }
                },
                update: {}, // 이미 존재하면 아무것도 안 함
                create: {
                    userId: user.id,
                    badgeId: rookieBadge.id,
                    earnedAt: new Date() // 현재 시간으로 부여
                }
            })
            awardedCount++
        } catch (error) {
            console.error(`사용자 ${user.id}에게 뱃지 부여 실패:`, error)
        }
    }

    console.log(`✅ 작업을 완료했습니다. (처리된 사용자: ${awardedCount}명)`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
