"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Users, Award } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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

    const RankingList = ({
        title,
        icon,
        data,
        valueKey,
        unit,
        color
    }: {
        title: string
        icon: React.ReactNode
        data: PlayerStat[]
        valueKey: 'goals' | 'assists' | 'mvpCount'
        unit: string
        color: string
    }) => (
        <Card className="flex-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                        데이터가 없습니다
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {data.map((player, idx) => (
                            <div
                                key={player.id}
                                className="flex items-center justify-between py-3 px-1 group hover:bg-slate-50 transition-colors rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? 'text-amber-500 text-base' :
                                        idx === 1 ? 'text-slate-400 text-sm' :
                                            idx === 2 ? 'text-orange-400 text-sm' :
                                                'text-slate-300'
                                        }`}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                    </span>
                                    <span className="font-semibold text-slate-700">{player.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-black text-slate-800 tabular-nums">{player[valueKey]}</span>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase">{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6 p-4">
            {/* TOP5 랭킹 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RankingList
                    title="득점 TOP5"
                    icon={<Target className="h-4 w-4 text-red-500" />}
                    data={stats?.topScorers || []}
                    valueKey="goals"
                    unit="골"
                    color="bg-red-100 text-red-800"
                />
                <RankingList
                    title="도움 TOP5"
                    icon={<Award className="h-4 w-4 text-blue-500" />}
                    data={stats?.topAssists || []}
                    valueKey="assists"
                    unit="도움"
                    color="bg-blue-100 text-blue-800"
                />
                <RankingList
                    title="MVP TOP5"
                    icon={<Trophy className="h-4 w-4 text-yellow-500" />}
                    data={stats?.topMvps || []}
                    valueKey="mvpCount"
                    unit="회"
                    color="bg-yellow-100 text-yellow-800"
                />
            </div>

            {/* 내 기록 */}
            {currentUser && stats?.myStats && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-purple-500" />
                            나의 기록
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Goals</div>
                                <div className="text-2xl font-black text-slate-800 tabular-nums">
                                    {stats.myStats.goals}<span className="text-xs font-medium text-slate-400 ml-0.5">골</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assists</div>
                                <div className="text-2xl font-black text-slate-800 tabular-nums">
                                    {stats.myStats.assists}<span className="text-xs font-medium text-slate-400 ml-0.5">도움</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MVP</div>
                                <div className="text-2xl font-black text-slate-800 tabular-nums">
                                    {stats.myStats.mvpCount}<span className="text-xs font-medium text-slate-400 ml-0.5">회</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
