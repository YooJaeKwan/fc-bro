import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const badges = [
    // 입문 뱃지 (bronze tier)
    {
        code: 'ROOKIE_MEMBER',
        name: '팀의 새 식구',
        description: '팀에 처음 합류했습니다',
        icon: '🎯',
        category: 'rookie',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 1
    },
    {
        code: 'FIRST_MATCH',
        name: '데뷔전',
        description: '첫 경기에 출전했습니다',
        icon: '⚡',
        category: 'rookie',
        tier: 'bronze',
        color: '#10B981',
        sortOrder: 2
    },
    {
        code: 'FIRST_WIN',
        name: '첫 승리',
        description: '첫 승리의 짜릿함을 경험했습니다',
        icon: '🏆',
        category: 'rookie',
        tier: 'silver',
        color: '#F59E0B',
        sortOrder: 3
    },
    {
        code: 'FIRST_LOSS',
        name: '패배의 교훈',
        description: '패배를 발판 삼아 성장했습니다',
        icon: '💪',
        category: 'rookie',
        tier: 'bronze',
        color: '#6366F1',
        sortOrder: 4
    },
    {
        code: 'FIRST_DRAW',
        name: '첫 무승부',
        description: '팽팽한 접전을 경험했습니다',
        icon: '🤝',
        category: 'rookie',
        tier: 'bronze',
        color: '#8B5CF6',
        sortOrder: 5
    },

    // 출석 뱃지 (gold/platinum tier)
    {
        code: 'ATTENDANCE_STAR',
        name: '열정 플레이어',
        description: '출석률 80% 이상을 기록했습니다',
        icon: '⭐',
        category: 'attendance',
        tier: 'gold',
        color: '#EAB308',
        sortOrder: 11
    },
    {
        code: 'ATTENDANCE_KING',
        name: '완벽한 출석',
        description: '출석률 90% 이상! 팀의 핵심 멤버입니다',
        icon: '👑',
        category: 'attendance',
        tier: 'platinum',
        color: '#E5E7EB',
        sortOrder: 12
    },

    // 성적 뱃지 (silver/platinum tier)
    {
        code: 'VETERAN_50',
        name: '경험 많은 선수',
        description: '50경기를 소화한 베테랑 플레이어',
        icon: '🎖️',
        category: 'performance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 21
    },
    {
        code: 'VETERAN_100',
        name: '레전드',
        description: '100경기 이상 출전한 살아있는 전설',
        icon: '💎',
        category: 'performance',
        tier: 'platinum',
        color: '#E5E7EB',
        sortOrder: 22
    }
]

async function main() {
    console.log('뱃지 데이터 시드 시작...')

    for (const badgeData of badges) {
        const badge = await prisma.badge.upsert({
            where: { code: badgeData.code },
            update: badgeData,
            create: badgeData
        })
        console.log(`✓ ${badge.name} (${badge.code})`)
    }

    console.log(`\n✅ 총 ${badges.length}개의 뱃지가 생성/업데이트되었습니다!`)
}

main()
    .catch((e) => {
        console.error('오류 발생:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
