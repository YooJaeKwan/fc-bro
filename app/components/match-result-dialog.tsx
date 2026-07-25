'use client'

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus, Check, ChevronsUpDown, AlertTriangle, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"

interface MatchResultDialogProps {
    isOpen: boolean
    onClose: () => void
    schedule: any
    onSuccess: () => void
}

interface GoalRecord {
    id: string
    scorerId: string
    scorerName: string
    assistId: string
    assistName: string
    team: 'yellow' | 'blue' | 'home' | 'away'
    quarter: number
}

interface Player {
    id: string
    name: string
    team?: 'yellow' | 'blue'
}

export function MatchResultDialog({ isOpen, onClose, schedule, onSuccess }: MatchResultDialogProps) {
    const [ourScore, setOurScore] = useState(0)
    const [opponentScore, setOpponentScore] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isImageDeleted, setIsImageDeleted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const goalsEndRef = useRef<HTMLDivElement>(null)

    // 골/도움/MVP 상태
    const [goals, setGoals] = useState<GoalRecord[]>([])
    const [mvpId, setMvpId] = useState<string>('')
    const [players, setPlayers] = useState<Player[]>([])
    const [noShowUserIds, setNoShowUserIds] = useState<string[]>([])
    const [allAttendees, setAllAttendees] = useState<any[]>([])
    
    // 골 입력용 임시 상태
    const [pendingGoal, setPendingGoal] = useState({
        quarter: 1,
        team: 'yellow' as 'yellow' | 'blue',
        scorerId: '',
        assistId: 'none'
    })

    // 상세 데이터 로드 상태
    const [matchDetail, setMatchDetail] = useState<any>(null)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)

    // 참석자 목록 구성
    useEffect(() => {
        if (isOpen && schedule?.id) {
            setIsLoadingDetail(true)
            // 서버에서 최신 데이터(참석자 포함) 가져오기
            fetch(`/api/schedule/result?scheduleId=${schedule.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.schedule) {
                        const fullSchedule = data.schedule
                        setMatchDetail(fullSchedule)
                        
                        const playerList: Player[] = []
                        const source = fullSchedule.attendees || fullSchedule.attendances || []

                        // 1. 팀편성이 있는 경우 MOM 후보군 구성
                        if (fullSchedule.teamFormation) {
                            const yellowTeam = fullSchedule.teamFormation.yellowTeam || []
                            const blueTeam = fullSchedule.teamFormation.blueTeam || []

                            yellowTeam.forEach((p: any) => {
                                playerList.push({ id: p.userId, name: p.name, team: 'yellow' })
                            })
                            blueTeam.forEach((p: any) => {
                                playerList.push({ id: p.userId, name: p.name, team: 'blue' })
                            })
                        } else {
                            // 팀편성이 없는 경우 (A매치 등) 참석/노쇼 인원만 MOM 후보군
                            source
                                .filter((a: any) => {
                                    const s = (a.status || '').toUpperCase()
                                    return s === 'ATTENDING' || s === 'NO_SHOW'
                                })
                                .forEach((a: any) => {
                                    playerList.push({
                                        id: a.userId || a.guestId,
                                        name: a.user?.realName || a.user?.nickname || a.guestName || a.name || '게스트'
                                    })
                                })
                        }
                        setPlayers(playerList)

                        // 2. 참석 확정 인원만 노쇼 선택 대상에 포함 (ATTENDING 및 기존 NO_SHOW)
                        let attendeesForNoShow = source.filter((a: any) => {
                            const s = (a.status || '').toUpperCase()
                            return s === 'ATTENDING' || s === 'NO_SHOW'
                        })

                        // 팀편성이 있는 경우 팀원 목록의 인원도 안전하게 포함
                        if (fullSchedule.teamFormation) {
                            const yellow = fullSchedule.teamFormation.yellowTeam || []
                            const blue = fullSchedule.teamFormation.blueTeam || []
                            const teamUserIds = new Set([...yellow, ...blue].map((p: any) => p.userId).filter(Boolean))

                            source.forEach((a: any) => {
                                const id = a.userId || a.guestId
                                if (id && teamUserIds.has(id)) {
                                    if (!attendeesForNoShow.some((existing: any) => (existing.userId || existing.guestId) === id)) {
                                        attendeesForNoShow.push(a)
                                    }
                                }
                            })
                        }

                        setAllAttendees(attendeesForNoShow)
                        
                        // 기존 노쇼 인원 체크
                        const existingNoShows = source
                            .filter((a: any) => (a.status || '').toUpperCase() === 'NO_SHOW')
                            .map((a: any) => a.userId || a.guestId)
                        setNoShowUserIds(existingNoShows)

                        // 3. 기존 결과 필드 로드
                        setOurScore(fullSchedule.ourScore !== null ? Number(fullSchedule.ourScore) : 0)
                        setOpponentScore(fullSchedule.opponentScore !== null ? Number(fullSchedule.opponentScore) : 0)
                        setMvpId(fullSchedule.mvpUserId || '')

                        if (fullSchedule.matchPhotoUrl) {
                            setImagePreview(fullSchedule.matchPhotoUrl)
                            setIsImageDeleted(false)
                        }

                        // 기존 골/도움 기록 로드
                        if (fullSchedule.goalRecords && Array.isArray(fullSchedule.goalRecords)) {
                            setGoals(fullSchedule.goalRecords.map((g: any, idx: number) => ({
                                id: g.id || `existing_${idx}`,
                                scorerId: g.scorerId || '',
                                scorerName: g.scorerName || '',
                                assistId: g.assistId || '',
                                assistName: g.assistName || '',
                                team: g.team || 'yellow',
                                quarter: g.quarter || 1
                            })))
                        } else {
                            setGoals([])
                        }
                        setIsLoadingDetail(false)
                    } else {
                        setIsLoadingDetail(false)
                    }
                })
                .catch(err => {
                    console.error("경기 정보 로드 오류:", err)
                    setIsLoadingDetail(false)
                })
        } else if (!isOpen) {
            resetForm()
            setMatchDetail(null)
        }
    }, [isOpen, schedule?.id])

    // 골 추가 시 자동 스크롤
    useEffect(() => {
        if (goals.length > 0) {
            goalsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [goals.length])

    const resetForm = () => {
        setOurScore(0)
        setOpponentScore(0)
        setSelectedImage(null)
        setImagePreview(null)
        setIsImageDeleted(false)
        setGoals([])
        setMvpId('')
        setNoShowUserIds([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    // 점수 증가/감소 핸들러
    const incrementOurScore = () => setOurScore(prev => Math.min(prev + 1, 99))
    const decrementOurScore = () => setOurScore(prev => Math.max(prev - 1, 0))
    const incrementOpponentScore = () => setOpponentScore(prev => Math.min(prev + 1, 99))
    const decrementOpponentScore = () => setOpponentScore(prev => Math.max(prev - 1, 0))

    // 골 기록 추가
    const addGoal = () => {
        if (!pendingGoal.scorerId) {
            alert('득점자를 선택해주세요.')
            return
        }

        const scorer = players.find(p => p.id === pendingGoal.scorerId)
        const assist = players.find(p => p.id === pendingGoal.assistId)

        const newGoal: GoalRecord = {
            id: Date.now().toString(),
            scorerId: pendingGoal.scorerId,
            scorerName: pendingGoal.scorerId === 'own_goal' ? '자책골' : (scorer?.name || ''),
            assistId: pendingGoal.assistId === 'none' ? '' : pendingGoal.assistId,
            assistName: (pendingGoal.assistId !== 'none' && pendingGoal.assistId !== 'own_goal') ? (assist?.name || '') : '',
            team: pendingGoal.team,
            quarter: pendingGoal.quarter
        }
        
        setGoals([...goals, newGoal])
        
        // 입력 칸 초기화 (쿼터와 팀은 유지하여 연속 입력 편의성 제공)
        setPendingGoal(prev => ({
            ...prev,
            scorerId: '',
            assistId: 'none'
        }))
    }

    // 골 기록 삭제
    const removeGoal = (goalId: string) => {
        setGoals(goals.filter(g => g.id !== goalId))
    }

    // 팀 변경
    const updateTeam = (goalId: string, team: 'yellow' | 'blue') => {
        setGoals(goals.map(g =>
            g.id === goalId
                ? { ...g, team, scorerId: '', scorerName: '', assistId: '', assistName: '' }
                : g
        ))
    }

    // 득점자 변경
    const updateScorer = (goalId: string, playerId: string) => {
        const player = players.find(p => p.id === playerId)
        setGoals(goals.map(g =>
            g.id === goalId
                ? {
                    ...g,
                    scorerId: playerId,
                    scorerName: playerId === 'own_goal' ? '자책골' : (player?.name || ''),
                    assistId: playerId === 'own_goal' ? '' : g.assistId,
                    assistName: playerId === 'own_goal' ? '' : g.assistName
                }
                : g
        ))
    }

    // 어시스트 변경
    const updateAssist = (goalId: string, playerId: string) => {
        const player = players.find(p => p.id === playerId)
        setGoals(goals.map(g =>
            g.id === goalId
                ? { ...g, assistId: playerId === 'none' ? '' : playerId, assistName: playerId === 'none' ? '' : (player?.name || '') }
                : g
        ))
    }

    // 쿼터 변경
    const updateQuarter = (goalId: string, quarter: number) => {
        setGoals(goals.map(g =>
            g.id === goalId
                ? { ...g, quarter }
                : g
        ))
    }

    // 노쇼 토글
    const toggleNoShow = (userId: string) => {
        setNoShowUserIds(prev => {
            const isNoShow = prev.includes(userId)
            if (isNoShow) {
                return prev.filter(id => id !== userId)
            } else {
                setGoals(current => current.map(g => {
                    const newG = { ...g }
                    if (g.scorerId === userId) {
                        newG.scorerId = ''
                        newG.scorerName = ''
                    }
                    if (g.assistId === userId) {
                        newG.assistId = ''
                        newG.assistName = ''
                    }
                    return newG
                }))
                if (mvpId === userId) setMvpId('')
                return [...prev, userId]
            }
        })
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("이미지 크기는 5MB 이하여야 합니다.")
                return
            }
            setSelectedImage(file)
            setIsImageDeleted(false)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            let matchPhotoUrl = schedule.matchPhotoUrl

            if (isImageDeleted && !selectedImage) {
                matchPhotoUrl = null
            }

            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop()
                const fileName = `${schedule.id}_${Date.now()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('match-photos')
                    .upload(filePath, selectedImage)

                if (uploadError) {
                    throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('match-photos')
                    .getPublicUrl(filePath)

                matchPhotoUrl = publicUrl
            }

            const sortedGoals = [...goals]
                .filter(g => g.scorerId)
                .sort((a, b) => a.quarter - b.quarter)

            const response = await fetch("/api/schedule/result", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scheduleId: schedule.id,
                    ourScore: ourScore,
                    opponentScore: opponentScore,
                    matchPhotoUrl: matchPhotoUrl,
                    mvpUserId: mvpId && mvpId !== 'none' ? mvpId : null,
                    goals: sortedGoals,
                    noShowUserIds: noShowUserIds
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "결과 저장에 실패했습니다.")
            }

            resetForm()
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error("결과 저장 오류:", error)
            alert(error.message || "결과 저장 중 오류가 발생했습니다.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!schedule) return null

    const isInternal = schedule.type === 'internal'
    const activePlayers = players.filter(p => !noShowUserIds.includes(p.id))
    const yellowPlayers = activePlayers.filter(p => p.team === 'yellow')
    const bluePlayers = activePlayers.filter(p => p.team === 'blue')
    const quarterOptions = [1, 2, 3, 4]

    const getTeamPlayers = (team: 'yellow' | 'blue' | 'home' | 'away') => {
        if (team === 'yellow') return yellowPlayers
        if (team === 'blue') return bluePlayers
        return activePlayers
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="shrink-0 pb-2">
                    <DialogTitle>경기 결과 입력</DialogTitle>
                    <DialogDescription>
                        {schedule.title} ({schedule.date} {schedule.time})
                    </DialogDescription>
                </DialogHeader>

                {isLoadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500 font-medium tracking-tight">경기 정보를 불러오는 중...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-6 overscroll-contain">
                        {schedule.type === 'training' || schedule.type === 'futsal' ? (
                            <div className="text-center py-4 text-muted-foreground">
                                {schedule.type === 'training' ? '연습' : '풋살'} 경기는 별도의 점수를 기록하지 않습니다.
                            </div>
                        ) : (
                            <>
                                {/* 스코어보드 */}
                                <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-2 text-center">
                                            <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block ${isInternal ? 'bg-yellow-400/20 text-yellow-200' : 'bg-sky-400/20 text-sky-200'}`}>
                                                {isInternal ? 'YELLOW' : 'HOME'}
                                            </div>
                                            <div className={`text-5xl font-bold font-mono ${isInternal ? 'text-yellow-400' : 'text-sky-400'}`}>
                                                {ourScore}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button onClick={decrementOurScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 text-white" disabled={ourScore === 0}><Minus className="h-3 w-3" /></Button>
                                                <Button onClick={incrementOurScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 text-white" disabled={ourScore === 99}><Plus className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                        <div className="text-slate-500 text-sm font-bold">VS</div>
                                        <div className="flex-1 space-y-2 text-center">
                                            <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block ${isInternal ? 'bg-blue-400/20 text-blue-200' : 'bg-rose-400/20 text-rose-200'}`}>
                                                {isInternal ? 'BLUE' : 'AWAY'}
                                            </div>
                                            <div className={`text-5xl font-bold font-mono ${isInternal ? 'text-blue-400' : 'text-rose-400'}`}>
                                                {opponentScore}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button onClick={decrementOpponentScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 text-white" disabled={opponentScore === 0}><Minus className="h-3 w-3" /></Button>
                                                <Button onClick={incrementOpponentScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 text-white" disabled={opponentScore === 99}><Plus className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </>
                        )}

                        {/* 노쇼 관리 */}
                        {allAttendees.length > 0 ? (
                            <div className="space-y-2 p-4 bg-red-50/50 rounded-xl border border-red-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                                        <AlertTriangle className="h-4 w-4" /> 노쇼(No-show) 관리
                                    </div>
                                    <span className="text-[11px] text-red-400 font-medium">참석 인원 ({allAttendees.length}명) 중 선택</span>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between h-10 border-red-200 bg-white">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {noShowUserIds.length > 0 ? (
                                                    <Badge variant="destructive" className="h-5 px-1.5">{noShowUserIds.length}명 노쇼</Badge>
                                                ) : <span className="text-xs text-muted-foreground">노쇼 인원 선택 ({allAttendees.length}명 중)</span>}
                                            </div>
                                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                        className="w-[var(--radix-popover-trigger-width)] p-1 z-[100]"
                                        onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                        <div 
                                            className="max-h-[220px] overflow-y-auto overscroll-contain space-y-0.5"
                                            onWheel={(e) => e.stopPropagation()}
                                            onTouchMove={(e) => e.stopPropagation()}
                                        >
                                            {allAttendees.map(a => {
                                                const id = a.userId || a.guestId
                                                const name = a.user?.realName || a.user?.nickname || a.guestName || a.name || '게스트'
                                                const isNoShow = noShowUserIds.includes(id)
                                                return (
                                                    <div key={id} onClick={() => toggleNoShow(id)} className={cn("flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-colors", isNoShow ? "bg-red-50 text-red-700 font-semibold" : "hover:bg-slate-50 text-slate-700")}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isNoShow ? "bg-red-500 border-red-500" : "border-slate-300")}>
                                                                {isNoShow && <Check className="h-2.5 w-2.5 text-white" />}
                                                            </div>
                                                            <span>{name}</span>
                                                        </div>
                                                        {isNoShow && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">NO-SHOW</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-400">
                                참석 확정 인원이 없어 노쇼를 지정할 수 없습니다.
                            </div>
                        )}


                        <DialogFooter className="flex gap-2 pt-2">
                            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={handleClose}>취소</Button>
                            <Button 
                                className="flex-1 rounded-xl h-11 bg-slate-900 text-white" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting || isLoadingDetail}
                            >
                                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 저장 중...</> : '결과 저장하기'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
