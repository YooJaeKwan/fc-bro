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
    const attended = stats.attendedMatches

    const thresholds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    for (const count of thresholds) {
        const code = `ATTENDANCE_${count}`
        if (attended >= count && !existingBadgeCodes.includes(code)) {
            newBadges.push(code)
        }
    }

    return newBadges
}
