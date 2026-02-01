"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, HelpingHand } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface PlayerStat {
    id: string
    name: string
    goals: number
    assists: number
    mvpCount: number
}

interface TeamStatsData {
    topScorers: PlayerStat[]
    topAssists: PlayerStat[]
    topMvps: PlayerStat[]
    myStats: PlayerStat | null
    totalMatches: number
}

interface TeamDashboardProps {
    currentUser: any
}

type ThemeColor = 'red' | 'blue' | 'yellow'

interface RankingListProps {
    title: string
    subtitle: string
    icon: React.ReactNode
    data: PlayerStat[]
    valueKey: 'goals' | 'assists' | 'mvpCount'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    title="MVP Rankings"
                    subtitle="최다 MVP 선정"
                    icon={<Trophy className="h-5 w-5 text-amber-500" />}
                    data={stats?.topMvps || []}
                    valueKey="mvpCount"
                    unit="회"
                    theme="yellow"
                    isLoading={isLoading}
                />
            </div>

            {currentUser && stats?.myStats && (
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-1 bg-slate-900 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-900">My Performance</h3>
                    </div>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

                        <CardContent className="p-6 relative z-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                        <span className="text-xl">😎</span>
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-400 font-medium mb-0.5">Player</div>
                                        <div className="text-xl font-bold text-white">{stats.myStats.name}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-8 md:gap-12 w-full md:w-auto">
                                    <div className="flex flex-col items-center md:items-end">
                                        <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Goals</div>
                                        <div className="text-3xl font-black text-white tabular-nums">
                                            {stats.myStats.goals}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end">
                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Assists</div>
                                        <div className="text-3xl font-black text-white tabular-nums">
                                            {stats.myStats.assists}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end">
                                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">MVP</div>
                                        <div className="text-3xl font-black text-white tabular-nums">
                                            {stats.myStats.mvpCount}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
