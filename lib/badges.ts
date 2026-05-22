export interface UserStats {
    totalMatches: number
    attendedMatches: number
    attendanceRate: number
    wins: number
    losses: number
    draws: number
    hasWin: boolean
    hasLoss: boolean
    hasDraw: boolean
}

/**
 * 사용자의 통계를 기반으로 획득해야 할 뱃지 코드 목록을 반환
 */
export function checkEligibleBadges(stats: UserStats, existingBadgeCodes: string[]): string[] {
    const newBadges: string[] = []

    // 첫 출전 (첫 참석)
    if (stats.attendedMatches >= 1 && !existingBadgeCodes.includes('FIRST_MATCH')) {
        newBadges.push('FIRST_MATCH')
    }


    // 출석률 뱃지 (성실왕 우선)
    if (stats.totalMatches >= 5) { // 최소 5경기 이상 참여 시
        if (stats.attendanceRate >= 90 && !existingBadgeCodes.includes('ATTENDANCE_KING')) {
            newBadges.push('ATTENDANCE_KING')
        } else if (stats.attendanceRate >= 80 && stats.attendanceRate < 90 && !existingBadgeCodes.includes('ATTENDANCE_STAR')) {
            newBadges.push('ATTENDANCE_STAR')
        }
    }

    // 백전노장 (50경기)
    if (stats.attendedMatches >= 50 && !existingBadgeCodes.includes('VETERAN_50')) {
        newBadges.push('VETERAN_50')
    }

    // 베테랑 (100경기)
    if (stats.attendedMatches >= 100 && !existingBadgeCodes.includes('VETERAN_100')) {
        newBadges.push('VETERAN_100')
    }

    return newBadges
}
