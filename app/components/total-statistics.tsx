"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerStat {
    id: string
    name: string
    gamesPlayed: number
    wins: number
    draws: number
    losses?: number
    goals: number
    assists: number
    cleanSheets: number
    noShowCount: number
    winRate?: number
    points?: number
}

type SortKey = 'name' | 'gamesPlayed' | 'wins' | 'draws' | 'losses' | 'goals' | 'assists' | 'cleanSheets' | 'noShowCount'
type SortDir = 'asc' | 'desc'

interface SortConfig {
    key: SortKey
    dir: SortDir
}

export function TotalStatistics({ currentUser }: { currentUser: any }) {
    const [allStats, setAllStats] = useState<PlayerStat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', dir: 'asc' })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/team/stats')
                const result = await response.json()
                if (result.success && result.data?.allPlayerStats) {
                    setAllStats(result.data.allPlayerStats)
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                // 같은 컬럼 클릭: 방향 토글
                return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            }
            // 새 컬럼: 이름은 asc, 나머지는 desc (높은 값이 먼저)
            return { key, dir: key === 'name' ? 'asc' : 'desc' }
        })
    }

    const sortedStats = useMemo(() => {
        const sorted = [...allStats].map(s => ({
            ...s,
            losses: s.gamesPlayed - s.wins - (s.draws || 0)
        }))

        sorted.sort((a, b) => {
            const { key, dir } = sortConfig
            let comparison = 0

            if (key === 'name') {
                comparison = a.name.localeCompare(b.name, 'ko')
            } else {
                const aVal = (a as any)[key] as number
                const bVal = (b as any)[key] as number
                comparison = aVal - bVal
            }

            return dir === 'asc' ? comparison : -comparison
        })

        return sorted
    }, [allStats, sortConfig])

    const SortHeader = ({ label, sortKey, className }: { label: string; sortKey: SortKey; className?: string }) => {
        const isActive = sortConfig.key === sortKey
        return (
            <button
                onClick={() => handleSort(sortKey)}
                className={cn(
                    "flex items-center gap-0.5 transition-colors font-bold text-[10px] uppercase tracking-wider w-full",
                    isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600",
                    className
                )}
            >
                <span>{label}</span>
                {isActive ? (
                    sortConfig.dir === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                    ) : (
                        <ArrowDown className="h-3 w-3" />
                    )
                ) : (
                    <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                )}
            </button>
        )
    }

    if (isLoading) {
        return (
            <div className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
            </div>
        )
    }

    if (allStats.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center text-slate-500 text-sm">
                    기록된 경기 데이터가 없습니다
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* 정보 배지 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 font-semibold">
                        {allStats.length}명
                    </Badge>
                    <span className="text-xs text-slate-400">올해 기록이 있는 선수</span>
                </div>
                <span className="text-[10px] text-slate-400 italic">* CS : 클린시트</span>
            </div>

            {/* 테이블 */}
            <Card className="overflow-hidden rounded-2xl border-slate-200/60 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                <th className="text-left py-3 px-3 sticky left-0 bg-slate-50/80 z-10">
                                    <SortHeader label="이름" sortKey="name" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[48px]">
                                    <SortHeader label="경기" sortKey="gamesPlayed" className="justify-center" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[32px]">
                                    <SortHeader label="승" sortKey="wins" className="justify-center" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[32px]">
                                    <SortHeader label="무" sortKey="draws" className="justify-center" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[32px]">
                                    <SortHeader label="패" sortKey="losses" className="justify-center" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[32px]">
                                    <SortHeader label="골" sortKey="goals" className="justify-center" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[48px]">
                                    <SortHeader label="도움" sortKey="assists" className="justify-center" />
                                </th>
                                <th className="text-center py-3 px-2 min-w-[32px]">
                                    <SortHeader label="CS" sortKey="cleanSheets" className="justify-center" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.map((player, idx) => {
                                const isMe = player.id === currentUser?.id
                                const isEven = idx % 2 === 0

                                return (
                                    <tr
                                        key={player.id}
                                        className={cn(
                                            "border-b border-slate-50 transition-colors",
                                            isMe
                                                ? "bg-blue-50/60 hover:bg-blue-50"
                                                : isEven
                                                    ? "bg-white hover:bg-slate-50/50"
                                                    : "bg-slate-25 hover:bg-slate-50/50"
                                        )}
                                    >
                                        <td className={cn(
                                            "py-2.5 px-3 font-semibold text-[13px] sticky left-0 z-10 whitespace-nowrap",
                                            isMe ? "text-blue-700 bg-blue-50/60" : "text-slate-700 bg-inherit"
                                        )}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="truncate max-w-[75px]">{player.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-2 text-center tabular-nums text-slate-500 text-xs font-medium whitespace-nowrap">
                                            {player.gamesPlayed}
                                        </td>
                                        <td className="py-2.5 px-2 text-center tabular-nums font-bold text-emerald-600 text-xs whitespace-nowrap">
                                            {player.wins}
                                        </td>
                                        <td className="py-2.5 px-2 text-center tabular-nums text-slate-400 text-xs whitespace-nowrap">
                                            {player.draws}
                                        </td>
                                        <td className="py-2.5 px-2 text-center tabular-nums text-rose-500 text-xs whitespace-nowrap">
                                            {player.losses}
                                        </td>
                                        <td className={cn(
                                            "py-2.5 px-2 text-center tabular-nums text-xs font-bold whitespace-nowrap",
                                            player.goals > 0 ? "text-slate-800" : "text-slate-300"
                                        )}>
                                            {player.goals}
                                        </td>
                                        <td className={cn(
                                            "py-2.5 px-2 text-center tabular-nums text-xs font-bold whitespace-nowrap",
                                            player.assists > 0 ? "text-slate-800" : "text-slate-300"
                                        )}>
                                            {player.assists}
                                        </td>
                                        <td className={cn(
                                            "py-2.5 px-2 text-center tabular-nums text-xs font-bold whitespace-nowrap",
                                            player.cleanSheets > 0 ? "text-amber-600" : "text-slate-300"
                                        )}>
                                            {player.cleanSheets}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
