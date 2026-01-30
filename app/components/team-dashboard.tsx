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
                    <div className="space-y-2">
                        {data.map((player, idx) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-2 rounded-lg ${idx === 0 ? 'bg-amber-50 border border-amber-200' :
                                        idx === 1 ? 'bg-slate-50 border border-slate-200' :
                                            idx === 2 ? 'bg-orange-50 border border-orange-200' :
                                                'bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-400 text-amber-900' :
                                            idx === 1 ? 'bg-slate-400 text-white' :
                                                idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                    'bg-gray-300 text-gray-700'
                                        }`}>
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium text-sm">{player.name}</span>
                                </div>
                                <Badge className={color}>
                                    {player[valueKey]}{unit}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6 p-4">
            {/* 헤더 */}
            <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" />
                <h1 className="text-xl font-bold">팀 대시보드</h1>
                {stats && (
                    <Badge variant="secondary" className="ml-auto">
                        총 {stats.totalMatches}경기
                    </Badge>
                )}
            </div>

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
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{stats.myStats.goals}</div>
                                <div className="text-xs text-muted-foreground mt-1">골</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{stats.myStats.assists}</div>
                                <div className="text-xs text-muted-foreground mt-1">도움</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">{stats.myStats.mvpCount}</div>
                                <div className="text-xs text-muted-foreground mt-1">MVP</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
