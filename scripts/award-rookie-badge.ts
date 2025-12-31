import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // 유재관 사용자 찾기
        const user = await prisma.user.findFirst({
            where: {
                realName: '유재관'
            }
        })

        if (!user) {
            console.log('유재관 사용자를 찾을 수 없습니다.')
            return
        }

        console.log('사용자 발견:', user.realName, user.id)

        // 이미 신입 선수 뱃지가 있는지 확인
        const existingBadge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeType: {
                    userId: user.id,
                    badgeType: 'ROOKIE_MEMBER'
                }
            }
        })

        if (existingBadge) {
            console.log('이미 신입 선수 뱃지를 보유하고 있습니다.')
            return
        }

        // 신입 선수 뱃지 부여
        const badge = await prisma.userBadge.create({
            data: {
                userId: user.id,
                badgeType: 'ROOKIE_MEMBER'
            }
        })

        console.log('✅ 신입 선수 뱃지 부여 완료!')
        console.log('뱃지 ID:', badge.id)
        console.log('부여 시간:', badge.earnedAt)
    } catch (error) {
        console.error('오류 발생:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
