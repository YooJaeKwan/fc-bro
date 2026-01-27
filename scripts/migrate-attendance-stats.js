/**
 * 기존 Schedule 데이터의 참석 통계 필드를 채우는 마이그레이션 스크립트
 * 
 * 사용법:
 *   npx ts-node scripts/migrate-attendance-stats.ts
 * 
 * 또는 개발 환경에서:
 *   npx tsx scripts/migrate-attendance-stats.ts
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateAttendanceStats() {
    console.log('참석 통계 마이그레이션 시작...')

    try {
        // 모든 스케줄 조회
        const schedules = await prisma.schedule.findMany({
            select: { id: true, title: true }
        })

        console.log(`총 ${schedules.length}개 스케줄 처리 예정`)

        // 전체 활성 사용자 수
        const totalActiveUsers = await prisma.user.count({
            where: { isActive: true }
        })
        console.log(`전체 활성 사용자: ${totalActiveUsers}명`)

        let processed = 0

        for (const schedule of schedules) {
            // 참석 상태별 카운트
            const counts = await prisma.scheduleAttendance.groupBy({
                by: ['status'],
                where: { scheduleId: schedule.id },
                _count: true
            })

            const attendingCount = counts.find(c => c.status === 'ATTENDING')?._count ?? 0
            const notAttendingCount = counts.find(c => c.status === 'NOT_ATTENDING')?._count ?? 0

            // 게스트 수 조회
            const guestCount = await prisma.scheduleAttendance.count({
                where: { scheduleId: schedule.id, isGuest: true }
            })

            // 투표한 일반 사용자 수 (전체 투표 수 - 게스트 수)
            const votedCount = attendingCount + notAttendingCount - guestCount
            const pendingCount = Math.max(0, totalActiveUsers - votedCount)

            // Schedule 업데이트
            await prisma.schedule.update({
                where: { id: schedule.id },
                data: {
                    attendingCount,
                    notAttendingCount,
                    pendingCount
                }
            })

            processed++
            if (processed % 10 === 0 || processed === schedules.length) {
                console.log(`진행: ${processed}/${schedules.length}`)
            }
        }

        console.log('마이그레이션 완료!')
        console.log(`처리된 스케줄: ${processed}개`)

    } catch (error) {
        console.error('마이그레이션 실패:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

migrateAttendanceStats()
