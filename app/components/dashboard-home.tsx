"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPin, Trophy, TrendingUp, Calendar as CalendarDays, Award } from "lucide-react"
import { AttendanceVoting } from "./attendance-voting"
import { getLevelLabel } from '@/lib/level-system'
import { BadgeNotification } from './badge-notification'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardHomeProps {
    currentUser: any
    onUserUpdate?: (updatedUser: any) => void
}

interface MatchStats {
    wins: number
    draws: number
    losses: number
    total: number
}

interface AttendanceStats {
    attended: number
    total: number
    rate: number
}

interface RecentMatch {
    date: string
    type: string
    location: string
    result?: 'win' | 'draw' | 'loss'
}

interface UserBadge {
    id: string
    badgeType: string
    earnedAt: string
    info: {
        name: string
        emoji: string
        description: string
    }
}

export function DashboardHome({ currentUser }: DashboardHomeProps) {
    const [nextSchedule, setNextSchedule] = useState<any>(null)
    const [selectedBadge, setSelectedBadge] = useState<any>(null)
    const [matchStats, setMatchStats] = useState<MatchStats>({ wins: 0, draws: 0, losses: 0, total: 0 })
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ attended: 0, total: 0, rate: 0 })
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
    const [userBadges, setUserBadges] = useState<UserBadge[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/schedule/list')
                const result = await response.json()

                if (result.success && result.schedules.length > 0) {
                    const now = new Date()
                    now.setHours(0, 0, 0, 0)

                    // Find next schedule
                    const upcoming = result.schedules
                        .filter((schedule: any) => {
                            const [year, month, day] = schedule.date.split('-')
                            const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day))
                            scheduleDate.setHours(0, 0, 0, 0)
                            return scheduleDate >= now
                        })
                        .sort((a: any, b: any) => {
                            const [yearA, monthA, dayA] = a.date.split('-')
                            const [yearB, monthB, dayB] = b.date.split('-')
                            const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA))
                            const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB))
                            return dateA.getTime() - dateB.getTime()
                        })

                    if (upcoming.length > 0) {
                        setNextSchedule(upcoming[0])
                    }

                    // Calculate attendance stats for this year
                    const currentYear = new Date().getFullYear()
                    const yearStart = new Date(currentYear, 0, 1)
                    yearStart.setHours(0, 0, 0, 0)

                    const thisYearSchedules = result.schedules.filter((schedule: any) => {
                        const [year] = schedule.date.split('-')
                        return Number(year) === currentYear
                    })

                    let attendedCount = 0
                    thisYearSchedules.forEach((schedule: any) => {
                        const hasAttended = schedule.attendances.some((att: any) =>
                            att.userId === currentUser?.id && att.status === 'ATTENDING'
                        )
                        if (hasAttended) attendedCount++
                    })

                    const totalThisYear = thisYearSchedules.length
                    setAttendanceStats({
                        attended: attendedCount,
                        total: totalThisYear,
                        rate: totalThisYear > 0 ? (attendedCount / totalThisYear) * 100 : 0
                    })

                    // Calculate match statistics and recent matches
                    const pastMatches = result.schedules.filter((schedule: any) => {
                        const [year, month, day] = schedule.date.split('-')
                        const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day))
                        scheduleDate.setHours(0, 0, 0, 0)
                        return scheduleDate < now
                    }).sort((a: any, b: any) => {
                        const [yearA, monthA, dayA] = a.date.split('-')
                        const [yearB, monthB, dayB] = b.date.split('-')
                        const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA))
                        const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB))
                        return dateB.getTime() - dateA.getTime() // Most recent first
                    })

                    let wins = 0, draws = 0, losses = 0
                    const recentMatchesList: RecentMatch[] = []

                    pastMatches.forEach((match: any) => {
                        // Check if user participated
                        const hasAttended = match.attendances.some((att: any) =>
                            att.userId === currentUser?.id && att.status === 'ATTENDING'
                        )

                        if (hasAttended && recentMatchesList.length < 3) {
                            let result: 'win' | 'draw' | 'loss' | undefined = undefined

                            if (match.type === 'internal' && match.teamFormation &&
                                match.ourScore !== null && match.ourScore !== undefined &&
                                match.opponentScore !== null && match.opponentScore !== undefined) {

                                const formation = match.teamFormation
                                const yellowTeam = formation.yellowTeam || []
                                const blueTeam = formation.blueTeam || []
                                const isOnYellow = yellowTeam.some((player: any) => player.userId === currentUser?.id)
                                const isOnBlue = blueTeam.some((player: any) => player.userId === currentUser?.id)

                                if (isOnYellow) {
                                    if (match.ourScore > match.opponentScore) result = 'win'
                                    else if (match.ourScore === match.opponentScore) result = 'draw'
                                    else result = 'loss'
                                } else if (isOnBlue) {
                                    if (match.opponentScore > match.ourScore) result = 'win'
                                    else if (match.opponentScore === match.ourScore) result = 'draw'
                                    else result = 'loss'
                                }
                            }

                            recentMatchesList.push({
                                date: match.date,
                                type: match.type,
                                location: match.location || '',
                                result
                            })
                        }

                        //Calculate match stats (only internal matches with results)
                        if (match.type === 'internal' && match.teamFormation &&
                            match.ourScore !== null && match.ourScore !== undefined &&
                            match.opponentScore !== null && match.opponentScore !== undefined) {

                            const formation = match.teamFormation
                            const yellowTeam = formation.yellowTeam || []
                            const blueTeam = formation.blueTeam || []
                            const isOnYellow = yellowTeam.some((player: any) => player.userId === currentUser?.id)
                            const isOnBlue = blueTeam.some((player: any) => player.userId === currentUser?.id)

                            if (!isOnYellow && !isOnBlue) return

                            if (isOnYellow) {
                                if (match.ourScore > match.opponentScore) wins++
                                else if (match.ourScore === match.opponentScore) draws++
                                else losses++
                            } else if (isOnBlue) {
                                if (match.opponentScore > match.ourScore) wins++
                                else if (match.opponentScore === match.ourScore) draws++
                                else losses++
                            }
                        }
                    })

                    setMatchStats({ wins, draws, losses, total: wins + draws + losses })
                    setRecentMatches(recentMatchesList)

                    // Fetch user badges
                    const badgesResponse = await fetch(`/api/user/badges?userId=${currentUser.id}`)
                    const badgesData = await badgesResponse.json()
                    if (badgesData.success) {
                        setUserBadges(badgesData.badges)
                    }

                    // Check for new badges
                    await fetch('/api/user/badges/check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id })
                    })
                }
            } catch (error) {
                console.error('데이터 조회 오류:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (currentUser?.id) {
            fetchData()
        }
    }, [currentUser?.id])

    const calculateDaysLeft = (dateString: string) => {
        const [year, month, day] = dateString.split('-')
        const targetDate = new Date(Number(year), Number(month) - 1, Number(day))
        targetDate.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const diffTime = targetDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return diffDays
    }

    // Position indicator color
    const getPositionIndicatorColor = (position: string) => {
        const positionMapping: Record<string, string> = {
            "GK": "골키퍼", "DC": "수비수", "CB": "수비수", "DR": "수비수", "RB": "수비수",
            "DL": "수비수", "LB": "수비수", "LRB": "수비수", "LRCB": "수비수",
            "DM": "미드필더", "CDM": "미드필더", "MC": "미드필더", "CM": "미드필더",
            "AMC": "미드필더", "CAM": "미드필더",
            "ST": "공격수", "CF": "공격수", "SS": "공격수", "LWF": "공격수", "RWF": "공격수"
        }
        const positionType = positionMapping[position] || position
        switch (positionType) {
            case "골키퍼": return "bg-yellow-500"
            case "수비수": return "bg-blue-500"
            case "미드필더": return "bg-green-500"
            case "공격수": return "bg-red-500"
            default: return "bg-gray-400"
        }
    }

    const user = currentUser

    return (
        <div className="space-y-6">
            {/* Badge Notification */}
            {currentUser?.id && <BadgeNotification userId={currentUser.id} />}





            {/* Next Schedule Skeleton */}
            {isLoading && (
                <Card className="border-l-4 border-l-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <CalendarIcon className="h-5 w-5 text-gray-300" />
                            <Skeleton className="h-6 w-24" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center">
                            <Skeleton className="h-8 w-32 rounded-full" />
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Next Schedule */}
            {!isLoading && nextSchedule && (
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <CalendarIcon className="h-5 w-5" />
                            다음 일정
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* D-Day Display */}
                        <div className="flex items-center justify-center gap-3">
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                                <CalendarIcon className="h-4 w-4" />
                                {(() => {
                                    const daysLeft = calculateDaysLeft(nextSchedule.date)
                                    if (daysLeft === 0) return "오늘 경기!"
                                    if (daysLeft === 1) return "내일 경기!"
                                    if (daysLeft > 0) return `D-${daysLeft}`
                                    return "지난 경기"
                                })()}
                            </div>
                        </div>

                        {/* Schedule Info */}
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold">
                                {(() => {
                                    const [year, month, day] = nextSchedule.date.split('-')
                                    const date = new Date(Number(year), Number(month) - 1, Number(day))
                                    return date.toLocaleDateString('ko-KR', {
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'short'
                                    })
                                })()} {nextSchedule.time}
                            </h3>
                            {nextSchedule.location && (
                                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{nextSchedule.location}</span>
                                </div>
                            )}
                            {nextSchedule.description && (
                                <p className="text-sm text-muted-foreground">{nextSchedule.description}</p>
                            )}
                        </div>

                        {/* Attendance Voting */}
                        {currentUser?.id && (
                            <div className="mt-4">
                                <AttendanceVoting
                                    scheduleId={nextSchedule.id}
                                    currentUserId={currentUser.id}
                                    isManagerMode={currentUser.role === 'ADMIN'}
                                    isPastSchedule={calculateDaysLeft(nextSchedule.date) < 0}
                                    onVoteUpdate={() => {
                                        // Refresh data when vote is updated
                                        if (currentUser?.id) {
                                            fetch('/api/schedule/list')
                                                .then(res => res.json())
                                                .then(result => {
                                                    if (result.success && result.schedules.length > 0) {
                                                        const now = new Date()
                                                        now.setHours(0, 0, 0, 0)

                                                        // Update next schedule
                                                        const upcoming = result.schedules
                                                            .filter((schedule: any) => {
                                                                const [year, month, day] = schedule.date.split('-')
                                                                const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day))
                                                                scheduleDate.setHours(0, 0, 0, 0)
                                                                return scheduleDate >= now
                                                            })
                                                            .sort((a: any, b: any) => {
                                                                const [yearA, monthA, dayA] = a.date.split('-')
                                                                const [yearB, monthB, dayB] = b.date.split('-')
                                                                const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA))
                                                                const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB))
                                                                return dateA.getTime() - dateB.getTime()
                                                            })
                                                        if (upcoming.length > 0) {
                                                            setNextSchedule(upcoming[0])
                                                        }

                                                        // Update attendance stats
                                                        const currentYear = new Date().getFullYear()
                                                        const thisYearSchedules = result.schedules.filter((schedule: any) => {
                                                            const [year] = schedule.date.split('-')
                                                            return Number(year) === currentYear
                                                        })

                                                        let attendedCount = 0
                                                        thisYearSchedules.forEach((schedule: any) => {
                                                            const hasAttended = schedule.attendances.some((att: any) =>
                                                                att.userId === currentUser?.id && att.status === 'ATTENDING'
                                                            )
                                                            if (hasAttended) attendedCount++
                                                        })

                                                        const totalThisYear = thisYearSchedules.length
                                                        setAttendanceStats({
                                                            attended: attendedCount,
                                                            total: totalThisYear,
                                                            rate: totalThisYear > 0 ? (attendedCount / totalThisYear) * 100 : 0
                                                        })
                                                    }
                                                })
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!isLoading && !nextSchedule && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            다음 일정이 없습니다.
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Card Skeleton */}
            {isLoading && (
                <Card>
                    <CardContent className="space-y-6 pt-6">
                        {/* Profile Skeleton */}
                        <div className="flex items-center gap-4 pb-6 border-b">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            </div>
                        </div>

                        {/* Attendance Skeleton */}
                        <div className="pb-4 border-b space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-3 w-full rounded-full" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>

                        {/* Stats Grid Skeleton */}
                        <div className="pb-4 border-b space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        </div>

                        {/* Badges Skeleton */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex justify-center">
                                        <Skeleton className="h-14 w-14 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Integrated Statistics Card */}
            {!isLoading && (
                <Card>
                    <CardContent className="space-y-6 pt-6">
                        {/* User Profile Section */}
                        <div className="flex items-center gap-4 pb-6 border-b">
                            <div className="relative">
                                <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                                    <AvatarImage src={user?.profileImage || user?.image || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl font-bold">
                                        {user?.realName?.[0] || user?.nickname?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {user?.jerseyNumber && (
                                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md border-2 border-white">
                                        {user.jerseyNumber}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                                        {user?.realName || user?.nickname || '사용자'}
                                    </h2>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${(() => {
                                                const level = user?.level || 1
                                                if (level === 1) return 'bg-gray-50 text-gray-600 border-gray-200'
                                                if (level <= 6) return 'bg-blue-50 text-blue-600 border-blue-200'
                                                if (level <= 9) return 'bg-purple-50 text-purple-600 border-purple-200'
                                                return 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                            })()}`}
                                        >
                                            {getLevelLabel(user?.level)}
                                        </Badge>
                                        {user?.preferredPosition && (
                                            <Badge className="text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm">
                                                {user.preferredPosition}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Rate */}
                        <div className="pb-4 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                    <span>올해 출석률</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{attendanceStats.total}경기</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                            style={{ width: `${attendanceStats.rate}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{attendanceStats.rate.toFixed(0)}%</div>
                                    <div className="text-xs text-muted-foreground">{attendanceStats.attended}/{attendanceStats.total}</div>
                                </div>
                            </div>
                        </div>

                        {/* Match Statistics */}
                        {matchStats.total > 0 && (
                            <div className="pb-4 border-b">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        <span>경기 전적</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{matchStats.total}경기</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-xl font-bold text-green-600">{matchStats.wins}</div>
                                        <div className="text-xs text-green-600">승</div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-xl font-bold text-gray-600">{matchStats.draws}</div>
                                        <div className="text-xs text-gray-600">무</div>
                                    </div>
                                    <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                                        <div className="text-xl font-bold text-red-600">{matchStats.losses}</div>
                                        <div className="text-xs text-red-600">패</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Matches */}
                        {recentMatches.length > 0 && (
                            <div className="pb-4 border-b">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <CalendarIcon className="h-4 w-4 text-purple-500" />
                                    <span>최근 참석 경기</span>
                                </div>
                                <div className="space-y-2">
                                    {recentMatches.map((match, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                    {(() => {
                                                        const [year, month, day] = match.date.split('-')
                                                        const date = new Date(Number(year), Number(month) - 1, Number(day))
                                                        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                                                    })()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{match.location}</div>
                                            </div>
                                            {match.result && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${match.result === 'win' ? 'bg-green-50 text-green-600 border-green-200' :
                                                        match.result === 'draw' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                            'bg-red-50 text-red-600 border-red-200'
                                                        }`}
                                                >
                                                    {match.result === 'win' ? '승' : match.result === 'draw' ? '무' : '패'}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Badges Section */}
                        {userBadges.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Award className="h-4 w-4 text-blue-500" />
                                        <span>획득 업적</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{userBadges.length}개</span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    {userBadges.map((userBadge: any) => {
                                        const badge = userBadge.badge
                                        const getTierStyles = (tier: string) => {
                                            switch (tier) {
                                                case 'platinum':
                                                    return 'bg-slate-50 border-slate-300 ring-1 ring-slate-100'
                                                case 'gold':
                                                    return 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-100'
                                                case 'silver':
                                                    return 'bg-gray-50 border-gray-300 ring-1 ring-gray-100'
                                                default: // bronze
                                                    return 'bg-orange-50 border-orange-300 ring-1 ring-orange-100'
                                            }
                                        }

                                        return (
                                            <div
                                                key={userBadge.id}
                                                onClick={() => setSelectedBadge(badge)}
                                                className="flex items-center justify-center"
                                            >
                                                <div className="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
                                                    {/* Outer Ring */}
                                                    <div className="w-14 h-14 rounded-full border-2 border-gray-100 bg-white p-1 shadow-sm flex items-center justify-center">
                                                        {/* Inner Circle with Tier Style */}
                                                        <div className={`w-full h-full rounded-full flex items-center justify-center border-2 ${getTierStyles(badge.tier)}`}>
                                                            <span className="text-xl select-none leading-none pt-0.5">{badge.icon}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Badge Detail Dialog */}
            <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
                <DialogContent className="sm:max-w-[320px] p-5 rounded-2xl">
                    <DialogHeader className="gap-1">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <span className="text-2xl">{selectedBadge?.icon}</span>
                            <span style={{ color: selectedBadge?.color }}>{selectedBadge?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm pt-1">
                            {selectedBadge?.description}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedBadge?.tier && (
                        <div className="flex justify-end mt-3">
                            <Badge variant="outline" className={`
                                text-[10px] px-2 py-0.5 h-5
                                ${selectedBadge.tier === 'platinum' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                    selectedBadge.tier === 'gold' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                        selectedBadge.tier === 'silver' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                            'bg-orange-50 text-orange-800 border-orange-300'}
                            `}>
                                {(() => {
                                    switch (selectedBadge.tier) {
                                        case 'platinum': return '플래티넘 등급'
                                        case 'gold': return '골드 등급'
                                        case 'silver': return '실버 등급'
                                        default: return '브론즈 등급'
                                    }
                                })()}
                            </Badge>
                        </div>
                    )}
                </DialogContent>
            </Dialog>



        </div>
    )
}
