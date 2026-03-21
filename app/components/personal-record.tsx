"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Trophy, TrendingUp, Calendar as CalendarDays, Award, Target } from "lucide-react"
import { getLevelLabel } from '@/lib/level-system'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface PersonalRecordProps {
    currentUser: any
}

const getPositionColor = (position: string) => {
    switch (position) {
        case 'GK': return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'CB': case 'LB': case 'RB': case 'WB': return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'CM': case 'CDM': case 'CAM': case 'LM': case 'RM': return 'bg-green-50 text-green-700 border-green-200'
        case 'ST': case 'CF': case 'LW': case 'RW': case 'SS': return 'bg-red-50 text-red-700 border-red-200'
        default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
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

export function PersonalRecord({ currentUser }: PersonalRecordProps) {
    const user = currentUser
    const [selectedBadge, setSelectedBadge] = useState<any>(null)
    const [matchStats, setMatchStats] = useState<MatchStats>({ wins: 0, draws: 0, losses: 0, total: 0 })
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ attended: 0, total: 0, rate: 0 })
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
    const [userBadges, setUserBadges] = useState<any[]>([])
    const [personalStats, setPersonalStats] = useState({ goals: 0, assists: 0, cleanSheets: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!currentUser?.id) return
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/dashboard/stats?userId=${currentUser.id}`)
                const result = await response.json()
                if (result.success && result.data) {
                    const { stats, recentMatches, badges } = result.data
                    setAttendanceStats(stats.attendance)
                    setMatchStats(stats.matches)
                    setRecentMatches(recentMatches)
                    setUserBadges(badges)
                    if (stats.personal) setPersonalStats(stats.personal)
                }
            } catch (error) {
                console.error('데이터 조회 오류:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [currentUser?.id])

    if (isLoading) {
        return (
            <Card>
                <CardContent className="space-y-6 pt-6">
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
                    <div className="pb-4 border-b space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
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
                                    <Badge variant="outline" className={`text-xs ${getPositionColor(user.preferredPosition)}`}>
                                        {user.preferredPosition}
                                    </Badge>
                                )}
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
                            {/* 승률 표시 */}
                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-500">승률</span>
                                        <span className="text-sm font-bold text-amber-600">
                                            {matchStats.total > 0
                                                ? Math.round((matchStats.wins / matchStats.total) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${matchStats.total > 0 ? (matchStats.wins / matchStats.total) * 100 : 0}%`,
                                                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{matchStats.wins}W {matchStats.draws}D {matchStats.losses}L</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Records */}
                    <div className="pb-4 border-b">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Target className="h-4 w-4 text-amber-500" />
                                <span>나의 경기 기록</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Goals</div>
                                <div className="text-xl font-black text-slate-800 tabular-nums">
                                    {personalStats.goals}<span className="text-[10px] font-medium text-slate-400 ml-0.5 uppercase">골</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assists</div>
                                <div className="text-xl font-black text-slate-800 tabular-nums">
                                    {personalStats.assists}<span className="text-[10px] font-medium text-slate-400 ml-0.5 uppercase">도움</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clean Sheets</div>
                                <div className="text-xl font-black text-slate-800 tabular-nums text-center">
                                    {personalStats.cleanSheets || 0}<span className="text-[10px] font-medium text-slate-400 ml-0.5 uppercase">회</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Matches */}
                    {recentMatches.length > 0 && (
                        <div className="pb-4 border-b">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <CalendarIcon className="h-4 w-4 text-purple-500" />
                                <span>최근 참석 경기</span>
                            </div>
                            <div className="space-y-2">
                                {recentMatches.map((match, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-slate-700">
                                                {(() => {
                                                    const [year, month, day] = match.date.split('-')
                                                    const date = new Date(Number(year), Number(month) - 1, Number(day))
                                                    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                                                })()}
                                            </div>
                                            <div className="text-[11px] text-slate-400 line-clamp-1">{match.location}</div>
                                        </div>
                                        {match.result && (
                                            <div className={`px-2 py-1 rounded text-[11px] font-bold uppercase transition-colors ${match.result === 'win' ? 'bg-emerald-50 text-emerald-600' :
                                                match.result === 'draw' ? 'bg-slate-100 text-slate-500' :
                                                    'bg-rose-50 text-rose-600'
                                            }`}>
                                                {match.result === 'win' ? 'WIN' : match.result === 'draw' ? 'DRAW' : 'LOSS'}
                                            </div>
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
                                            case 'platinum': return 'bg-slate-50 border-slate-300 ring-1 ring-slate-100'
                                            case 'gold': return 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-100'
                                            case 'silver': return 'bg-gray-50 border-gray-300 ring-1 ring-gray-100'
                                            default: return 'bg-orange-50 border-orange-300 ring-1 ring-orange-100'
                                        }
                                    }
                                    return (
                                        <div key={userBadge.id} onClick={() => setSelectedBadge(badge)} className="flex items-center justify-center">
                                            <div className="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
                                                <div className="w-14 h-14 rounded-full border-2 border-gray-100 bg-white p-1 shadow-sm flex items-center justify-center">
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

            {/* Badge Detail Dialog */}
            <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
                <DialogContent className="w-[85vw] max-w-sm sm:max-w-[320px] p-5 rounded-2xl mx-auto">
                    <DialogHeader className="gap-1">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <span className="text-2xl">{selectedBadge?.icon}</span>
                            <span style={{ color: selectedBadge?.color }}>{selectedBadge?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm pt-1">
                            {selectedBadge?.description}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}
