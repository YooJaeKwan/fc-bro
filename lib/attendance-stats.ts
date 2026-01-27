import { prisma } from '@/lib/prisma'

/**
 * Schedule의 참석 통계 카운터를 재계산하여 업데이트합니다.
 * 투표 생성, 수정, 삭제 후에 호출해야 합니다.
 */
export async function updateScheduleAttendanceStats(scheduleId: string) {
    try {
        // 참석 상태별 카운트를 한 번의 쿼리로 가져오기
        const counts = await prisma.scheduleAttendance.groupBy({
            by: ['status'],
            where: { scheduleId },
            _count: true
        })

        const attendingCount = counts.find(c => c.status === 'ATTENDING')?._count ?? 0
        const notAttendingCount = counts.find(c => c.status === 'NOT_ATTENDING')?._count ?? 0
        const pendingCount = counts.find(c => c.status === 'PENDING')?._count ?? 0

        // Schedule 테이블 업데이트
        await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                attendingCount,
                notAttendingCount,
                pendingCount
            }
        })

        return { attendingCount, notAttendingCount, pendingCount }
    } catch (error) {
        console.error('참석 통계 업데이트 실패:', error)
        throw error
    }
}

/**
 * 팀 전체 인원수를 기준으로 pendingCount 계산 (투표하지 않은 인원)
 * 이 버전은 더 정확하지만 추가 쿼리가 필요합니다.
 */
export async function updateScheduleAttendanceStatsWithPending(scheduleId: string) {
    try {
        // 전체 활성 사용자 수 조회
        const totalActiveUsers = await prisma.user.count({
            where: { isActive: true }
        })

        // 참석 상태별 카운트
        const counts = await prisma.scheduleAttendance.groupBy({
            by: ['status'],
            where: { scheduleId },
            _count: true
        })

        const attendingCount = counts.find(c => c.status === 'ATTENDING')?._count ?? 0
        const notAttendingCount = counts.find(c => c.status === 'NOT_ATTENDING')?._count ?? 0

        // 게스트 수 (게스트는 pending에서 제외)
        const guestCount = await prisma.scheduleAttendance.count({
            where: { scheduleId, isGuest: true }
        })

        // 투표하지 않은 인원 = 전체 사용자 - (참석 + 불참 - 게스트 중 참석/불참)
        const votedRegularUsers = attendingCount + notAttendingCount - guestCount
        const pendingCount = Math.max(0, totalActiveUsers - votedRegularUsers)

        await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                attendingCount,
                notAttendingCount,
                pendingCount
            }
        })

        return { attendingCount, notAttendingCount, pendingCount, total: totalActiveUsers }
    } catch (error) {
        console.error('참석 통계 업데이트 실패:', error)
        throw error
    }
}
