"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Crown, HelpingHand, Trophy, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface PlayerStat {
    id: string
    name: string
    goals: number
    assists: number
    cleanSheets?: number
    attendanceRate?: number
    winRate?: number
    points?: number
    gamesPlayed?: number
    wins?: number
    draws?: number
    position?: string
    image?: string
    jerseyNumber?: number | string
}

interface RankingListProps {
    title: string
    subtitle: string
    icon: React.ReactNode
    data: any[]
    valueKey: string
    unit: string
    theme: 'red' | 'blue' | 'yellow' | 'green' | 'purple'
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
        red: { text: "text-rose-600", bg: "bg-rose-50/70", border: "border-rose-100", accent: "text-rose-500", line: "bg-rose-200" },
        blue: { text: "text-blue-600", bg: "bg-blue-50/70", border: "border-blue-100", accent: "text-blue-500", line: "bg-blue-200" },
        yellow: { text: "text-amber-600", bg: "bg-amber-50/70", border: "border-amber-100", accent: "text-amber-500", line: "bg-amber-200" },
        green: { text: "text-emerald-600", bg: "bg-emerald-50/70", border: "border-emerald-100", accent: "text-emerald-500", line: "bg-emerald-200" },
        purple: { text: "text-purple-600", bg: "bg-purple-50/70", border: "border-purple-100", accent: "text-purple-500", line: "bg-purple-200" }
    }

    const styles = themeStyles[theme]

    return (
        <Card className="border-slate-200/50 shadow-sm overflow-hidden rounded-[24px]">
            <CardContent className="p-0">
                {/* 1. 내부 타이틀 영역 */}
                <div className="px-5 pt-5 pb-1">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-[16px] shrink-0 border-0 shadow-sm", styles.bg)}>
                            {icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h1 className="text-[19px] font-bold text-[#1e293b] tracking-tight">{title}</h1>
                                <div className={cn("h-[2px] w-[50px] rounded-full opacity-80", styles.line)} />
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                </div>

                {/* 2. 컬럼 헤더 */}
                <div className="border-t border-slate-100 mt-1.5 px-5 py-3 flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="w-[50px] text-center">Rank</div>
                    <div className="flex-1 px-2">Player</div>
                    <div className="w-[70px] text-right pr-2">Count</div>
                </div>

                {/* 3. 선수 리스트 영역 */}
                <div className="px-2 pb-5 space-y-1.5">
                    {isLoading ? (
                        <div className="py-12 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-300 mx-auto" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">
                            기록이 없습니다
                        </div>
                    ) : (
                        (() => {
                            // 미리 각 아이템의 실제 공동 순위를 계산합니다 (e.g., 1, 1, 3, 4...)
                            let currentRank = 1
                            let currentVal = data[0][valueKey]

                            const rankedData = data.map((item, i) => {
                                const val = item[valueKey]
                                if (i > 0 && val !== currentVal) {
                                    currentRank = i + 1
                                    currentVal = val
                                }
                                return { ...item, _displayRank: currentRank, _originalIndex: i }
                            })

                            return rankedData.map((item) => {
                                const val = item[valueKey]
                                const maxVal = data[0][valueKey]
                                const isTopScore = val !== null && val !== 0 && val === maxVal
                                const rankStr = item._displayRank

                                return (
                                    <div key={item.id} className={cn(
                                        "flex items-center px-3 py-3.5 transition-all duration-200",
                                        isTopScore ? cn(styles.bg, "rounded-[20px]") : "hover:bg-slate-50/50 rounded-[16px]"
                                    )}>
                                        <div className="w-[50px] flex items-center justify-center shrink-0">
                                            {isTopScore ? (
                                                <Crown className={cn("h-5 w-5", styles.text)} fill="currentColor" fillOpacity={0.15} />
                                            ) : (rankStr === 2 || rankStr === 3) ? (
                                                <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                                                    <span className="text-[12px] font-bold text-slate-500">{rankStr}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[13px] font-bold text-slate-300">{rankStr}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col min-w-0 px-2">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold truncate text-[15px] tracking-tight",
                                                    isTopScore ? styles.text : "text-slate-700"
                                                )}>{item.name}</span>
                                                {isTopScore && (
                                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-white/80 text-slate-500 border-slate-100 font-bold tracking-tighter shadow-sm">
                                                        TOP
                                                    </Badge>
                                                )}
                                            </div>
                                            {(valueKey === 'winRate' || valueKey === 'points') && (
                                                <span className={cn(
                                                    "text-[10px] font-bold opacity-70 mt-0.5",
                                                    isTopScore ? styles.text : "text-slate-400"
                                                )}>
                                                    {item.wins}승 {item.draws > 0 ? `${item.draws}무 ` : '0무 '}{item.gamesPlayed - item.wins - (item.draws || 0)}패
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-[70px] text-right pr-2 shrink-0 flex items-center justify-end gap-1.5">
                                            <span className={cn(
                                                "font-black tabular-nums text-[16px] tracking-tighter",
                                                isTopScore ? styles.text : "text-slate-900"
                                            )}>
                                                {valueKey === 'winRate' || valueKey === 'attendanceRate'
                                                    ? (typeof val === 'number' ? val.toFixed(0) : val)
                                                    : val
                                                }
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{unit}</span>
                                        </div>
                                    </div>
                                )
                            })
                        })()
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function TeamDashboard({ currentUser }: { currentUser: any }) {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/team/stats')
                const result = await response.json()
                if (result.success) {
                    setStats(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch team stats:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-8 pb-6 px-0.5">
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
                    subtitle="최우수 출석률 (자체경기, A매치등 모두 포함)"
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
                <RankingList
                    title="Top Points"
                    subtitle="최다 승점 (승리 3점, 무승부 1점)"
                    icon={<span className="text-xl leading-none">📈</span>}
                    data={stats?.topPoints || []}
                    valueKey="points"
                    unit="점"
                    theme="red"
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}
