"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Crown, HelpingHand } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface PlayerStat {
    id: string
    name: string
    goals: number
    assists: number
    cleanSheets?: number
    attendanceRate?: number
    winRate?: number
    gamesPlayed?: number
    wins?: number
}

interface TeamStatsData {
    topScorers: PlayerStat[]
    topAssists: PlayerStat[]
    topCleanSheets: PlayerStat[]
    topAttendance: PlayerStat[]
    topWinRate: PlayerStat[]
    myStats: PlayerStat | null
    totalMatches: number
}

interface TeamDashboardProps {
    currentUser: any
}

type ThemeColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple'

interface RankingListProps {
    title: string
    subtitle: string
    icon: React.ReactNode
    data: PlayerStat[]
    valueKey: 'goals' | 'assists' | 'cleanSheets' | 'attendanceRate' | 'winRate'
    unit: string
    theme: ThemeColor
    isLoading: boolean
}

const RankingList = ({
    title,
    subtitle,
    icon,
    data,
    valueKey,
    unit,
    theme,
    isLoading
}: RankingListProps) => {
    const themeStyles = {
        red: {
            accent: "text-rose-500",
            bg: "bg-rose-50",
            border: "border-rose-100",
            rank1: "bg-rose-50/80 text-rose-700",
            icon: "text-rose-500",
            gradient: "from-rose-500 to-pink-600"
        },
        blue: {
            accent: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-100",
            rank1: "bg-blue-50/80 text-blue-700",
            icon: "text-blue-500",
            gradient: "from-blue-500 to-indigo-600"
        },
        yellow: {
            accent: "text-amber-500",
            bg: "bg-amber-50",
            border: "border-amber-100",
            rank1: "bg-amber-50/80 text-amber-700",
            icon: "text-amber-500",
            gradient: "from-amber-400 to-orange-500"
        },
        green: {
            accent: "text-emerald-500",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            rank1: "bg-emerald-50/80 text-emerald-700",
            icon: "text-emerald-500",
            gradient: "from-emerald-400 to-green-500"
        },
        purple: {
            accent: "text-purple-500",
            bg: "bg-purple-50",
            border: "border-purple-100",
            rank1: "bg-purple-50/80 text-purple-700",
            icon: "text-purple-500",
            gradient: "from-purple-400 to-fuchsia-500"
        }
    }

    const styles = themeStyles[theme]

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-0 pt-5 px-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-slate-50 shrink-0", styles.bg)}>
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800 whitespace-nowrap">
                                {title}
                            </CardTitle>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <div className={cn("h-1 w-12 rounded-full opacity-20", `bg-gradient-to-r ${styles.gradient}`)} />
                </div>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-slate-50/50 border-y border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-7">Player</div>
                    <div className="col-span-3 text-right">Count</div>
                </div>

                <div className="px-3 py-2">
                    {isLoading ? (
                        <div className="space-y-2 px-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-10 w-full rounded-md" />
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-sm text-slate-400">
                            아직 기록이 없습니다
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {data.map((player, idx) => {
                                const currentValue = player[valueKey];
                                const rank = data.findIndex(p => p[valueKey] === currentValue) + 1;

                                return (
                                    <div
                                        key={player.id}
                                        className={cn(
                                            "grid grid-cols-12 gap-2 items-center py-2.5 px-2 rounded-lg transition-all",
                                            rank === 1 ? styles.rank1 : "hover:bg-slate-50",
                                            rank !== 1 && "text-slate-600"
                                        )}
                                    >
                                        <div className="col-span-2 flex justify-center">
                                            {rank === 1 ? (
                                                <Crown className={cn("h-5 w-5", styles.icon)} fill="currentColor" fillOpacity={0.2} />
                                            ) : rank === 2 ? (
                                                <div className="relative flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200">
                                                    2
                                                </div>
                                            ) : rank === 3 ? (
                                                <div className="relative flex items-center justify-center h-6 w-6 rounded-full bg-orange-50 text-orange-700 font-bold text-xs border border-orange-100">
                                                    3
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium text-slate-400 w-6 text-center">{rank}</span>
                                            )}
                                        </div>

                                        <div className="col-span-7 flex items-center gap-2 overflow-hidden">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-sm truncate",
                                                        rank === 1 ? "font-bold" : "font-medium"
                                                    )}>
                                                        {player.name}
                                                    </span>
                                                    {rank === 1 && (
                                                        <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-white/50 text-slate-600 border-0">
                                                            TOP
                                                        </Badge>
                                                    )}
                                                </div>
                                                {valueKey === 'winRate' && player.gamesPlayed !== undefined && player.wins !== undefined && (
                                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                                        {player.wins}승 {player.gamesPlayed - player.wins}패
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-span-3 text-right">
                                            <span className={cn(
                                                "text-base font-black tabular-nums tracking-tight",
                                                rank === 1 ? styles.accent : "text-slate-700"
                                            )}>
                                                {player[valueKey]}
                                            </span>
                                            <span className="text-[10px] text-slate-400 ml-1 font-medium">{unit}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function TeamDashboard({ currentUser }: TeamDashboardProps) {
    const [stats, setStats] = useState<TeamStatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`/api/team/stats?userId=${currentUser?.id || ''}`)
                const result = await response.json()

                if (result.success) {
                    setStats(result.data)
                }
            } catch (error) {
                console.error('팀 통계 조회 오류:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [currentUser?.id])

    return (
        <div className="space-y-5 p-4 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RankingList
                    title="Top Scorers"
                    subtitle="최다 득점 순위"
                    icon={<span className="text-xl leading-none">⚽</span>}
                    data={stats?.topScorers || []}
                    valueKey="goals"
                    unit="골"
                    theme="red"
                    isLoading={isLoading}
                />
                <RankingList
                    title="Top Assists"
                    subtitle="최다 도움 순위"
                    icon={<HelpingHand className="h-5 w-5 text-blue-500" />}
                    data={stats?.topAssists || []}
                    valueKey="assists"
                    unit="도움"
                    theme="blue"
                    isLoading={isLoading}
                />
                <RankingList
                    title="Top Clean Sheets"
                    subtitle="최다 무실점 쿼터 (수비수/GK)"
                    icon={<Shield className="h-5 w-5 text-amber-500" />}
                    data={stats?.topCleanSheets || []}
                    valueKey="cleanSheets"
                    unit="회"
                    theme="yellow"
                    isLoading={isLoading}
                />
                <RankingList
                    title="Top Attendance"
                    subtitle="최우수 출석률"
                    icon={<span className="text-xl leading-none">🔥</span>}
                    data={stats?.topAttendance || []}
                    valueKey="attendanceRate"
                    unit="%"
                    theme="green"
                    isLoading={isLoading}
                />
                <RankingList
                    title="Top Win Rate"
                    subtitle="최고 승률 (출석 50% 이상)"
                    icon={<span className="text-xl leading-none">🏆</span>}
                    data={stats?.topWinRate || []}
                    valueKey="winRate"
                    unit="%"
                    theme="purple"
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}
