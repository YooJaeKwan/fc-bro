"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Calendar,
    CalendarCheck,
    MapPin,
    Clock,
    Users,
    Trophy,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ClipboardEdit,
    CheckCircle2,
    XCircle,
    MinusCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { AttendanceVoting } from "./attendance-voting"
import { MatchResultDialog } from "./match-result-dialog"

interface MatchScheduleProps {
    isManagerMode: boolean
    currentUser?: any
    onEditSchedule?: (schedule: any) => void
    onAddSchedule?: () => void
}

// 경기 타입 라벨 & 색상
const getTypeInfo = (type: string) => {
    switch (type) {
        case "internal": return { label: "자체경기", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" }
        case "match": return { label: "A매치", color: "bg-rose-500/10 text-rose-700 border-rose-200" }
        case "training": return { label: "연습", color: "bg-sky-500/10 text-sky-700 border-sky-200" }
        case "futsal": return { label: "풋살", color: "bg-amber-500/10 text-amber-700 border-amber-200" }
        default: return { label: type, color: "bg-slate-500/10 text-slate-700 border-slate-200" }
    }
}

// 승/무/패 결과 판별
const getMatchResult = (schedule: any): 'win' | 'draw' | 'loss' | null => {
    if (schedule.ourScore == null || schedule.opponentScore == null) return null
    if (schedule.ourScore > schedule.opponentScore) return 'win'
    if (schedule.ourScore === schedule.opponentScore) return 'draw'
    return 'loss'
}

const getResultStyle = (result: 'win' | 'draw' | 'loss' | null) => {
    switch (result) {
        case 'win': return { label: '승', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500' }
        case 'draw': return { label: '무', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', accent: 'bg-slate-400' }
        case 'loss': return { label: '패', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500' }
        default: return { label: '-', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', accent: 'bg-gray-300' }
    }
}

// 날짜 파싱 유틸
const parseScheduleDate = (dateStr: string, timeStr?: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return new Date(year, month - 1, day, hours, minutes)
    }
    return new Date(year, month - 1, day)
}

const formatDate = (dateStr: string) => {
    const date = parseScheduleDate(dateStr)
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

const formatShortDate = (dateStr: string) => {
    const date = parseScheduleDate(dateStr)
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const getMonthKey = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}-${month}`
}

const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    return `${year}년 ${Number(month)}월`
}

export function MatchSchedule({ isManagerMode, currentUser, onEditSchedule, onAddSchedule }: MatchScheduleProps) {
    const [schedules, setSchedules] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedUpcoming, setExpandedUpcoming] = useState<string | null>(null)
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false)
    const [resultEditingSchedule, setResultEditingSchedule] = useState<any>(null)

    const fetchSchedules = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/schedule/list')
            const result = await response.json()
            if (result.success) {
                setSchedules(result.schedules)
            }
        } catch (error) {
            console.error('일정 불러오기 오류:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedules()
    }, [])

    // D-day 계산
    const calculateDaysLeft = (dateStr: string) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const target = parseScheduleDate(dateStr)
        target.setHours(0, 0, 0, 0)
        return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // 예정/지난 경기 분리
    const now = new Date()
    const upcomingSchedules = schedules
        .filter(s => {
            const dt = parseScheduleDate(s.date, s.time || '23:59')
            const endTime = new Date(dt.getTime() + 3 * 60 * 60 * 1000)
            return endTime > now && s.status !== 'COMPLETED'
        })
        .sort((a, b) => parseScheduleDate(a.date, a.time).getTime() - parseScheduleDate(b.date, b.time).getTime())

    const pastSchedules = schedules
        .filter(s => {
            if (s.status === 'COMPLETED') return true
            const dt = parseScheduleDate(s.date, s.time || '23:59')
            const endTime = new Date(dt.getTime() + 3 * 60 * 60 * 1000)
            return endTime <= now
        })
        .sort((a, b) => parseScheduleDate(b.date, b.time).getTime() - parseScheduleDate(a.date, a.time).getTime())

    // 지난 경기 월별 그룹핑
    const pastByMonth: Record<string, any[]> = {}
    pastSchedules.forEach(s => {
        const key = getMonthKey(s.date)
        if (!pastByMonth[key]) pastByMonth[key] = []
        pastByMonth[key].push(s)
    })
    const monthKeys = Object.keys(pastByMonth).sort((a, b) => b.localeCompare(a))

    // 월별 전적 계산
    const getMonthStats = (matches: any[]) => {
        let wins = 0, draws = 0, losses = 0
        matches.forEach(m => {
            const r = getMatchResult(m)
            if (r === 'win') wins++
            else if (r === 'draw') draws++
            else if (r === 'loss') losses++
        })
        return { wins, draws, losses, total: matches.length }
    }

    // 삭제 핸들러
    const handleDeleteSchedule = async (scheduleId: string, title?: string) => {
        if (!confirm(`정말로 이 일정을 삭제하시겠습니까?\n\n${title || '선택한 일정'}\n\n⚠️ 삭제된 일정은 복구할 수 없습니다.`)) return
        try {
            const response = await fetch('/api/schedule/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduleId, userId: currentUser?.id })
            })
            if (response.ok) fetchSchedules()
        } catch (error) {
            console.error('삭제 오류:', error)
        }
    }

    // 결과 입력 핸들러
    const handleOpenResultDialog = (schedule: any) => {
        setResultEditingSchedule(schedule)
        setIsResultDialogOpen(true)
    }

    const handleResultSuccess = () => {
        fetchSchedules()
        setIsResultDialogOpen(false)
        setResultEditingSchedule(null)
    }

    const nextMatch = upcomingSchedules[0] || null
    const otherUpcoming = upcomingSchedules.slice(1)

    // 스켈레톤 로딩
    if (isLoading) {
        return (
            <div className="space-y-8 max-w-3xl mx-auto">
                {/* Hero skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-28" />
                    <div className="rounded-2xl border p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-14 w-14 rounded-xl" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                </div>
                {/* Timeline skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-20" />
                    {[1, 2].map(i => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
                {/* Past skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-28" />
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {/* ═══════════════════════════════════════════ */}
            {/* 섹션: 예정 경기                               */}
            {/* ═══════════════════════════════════════════ */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        예정 경기
                        {upcomingSchedules.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-xs font-semibold">
                                {upcomingSchedules.length}
                            </Badge>
                        )}
                    </h2>
                    {isManagerMode && onAddSchedule && (
                        <Button size="sm" variant="outline" onClick={onAddSchedule} className="gap-1.5 text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
                            <Plus className="h-3.5 w-3.5" />
                            일정 추가
                        </Button>
                    )}
                </div>

                {upcomingSchedules.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-10 text-center">
                            <CalendarCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">예정된 경기가 없습니다</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* ──── 히어로 카드: 다음 경기 ──── */}
                        {nextMatch && (
                            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
                                {/* D-day 리본 */}
                                <div className="absolute top-0 right-0">
                                    <div className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm">
                                        {(() => {
                                            const d = calculateDaysLeft(nextMatch.date)
                                            if (d === 0) return "🔥 오늘!"
                                            if (d === 1) return "⚡ 내일"
                                            if (d > 0) return `D-${d}`
                                            return "종료됨"
                                        })()}
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 space-y-4">
                                    {/* 상단: 타입 + 날짜/시간/장소 */}
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${nextMatch.type === 'internal' ? 'bg-emerald-100' :
                                                    nextMatch.type === 'match' ? 'bg-rose-100' :
                                                        nextMatch.type === 'futsal' ? 'bg-amber-100' : 'bg-sky-100'
                                                }`}>
                                                <Trophy className={`h-6 w-6 ${nextMatch.type === 'internal' ? 'text-emerald-600' :
                                                        nextMatch.type === 'match' ? 'text-rose-600' :
                                                            nextMatch.type === 'futsal' ? 'text-amber-600' : 'text-sky-600'
                                                    }`} />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge variant="outline" className={`text-[11px] font-semibold ${getTypeInfo(nextMatch.type).color}`}>
                                                        {getTypeInfo(nextMatch.type).label}
                                                    </Badge>
                                                    {nextMatch.opponentTeam && (
                                                        <span className="text-sm font-semibold text-slate-700">vs {nextMatch.opponentTeam}</span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {formatDate(nextMatch.date)}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* 시간/장소 정보 바 */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                <span className="font-medium">{nextMatch.time}</span>
                                                {nextMatch.gatherTime && (
                                                    <span className="text-xs text-slate-400">(집합 {nextMatch.gatherTime})</span>
                                                )}
                                            </div>
                                            {nextMatch.location && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                                    <span>{nextMatch.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        {nextMatch.description && (
                                            <p className="text-sm text-slate-500 bg-white/60 rounded-lg px-3 py-2 border border-slate-100">
                                                {nextMatch.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* 참석현황 요약 바 */}
                                    {nextMatch.attendanceStats && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span className="font-medium">참석 현황</span>
                                                <div className="flex gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        {nextMatch.attendanceStats.attending}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <XCircle className="h-3 w-3 text-rose-400" />
                                                        {nextMatch.attendanceStats.notAttending}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MinusCircle className="h-3 w-3 text-slate-400" />
                                                        {nextMatch.attendanceStats.pending}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                {(() => {
                                                    const total = nextMatch.attendanceStats.attending + nextMatch.attendanceStats.notAttending + nextMatch.attendanceStats.pending
                                                    if (total === 0) return null
                                                    const aP = (nextMatch.attendanceStats.attending / total) * 100
                                                    const nP = (nextMatch.attendanceStats.notAttending / total) * 100
                                                    return (
                                                        <>
                                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${aP}%` }} />
                                                            <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${nP}%` }} />
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* 투표 영역 */}
                                    {currentUser?.id && (
                                        <div className="pt-1">
                                            <AttendanceVoting
                                                scheduleId={nextMatch.id}
                                                currentUserId={currentUser.id}
                                                isManagerMode={isManagerMode}
                                                isPastSchedule={calculateDaysLeft(nextMatch.date) < 0}
                                                allowGuests={nextMatch.allowGuests}
                                                hasTeamFormation={!!nextMatch.teamFormation}
                                                formationConfirmed={nextMatch.formationConfirmed}
                                                initialStats={nextMatch.attendanceStats}
                                                onVoteUpdate={() => fetchSchedules()}
                                            />
                                        </div>
                                    )}

                                    {/* 관리자 액션 */}
                                    {isManagerMode && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                            {onEditSchedule && (
                                                <Button size="sm" variant="ghost" className="text-xs text-slate-500 gap-1" onClick={() => onEditSchedule(nextMatch)}>
                                                    <Pencil className="h-3 w-3" /> 수정
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-xs text-slate-500 gap-1" onClick={() => handleOpenResultDialog(nextMatch)}>
                                                <ClipboardEdit className="h-3 w-3" /> 결과입력
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-xs text-rose-400 gap-1 ml-auto" onClick={() => handleDeleteSchedule(nextMatch.id, nextMatch.title)}>
                                                <Trash2 className="h-3 w-3" /> 삭제
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ──── 타임라인: 나머지 예정 경기 ──── */}
                        {otherUpcoming.length > 0 && (
                            <div className="space-y-2">
                                {otherUpcoming.map((schedule) => {
                                    const typeInfo = getTypeInfo(schedule.type)
                                    const daysLeft = calculateDaysLeft(schedule.date)
                                    const isExpanded = expandedUpcoming === schedule.id

                                    return (
                                        <div key={schedule.id} className="group">
                                            {/* 메인 행 */}
                                            <div
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${isExpanded ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                                                    }`}
                                                onClick={() => setExpandedUpcoming(isExpanded ? null : schedule.id)}
                                            >
                                                {/* 날짜 블록 */}
                                                <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {(() => {
                                                            const d = parseScheduleDate(schedule.date)
                                                            return d.toLocaleDateString('ko-KR', { weekday: 'short' })
                                                        })()}
                                                    </span>
                                                    <span className="text-lg font-bold text-slate-700 leading-tight">
                                                        {schedule.date.split('-')[2]}
                                                    </span>
                                                </div>

                                                <div className="h-8 w-px bg-slate-200 flex-shrink-0" />

                                                {/* 정보 */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 ${typeInfo.color}`}>
                                                            {typeInfo.label}
                                                        </Badge>
                                                        {schedule.opponentTeam && (
                                                            <span className="text-xs font-medium text-slate-600 truncate">vs {schedule.opponentTeam}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{schedule.time}</span>
                                                        {schedule.location && (
                                                            <>
                                                                <span className="text-slate-300">·</span>
                                                                <span className="truncate">{schedule.location}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 우측: D-day + 참석 수 */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    {schedule.attendanceStats && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                            <Users className="h-3 w-3" />
                                                            <span className="font-medium">{schedule.attendanceStats.attending}</span>
                                                        </div>
                                                    )}
                                                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 font-semibold">
                                                        {daysLeft === 0 ? '오늘' : daysLeft === 1 ? '내일' : `D-${daysLeft}`}
                                                    </Badge>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* 확장된 상세 */}
                                            {isExpanded && (
                                                <div className="mt-1 ml-4 mr-2 p-4 rounded-xl bg-white border border-slate-100 space-y-4 animate-in slide-in-from-top-1 duration-200">
                                                    {/* 참석현황 */}
                                                    {schedule.attendanceStats && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                                <span>참석 현황</span>
                                                                <div className="flex gap-2">
                                                                    <span className="text-emerald-600">참석 {schedule.attendanceStats.attending}</span>
                                                                    <span className="text-rose-500">불참 {schedule.attendanceStats.notAttending}</span>
                                                                    <span className="text-slate-400">미정 {schedule.attendanceStats.pending}</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                                                {(() => {
                                                                    const total = schedule.attendanceStats.attending + schedule.attendanceStats.notAttending + schedule.attendanceStats.pending
                                                                    if (total === 0) return null
                                                                    return (
                                                                        <>
                                                                            <div className="h-full bg-emerald-500" style={{ width: `${(schedule.attendanceStats.attending / total) * 100}%` }} />
                                                                            <div className="h-full bg-rose-400" style={{ width: `${(schedule.attendanceStats.notAttending / total) * 100}%` }} />
                                                                        </>
                                                                    )
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 투표 */}
                                                    {currentUser?.id && (
                                                        <AttendanceVoting
                                                            scheduleId={schedule.id}
                                                            currentUserId={currentUser.id}
                                                            isManagerMode={isManagerMode}
                                                            isPastSchedule={false}
                                                            allowGuests={schedule.allowGuests}
                                                            hasTeamFormation={!!schedule.teamFormation}
                                                            formationConfirmed={schedule.formationConfirmed}
                                                            initialStats={schedule.attendanceStats}
                                                            onVoteUpdate={() => fetchSchedules()}
                                                        />
                                                    )}

                                                    {schedule.description && (
                                                        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{schedule.description}</p>
                                                    )}

                                                    {/* 관리자 액션 */}
                                                    {isManagerMode && (
                                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                            {onEditSchedule && (
                                                                <Button size="sm" variant="ghost" className="text-xs text-slate-500 gap-1 h-7" onClick={() => onEditSchedule(schedule)}>
                                                                    <Pencil className="h-3 w-3" /> 수정
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="ghost" className="text-xs text-slate-500 gap-1 h-7" onClick={() => handleOpenResultDialog(schedule)}>
                                                                <ClipboardEdit className="h-3 w-3" /> 결과입력
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="text-xs text-rose-400 gap-1 h-7 ml-auto" onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}>
                                                                <Trash2 className="h-3 w-3" /> 삭제
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* 섹션: 지난 경기                               */}
            {/* ═══════════════════════════════════════════ */}
            <section>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-amber-600" />
                    </div>
                    지난 경기
                    {pastSchedules.length > 0 && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-xs font-semibold">
                            {pastSchedules.length}
                        </Badge>
                    )}
                </h2>

                {pastSchedules.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-10 text-center">
                            <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">기록된 경기가 없습니다</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {monthKeys.map((monthKey) => {
                            const matches = pastByMonth[monthKey]
                            const stats = getMonthStats(matches)

                            return (
                                <div key={monthKey}>
                                    {/* 월 헤더 */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-slate-600">
                                            {getMonthLabel(monthKey)}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[11px] font-semibold">
                                            <span className="text-emerald-600">{stats.wins}승</span>
                                            <span className="text-slate-400">{stats.draws}무</span>
                                            <span className="text-rose-500">{stats.losses}패</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-slate-500">{stats.total}경기</span>
                                        </div>
                                    </div>

                                    {/* 경기 목록 */}
                                    <div className="space-y-2">
                                        {matches.map((schedule: any) => {
                                            const result = getMatchResult(schedule)
                                            const style = getResultStyle(result)
                                            const typeInfo = getTypeInfo(schedule.type)
                                            const hasScore = schedule.ourScore != null && schedule.opponentScore != null

                                            return (
                                                <div
                                                    key={schedule.id}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${style.bg} ${style.border} hover:shadow-sm`}
                                                >
                                                    {/* 결과 인디케이터 */}
                                                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${style.accent}`} />

                                                    {/* 날짜 */}
                                                    <div className="flex flex-col items-center w-10 flex-shrink-0">
                                                        <span className="text-[11px] text-slate-400 font-medium">
                                                            {(() => {
                                                                const d = parseScheduleDate(schedule.date)
                                                                return d.toLocaleDateString('ko-KR', { weekday: 'short' })
                                                            })()}
                                                        </span>
                                                        <span className="text-base font-bold text-slate-700 leading-tight">
                                                            {schedule.date.split('-')[2]}
                                                        </span>
                                                    </div>

                                                    {/* 경기 정보 */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 ${typeInfo.color}`}>
                                                                {typeInfo.label}
                                                            </Badge>
                                                            {schedule.opponentTeam && (
                                                                <span className="text-xs font-medium text-slate-600 truncate">vs {schedule.opponentTeam}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                                            {schedule.location && <span className="truncate">{schedule.location}</span>}
                                                        </div>
                                                    </div>

                                                    {/* 스코어 */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {hasScore ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`text-lg font-black tabular-nums ${result === 'win' ? 'text-emerald-700' : result === 'loss' ? 'text-rose-700' : 'text-slate-600'}`}>
                                                                    {schedule.ourScore}
                                                                </span>
                                                                <span className="text-xs text-slate-400 font-medium">-</span>
                                                                <span className={`text-lg font-black tabular-nums ${result === 'loss' ? 'text-emerald-700' : result === 'win' ? 'text-rose-700' : 'text-slate-600'}`}>
                                                                    {schedule.opponentScore}
                                                                </span>
                                                                <Badge className={`text-[10px] font-bold ml-1 ${result === 'win' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                                        result === 'draw' ? 'bg-slate-400 hover:bg-slate-500' :
                                                                            'bg-rose-500 hover:bg-rose-600'
                                                                    } text-white border-0`}>
                                                                    {style.label}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            isManagerMode ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-[11px] h-7 gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                                                                    onClick={() => handleOpenResultDialog(schedule)}
                                                                >
                                                                    <ClipboardEdit className="h-3 w-3" />
                                                                    결과입력
                                                                </Button>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">결과 미입력</span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* 결과 입력 다이얼로그 */}
            <MatchResultDialog
                isOpen={isResultDialogOpen}
                onClose={() => setIsResultDialogOpen(false)}
                schedule={resultEditingSchedule}
                onSuccess={handleResultSuccess}
            />
        </div>
    )
}
