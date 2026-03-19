import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
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

        const badge = await prisma.badge.findUnique({
            where: {
                code: 'ROOKIE_MEMBER'
            }
        })

        if (!badge) {
            console.log('신입 선수 뱃지를 찾을 수 없습니다.')
            return
        }

        console.log('뱃지 발견:', badge.name, badge.id)

        const existingBadge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId: user.id,
                    badgeId: badge.id
                }
            }
        })

        if (existingBadge) {
            console.log('이미 신입 선수 뱃지를 보유하고 있습니다.')
            return
        }

        const userBadge = await prisma.userBadge.create({
            data: {
                userId: user.id,
                badgeId: badge.id
            }
        })

        console.log('✅ 신입 선수 뱃지 부여 완료!')
        console.log('뱃지 ID:', userBadge.id)
        console.log('부여 시간:', userBadge.earnedAt)
    } catch (error) {
        console.error('오류 발생:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
