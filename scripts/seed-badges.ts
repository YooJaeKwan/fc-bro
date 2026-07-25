import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const badges = [
    {
        code: 'ATTENDANCE_5',
        name: '5경기 출석',
        description: '5경기 출석을 완료했습니다',
        icon: '🥉',
        category: 'attendance',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 1,
        isActive: true
    },
    {
        code: 'ATTENDANCE_10',
        name: '10경기 출석',
        description: '10경기 출석을 완료했습니다',
        icon: '🥉',
        category: 'attendance',
        tier: 'bronze',
        color: '#CD7F32',
        sortOrder: 2,
        isActive: true
    },
    {
        code: 'ATTENDANCE_15',
        name: '15경기 출석',
        description: '15경기 출석을 완료했습니다',
        icon: '🥈',
        category: 'attendance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 3,
        isActive: true
    },
    {
        code: 'ATTENDANCE_20',
        name: '20경기 출석',
        description: '20경기 출석을 완료했습니다',
        icon: '🥈',
        category: 'attendance',
        tier: 'silver',
        color: '#9CA3AF',
        sortOrder: 4,
        isActive: true
    },
    {
        code: 'ATTENDANCE_25',
        name: '25경기 출석',
        description: '25경기 출석을 완료했습니다',
        icon: '🥇',
        category: 'attendance',
        tier: 'gold',
        color: '#F59E0B',
        sortOrder: 5,
        isActive: true
    },
    {
        code: 'ATTENDANCE_30',
        name: '30경기 출석',
        description: '30경기 출석을 완료했습니다',
        icon: '🥇',
        category: 'attendance',
        tier: 'gold',
        color: '#F59E0B',
        sortOrder: 6,
        isActive: true
    },
    {
        code: 'ATTENDANCE_35',
        name: '35경기 출석',
        description: '35경기 출석을 완료했습니다',
        icon: '⭐',
        category: 'attendance',
        tier: 'gold',
        color: '#F59E0B',
        sortOrder: 7,
        isActive: true
    },
    {
        code: 'ATTENDANCE_40',
        name: '40경기 출석',
        description: '40경기 출석을 완료했습니다',
        icon: '🔥',
        category: 'attendance',
        tier: 'platinum',
        color: '#8B5CF6',
        sortOrder: 8,
        isActive: true
    },
    {
        code: 'ATTENDANCE_45',
        name: '45경기 출석',
        description: '45경기 출석을 완료했습니다',
        icon: '🎖️',
        category: 'attendance',
        tier: 'platinum',
        color: '#8B5CF6',
        sortOrder: 9,
        isActive: true
    },
    {
        code: 'ATTENDANCE_50',
        name: '50경기 출석',
        description: '50경기 출석을 완료했습니다',
        icon: '👑',
        category: 'attendance',
        tier: 'platinum',
        color: '#3B82F6',
        sortOrder: 10,
        isActive: true
    }
]

async function main() {
    console.log('출석 뱃지 데이터 시드 시작...')

    const activeCodes = badges.map(b => b.code)

    // 다른 모든 뱃지는 비활성화 처리
    await prisma.badge.updateMany({
        where: {
            code: { notIn: activeCodes }
        },
        data: {
            isActive: false
        }
    })

    for (const badgeData of badges) {
        const badge = await prisma.badge.upsert({
            where: { code: badgeData.code },
            update: badgeData,
            create: badgeData
        })
        console.log(`✓ ${badge.name} (${badge.code})`)
    }

    console.log(`\n✅ 총 ${badges.length}개의 출석 뱃지가 생성/업데이트되었습니다!`)
}

main()
    .catch((e) => {
        console.error('오류 발생:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
