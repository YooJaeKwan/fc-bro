import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const badges = [
    // 입문 뱃지 (bronze/silver tier)
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

    // 출석 뱃지 (attendance category)
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
        color: '#475569',
        sortOrder: 12
    },
    {
        code: 'ATTENDANCE_5',
        name: '열정의 시작',
        description: '5경기 출석을 완료했습니다',
        icon: '📅',
        category: 'attendance',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 13
    },
    {
        code: 'ATTENDANCE_10',
        name: '꾸준함의 대명사',
        description: '10경기 출석을 완료했습니다',
        icon: '🏃',
        category: 'attendance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 14
    },
    {
        code: 'ATTENDANCE_20',
        name: '진정한 마니아',
        description: '20경기 출석을 완료했습니다',
        icon: '🏟️',
        category: 'attendance',
        tier: 'gold',
        color: '#F59E0B',
        sortOrder: 15
    },

    // 기록/성적 뱃지 (performance category)
    {
        code: 'GOAL_5',
        name: '득점 기계의 서막',
        description: '팀을 위해 5골을 터뜨렸습니다',
        icon: '⚽',
        category: 'performance',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 21
    },
    {
        code: 'GOAL_10',
        name: '특급 골잡이',
        description: '팀을 위해 10골을 터뜨렸습니다',
        icon: '🔥',
        category: 'performance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 22
    },
    {
        code: 'ASSIST_5',
        name: '최고의 도우미',
        description: '품격 있는 패스로 5도움을 기록했습니다',
        icon: '👟',
        category: 'performance',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 23
    },
    {
        code: 'ASSIST_10',
        name: '도움왕의 품격',
        description: '경기를 지배하며 10도움을 기록했습니다',
        icon: '🪄',
        category: 'performance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 24
    },
    {
        code: 'CLEAN_SHEET_5',
        name: '빗장 수비',
        description: '5회 클린시트를 달성하여 팀을 지켜냈습니다',
        icon: '🔒',
        category: 'performance',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 25
    },
    {
        code: 'CLEAN_SHEET_10',
        name: '철옹성',
        description: '10회 클린시트를 달성한 무결점 수비력',
        icon: '🧱',
        category: 'performance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 26
    },
    {
        code: 'WIN_10',
        name: '숙련된 승리자',
        description: '팀과 함께 10번의 승리를 맛보았습니다',
        icon: '🎖️',
        category: 'performance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 27
    },
    {
        code: 'WIN_20',
        name: '우승 청부사',
        description: '팀과 함께 20번의 승리를 거두었습니다',
        icon: '🥇',
        category: 'performance',
        tier: 'gold',
        color: '#F59E0B',
        sortOrder: 28
    },

    // 베테랑 뱃지
    {
        code: 'VETERAN_50',
        name: '경험 많은 선수',
        description: '50경기를 소화한 베테랑 플레이어',
        icon: '🎖️',
        category: 'veteran',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 51
    },
    {
        code: 'VETERAN_100',
        name: '레전드',
        description: '100경기 이상 출전한 살아있는 전설',
        icon: '💎',
        category: 'veteran',
        tier: 'platinum',
        color: '#475569',
        sortOrder: 52
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
