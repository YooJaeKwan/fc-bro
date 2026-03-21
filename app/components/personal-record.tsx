'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Trophy, Target, TrendingUp, Calendar as CalendarIcon, Award, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface User {
    id: string
    nickname: string | null
    realName: string | null
    profileImage: string | null
    image: string | null
    jerseyNumber: number | null
    preferredPosition: string | null
    level: number
}

interface PersonalStats {
    goals: number
    assists: number
    cleanSheets: number
    noShowCount: number
}

interface AttendanceStats {
    total: number
    attended: number
    rate: number
}

interface MatchStats {
    total: number
    wins: number
    draws: number
    losses: number
}

interface RecentMatch {
    date: string
    location: string
    result: 'win' | 'draw' | 'loss' | null
}

export default function PersonalRecord({ userId }: { userId: string }) {
    const [user, setUser] = useState<User | null>(null)
    const [personalStats, setPersonalStats] = useState<PersonalStats>({ goals: 0, assists: 0, cleanSheets: 0, noShowCount: 0 })
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ total: 0, attended: 0, rate: 0 })
    const [matchStats, setMatchStats] = useState<MatchStats>({ total: 0, wins: 0, draws: 0, losses: 0 })
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
    const [userBadges, setUserBadges] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedBadge, setSelectedBadge] = useState<any>(null)

    useEffect(() => {
        if (!userId) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/dashboard/stats?userId=${userId}`)
                const result = await response.json()
                if (result.success) {
                    setUser(result.data.user)
                    setPersonalStats({
                        goals: result.data.personalStats.goals,
                        assists: result.data.personalStats.assists,
                        cleanSheets: result.data.personalStats.cleanSheets,
                        noShowCount: result.data.personalStats.noShowCount || 0
                    })
                    setAttendanceStats(result.data.attendance)
                    setMatchStats(result.data.matchStats)
                    setRecentMatches(result.data.recentMatches)
                    setUserBadges(result.data.badges || [])
                }
            } catch (error) {
                console.error("데이터 로딩 오류:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [userId])

    const getLevelLabel = (level?: number) => {
        if (!level || level === 0) return 'Lv.1 (Beginner)'
        if (level <= 3) return `Lv.${level} (Beginner)`
        if (level <= 6) return `Lv.${level} (Amateur)`
        if (level <= 9) return `Lv.${level} (Semi-Pro)`
        return `Lv.${level} (Pro)`
    }

    if (isLoading) {
        return (
            <Card className="rounded-2xl border-none shadow-none bg-slate-50/50">
                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center gap-4 pb-6">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden border-none shadow-md rounded-2xl">
                <CardContent className="space-y-6 p-0">
                    {/* User Profile Section with Premium Gradient */}
                    <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-6 text-white relative">
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="relative">
                                <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-2xl">
                                    <AvatarImage src={user?.profileImage || user?.image || "/placeholder.svg"} className="object-cover" />
                                    <AvatarFallback className="bg-blue-400 text-white text-2xl font-black">
                                        {user?.realName?.[0] || user?.nickname?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {user?.jerseyNumber && (
                                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[10px] rounded-full h-7 w-7 flex items-center justify-center font-black shadow-lg border-2 border-white">
                                        {user.jerseyNumber}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-black flex items-center gap-2 mb-1.5 drop-shadow-md">
                                    {user?.realName || user?.nickname || '사용자'}
                                </h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-[10px] font-bold backdrop-blur-sm px-2">
                                        {getLevelLabel(user?.level)}
                                    </Badge>
                                    {user?.preferredPosition && (
                                        <Badge className="bg-amber-400 hover:bg-amber-500 border-none text-slate-900 text-[10px] font-black px-2.5">
                                            {user.preferredPosition}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Sections with modern look */}
                    <div className="px-5 pb-6 space-y-6 -mt-2">
                        {/* Attendance Stats Card */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                                    <span>Season Attendance</span>
                                </div>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{attendanceStats.total} Matches Total</span>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="flex-1">
                                    <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                                            style={{ width: `${attendanceStats.rate}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-2xl font-black text-slate-800 tracking-tighter tabular-nums">
                                        {attendanceStats.rate.toFixed(0)}<span className="text-sm ml-0.5">%</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {attendanceStats.attended} OK / {attendanceStats.total} TOT
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Match Stats Grid Style */}
                        {matchStats.total > 0 && (
                            <div className="bg-slate-50/30 rounded-2xl p-4 border border-slate-100 ring-4 ring-slate-50/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Season Record</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400">{matchStats.total} MATCHES</div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center shadow-sm">
                                        <div className="text-2xl font-black text-emerald-600 mb-0.5 tabular-nums">{matchStats.wins}</div>
                                        <div className="text-[9px] font-black text-emerald-400">WINS</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                                        <div className="text-2xl font-black text-slate-600 mb-0.5 tabular-nums">{matchStats.draws}</div>
                                        <div className="text-[9px] font-black text-slate-400">DRAWS</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-rose-100 text-center shadow-sm">
                                        <div className="text-2xl font-black text-rose-600 mb-0.5 tabular-nums">{matchStats.losses}</div>
                                        <div className="text-[9px] font-black text-rose-400">LOSSES</div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex items-center justify-between gap-4 px-1">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Win Rate</span>
                                            <span className="text-sm font-black text-slate-800">
                                                {matchStats.total > 0 ? Math.round((matchStats.wins / matchStats.total) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm"
                                                style={{ width: `${matchStats.total > 0 ? (matchStats.wins / matchStats.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-500 tabular-nums">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>{matchStats.wins}W {matchStats.draws}D {matchStats.losses}L</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Personal Stats Section */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                                <Target className="h-3.5 w-3.5 text-blue-500" />
                                <span>Player Statistics</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-2">
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 flex flex-col items-center justify-center hover:bg-blue-50/30 transition-colors">
                                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
                                        <Goal className="h-2.5 w-2.5" /> GOALS
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">{personalStats.goals}</div>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 flex flex-col items-center justify-center hover:bg-emerald-50/30 transition-colors">
                                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
                                        <Trophy className="h-2.5 w-2.5" /> ASSISTS
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">{personalStats.assists}</div>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 flex flex-col items-center justify-center hover:bg-indigo-50/30 transition-colors">
                                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
                                        <AlertTriangle className="h-2.5 w-2.5" /> CLEAN
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">{personalStats.cleanSheets || 0}</div>
                                </div>
                            </div>

                            {/* No-show Warning Card INSIDE Section */}
                            {personalStats.noShowCount > 0 && (
                                <div className="mt-4 bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-center justify-between group animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center shadow-lg group-hover:animate-pulse">
                                            <AlertTriangle className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">No-show Warning</p>
                                            <p className="text-[9px] text-red-400 font-medium italic">성실한 참석은 팀의 기본 매너입니다</p>
                                        </div>
                                    </div>
                                    <div className="text-right bg-white p-2 rounded-lg border border-red-100 shadow-sm min-w-[50px]">
                                        <div className="text-2xl font-black text-red-600 leading-none tabular-nums">
                                            {personalStats.noShowCount}
                                            <span className="text-[10px] ml-0.5">회</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Matches Section */}
                        {recentMatches.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                        <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" />
                                        <span>Recent Activity</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">LATEST {recentMatches.length}</span>
                                </div>
                                <div className="space-y-2.5">
                                    {recentMatches.map((match, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100/50 group hover:border-blue-200 transition-all duration-300 active:scale-[0.98]">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="text-[11px] font-black text-slate-800 mb-0.5 uppercase tracking-wide">
                                                    {(() => {
                                                        const [year, month, day] = match.date.split('-')
                                                        const date = new Date(Number(year), Number(month) - 1, Number(day))
                                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                    })()}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 truncate">{match.location}</div>
                                            </div>
                                            {match.result && (
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                    match.result === 'win' ? 'bg-emerald-500 text-white' :
                                                    match.result === 'draw' ? 'bg-slate-400 text-white' :
                                                    'bg-red-500 text-white'
                                                )}>
                                                    {match.result === 'win' ? 'WIN' : match.result === 'draw' ? 'DRAW' : 'LOSS'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Achievements Section - High Quality Grid */}
            {userBadges.length > 0 && (
                <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <Award className="h-3.5 w-3.5 text-amber-500" />
                                <span>Achievements</span>
                            </div>
                            <div className="bg-blue-600 text-white h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-[10px] font-black">{userBadges.length}</div>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                            {userBadges.map((userBadge: any) => {
                                const badge = userBadge.badge
                                const isPlatinum = badge.tier === 'platinum'
                                const isGold = badge.tier === 'gold'
                                return (
                                    <div key={userBadge.id} onClick={() => setSelectedBadge(badge)} className="flex items-center justify-center cursor-pointer group">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl border flex items-center justify-center p-1 transition-all duration-300 group-hover:scale-110 shadow-sm",
                                            isPlatinum ? "bg-slate-50 border-slate-200 ring-2 ring-slate-100" :
                                            isGold ? "bg-amber-50 border-amber-200 ring-2 ring-amber-100 text-amber-600" :
                                            "bg-white border-slate-100 ring-2 ring-slate-50"
                                        )}>
                                            <span className="text-2xl filter drop-shadow-sm select-none">{badge.icon}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Achievement Detail Bottom Sheet Style Dialog */}
            <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
                <DialogContent className="fixed bottom-0 top-auto translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%] w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border-none shadow-[0_-10px_50px_-15px_rgba(0,0,0,0.3)] duration-300">
                    <DialogHeader className="gap-4 text-center">
                        <div className="w-24 h-24 rounded-3xl bg-slate-50 mx-auto flex items-center justify-center text-4xl shadow-inner border-4 border-white ring-8 ring-slate-50/50 mb-2 animate-bounce-slow">
                            {selectedBadge?.icon}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black mb-1" style={{ color: selectedBadge?.color }}>
                                {selectedBadge?.name}
                            </DialogTitle>
                            <Badge variant="outline" className="mb-2 uppercase text-[10px] font-black tracking-widest border-slate-200 text-slate-400">
                                {selectedBadge?.tier} Achievement
                            </Badge>
                        </div>
                        <DialogDescription className="text-sm font-semibold text-slate-500 leading-relaxed px-2 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                            "{selectedBadge?.description}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-8">
                        <Button 
                            className="w-full h-14 rounded-2xl font-black text-base shadow-xl transition-all active:scale-95 border-none text-white hover:brightness-110"
                            style={{ backgroundColor: selectedBadge?.color || '#3b82f6' }}
                            onClick={() => setSelectedBadge(null)}
                        >
                            CLOSE BADGE
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function getPositionColor(position: string) {
    const colors: Record<string, string> = {
        'FW': 'bg-rose-50 text-rose-600 border-rose-200',
        'MF': 'bg-blue-50 text-blue-600 border-blue-200',
        'DF': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'GK': 'bg-amber-50 text-amber-600 border-amber-200'
    }
    return colors[position] || 'bg-gray-50 text-gray-600 border-gray-200'
}

// Icon for Goals/Assists
function Goal(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m12 12 5-5m-5 5-5-5m5 5v10m0-10H2" />
        </svg>
    )
}
