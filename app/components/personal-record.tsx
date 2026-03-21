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
import { getLevelLabel, getLevelColor } from '@/lib/level-system'

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
    const [newBadges, setNewBadges] = useState<any[]>([])
    const [showNewBadgeDialog, setShowNewBadgeDialog] = useState(false)

    useEffect(() => {
        if (!userId) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/dashboard/stats?userId=${userId}`)
                const result = await response.json()
                if (result.success) {
                    const { user: userData, stats, recentMatches: recent, badges } = result.data
                    setUser(userData)
                    setPersonalStats({
                        goals: stats.personal.goals,
                        assists: stats.personal.assists,
                        cleanSheets: stats.personal.cleanSheets,
                        noShowCount: stats.personal.noShowCount || 0
                    })
                    setAttendanceStats(stats.attendance)
                    setMatchStats(stats.matches)
                    setRecentMatches(recent)
                    setUserBadges(badges || [])
                    
                    // 신규 뱃지가 있으면 다이얼로그 표시
                    if (result.data.newBadges && result.data.newBadges.length > 0) {
                        setNewBadges(result.data.newBadges)
                        setShowNewBadgeDialog(true)
                    }
                }
            } catch (error) {
                console.error("데이터 로딩 오류:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [userId])

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

    const winRate = matchStats.total > 0 ? Math.round((matchStats.wins / matchStats.total) * 100) : 0

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden border border-slate-100 shadow-sm rounded-2xl bg-white">
                <CardContent className="p-5 space-y-6">
                    {/* User Profile */}
                    <div className="flex items-center gap-4 pb-4 border-b">
                        <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm">
                            <AvatarImage src={user?.profileImage || user?.image || ""} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                {user?.realName?.[0] || user?.nickname?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-slate-900">{user?.realName || user?.nickname || '사용자'}</h2>
                                {user?.jerseyNumber && (
                                    <span className="text-blue-500 font-black text-sm">No.{user.jerseyNumber}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("text-[10px] h-5 border-slate-200 font-medium", getLevelColor(user?.level))}>
                                    {getLevelLabel(user?.level)}
                                </Badge>
                                <span className="text-xs text-slate-400 font-medium">{user?.preferredPosition || '포지션 미정'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Season Record Card */}
                    <div className="space-y-4 pb-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <span>시즌 전적</span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase">{matchStats.total} 경기</div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50/80 p-3 rounded-xl text-center border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 mb-1">승</div>
                                <div className="text-xl font-black text-emerald-600">{matchStats.wins}</div>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-xl text-center border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 mb-1">무</div>
                                <div className="text-xl font-black text-slate-600">{matchStats.draws}</div>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-xl text-center border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 mb-1">패</div>
                                <div className="text-xl font-black text-red-500">{matchStats.losses}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-400">승률</span>
                                <span className="text-blue-600">{winRate}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000"
                                    style={{ width: `${winRate}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <CalendarDays className="h-4 w-4 text-blue-500" />
                                <span>시즌 출석</span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-400">{attendanceStats.attended} / {attendanceStats.total} 참석</div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                    style={{ width: `${attendanceStats.rate}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Player Stats Grid */}
                    <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Target className="h-4 w-4 text-rose-500" />
                            <span>개인 상세 통계</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                                <div className="text-[10px] font-bold text-slate-400 mb-1 text-center">득점</div>
                                <div className="text-lg font-black text-slate-800">{personalStats.goals}<span className="text-[10px] font-medium text-slate-400 ml-0.5">회</span></div>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                                <div className="text-[10px] font-bold text-slate-400 mb-1 text-center">도움</div>
                                <div className="text-lg font-black text-slate-800">{personalStats.assists}<span className="text-[10px] font-medium text-slate-400 ml-0.5">회</span></div>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                                <div className="text-[10px] font-bold text-slate-400 mb-1 text-center text-xs">클린시트</div>
                                <div className="text-lg font-black text-slate-800">{personalStats.cleanSheets}<span className="text-[10px] font-medium text-slate-400 ml-0.5">회</span></div>
                            </div>
                        </div>
                        {personalStats.noShowCount > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 border border-red-100">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-bold font-black italic">노쇼 {personalStats.noShowCount}회 기록됨</span>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    {recentMatches.length > 0 && (
                        <div className="pt-4 border-t space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <CalendarIcon className="h-4 w-4 text-purple-500" />
                                <span>최근 참석 경기</span>
                            </div>
                            <div className="space-y-2">
                                {recentMatches.map((match, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 group hover:border-blue-200 transition-all">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="text-xs font-bold text-slate-700 mb-0.5">
                                                {(() => {
                                                    const [year, month, day] = match.date.split('-')
                                                    const date = new Date(Number(year), Number(month) - 1, Number(day))
                                                    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                                                })()}
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate">{match.location}</div>
                                        </div>
                                        {match.result && (
                                            <Badge className={cn(
                                                "text-[10px] font-bold border-none",
                                                match.result === 'win' ? "bg-emerald-100 text-emerald-700" :
                                                match.result === 'draw' ? "bg-slate-100 text-slate-500" :
                                                "bg-red-100 text-red-700"
                                            )}>
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
                        <div className="pt-4 border-t space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Award className="h-4 w-4 text-blue-500" />
                                    <span>획득 업적</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{userBadges.length}개</span>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {userBadges.map((userBadge: any) => {
                                    const badge = userBadge.badge
                                    const isPlatinum = badge.tier === 'platinum'
                                    const isGold = badge.tier === 'gold'
                                    return (
                                        <div key={userBadge.id} onClick={() => setSelectedBadge(badge)} className="flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl border flex items-center justify-center p-1",
                                                isPlatinum ? "bg-slate-50 border-slate-200" :
                                                isGold ? "bg-amber-50 border-amber-200" :
                                                "bg-white border-slate-100"
                                            )}>
                                                <span className="text-xl">{badge.icon}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Achievement Detail Dialog */}
            <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
                <DialogContent className="w-[85vw] max-w-sm sm:max-w-[320px] p-5 rounded-2xl mx-auto border-none shadow-xl">
                    <DialogHeader className="gap-3 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 mx-auto flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                            {selectedBadge?.icon}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold mb-1" style={{ color: selectedBadge?.color }}>
                                {selectedBadge?.name}
                            </DialogTitle>
                            <Badge variant="outline" className="uppercase text-[9px] font-bold tracking-widest border-slate-200 text-slate-400">
                                {selectedBadge?.tier} Achievement
                            </Badge>
                        </div>
                        <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed px-4 py-3 bg-slate-50 rounded-xl border border-slate-100/50">
                            {selectedBadge?.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <Button 
                            className="w-full h-11 rounded-xl font-bold text-white border-none"
                            style={{ backgroundColor: selectedBadge?.color || '#3b82f6' }}
                            onClick={() => setSelectedBadge(null)}
                        >
                            닫기
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* NEW BADGE CONGRATS DIALOG */}
            <Dialog open={showNewBadgeDialog} onOpenChange={(open) => {
                if (!open) {
                    // API 호출하여 미확인 뱃지들을 확인 완료로 업데이트
                    fetch('/api/user/badge/acknowledge', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    }).catch(err => console.error('뱃지 확인 요청 실패:', err))
                    setShowNewBadgeDialog(false)
                }
            }}>
                <DialogContent className="w-[85vw] max-w-sm sm:max-w-[400px] p-0 rounded-2xl mx-auto border-none shadow-2xl overflow-hidden bg-white">
                    <DialogHeader className="hidden">
                        <DialogTitle>새로운 업적 달성 축하</DialogTitle>
                    </DialogHeader>
                    
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center text-white relative">
                        {/* Decorative circles */}
                        <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 -translate-y-10 blur-xl"></div>
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full translate-x-10 translate-y-10 blur-xl"></div>
                        
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-4 ring-4 ring-white/10 animate-bounce">
                           <Award className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black mb-1">축하합니다! 🥳</h2>
                        <p className="text-blue-100 text-sm font-medium">새로운 업적을 달성했습니다!</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 py-1">
                            {newBadges.map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-all shadow-sm">
                                    <div className="text-3xl shrink-0 scale-110 drop-shadow-sm">{badge.icon}</div>
                                    <div className="min-w-0">
                                        <div className="font-black text-slate-800 text-sm mb-0.5" style={{ color: badge.color }}>{badge.name}</div>
                                        <div className="text-[11px] text-slate-500 font-medium leading-tight">{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6">
                            <Button 
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl border-none shadow-lg shadow-slate-200"
                                onClick={() => setShowNewBadgeDialog(false)}
                            >
                                대단하네요!
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
