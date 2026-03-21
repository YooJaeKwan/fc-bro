'use client'

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus, Upload, X, Image as ImageIcon, Goal, Trophy, Check, ChevronsUpDown, AlertTriangle, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
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
                            // 팀편성이 없는 경우 참석/노쇼 인원만 MOM 후보군
                            source
                                .filter((a: any) => a.status === 'ATTENDING' || a.status === 'NO_SHOW')
                                .forEach((a: any) => {
                                    playerList.push({
                                        id: a.userId || a.guestId,
                                        name: a.user?.realName || a.user?.nickname || a.guestName || '게스트'
                                    })
                                })
                        }
                        setPlayers(playerList)

                        // 2. 모든 투표자 저장 (노쇼 선택용)
                        const attendeesForNoShow = source.filter((a: any) => 
                            ['ATTENDING', 'NO_SHOW', 'PENDING', 'pending'].includes(a.status)
                        )
                        setAllAttendees(attendeesForNoShow)
                        
                        // 기존 노쇼 인원 체크
                        const existingNoShows = source
                            .filter((a: any) => a.status === 'NO_SHOW' || a.status === 'no_show')
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
        const newGoal: GoalRecord = {
            id: Date.now().toString(),
            scorerId: '',
            scorerName: '',
            assistId: '',
            assistName: '',
            team: 'yellow',
            quarter: 1
        }
        setGoals([...goals, newGoal])
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
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
                    <div className="py-4 space-y-6">
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

                                {/* 골 기록 섹션 */}
                                {isInternal && players.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Goal className="h-4 w-4" /> 골 기록
                                            </div>
                                            <Button type="button" size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={addGoal}>
                                                <Plus className="h-3 w-3 mr-1" /> 골 추가
                                            </Button>
                                        </div>
                                        {goals.length > 0 && (
                                            <div className="space-y-2">
                                                {goals.map((goal) => (
                                                    <div key={goal.id} className={`border rounded-lg p-3 space-y-2 ${goal.team === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Select value={goal.quarter.toString()} onValueChange={(v) => updateQuarter(goal.id, Number(v))}>
                                                                <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>{quarterOptions.map(q => <SelectItem key={q} value={q.toString()}>{q}Q</SelectItem>)}</SelectContent>
                                                            </Select>
                                                            <Select value={goal.team} onValueChange={(v) => updateTeam(goal.id, v as 'yellow' | 'blue')}>
                                                                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="yellow">Yellow</SelectItem>
                                                                    <SelectItem value="blue">Blue</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <div className="flex-1" />
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => removeGoal(goal.id)}><X className="h-4 w-4" /></Button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Select value={goal.scorerId} onValueChange={(v) => updateScorer(goal.id, v)}>
                                                                <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue placeholder="⚽ 득점자" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="own_goal" className="text-red-500 font-bold">⚠️ 자책골</SelectItem>
                                                                    {getTeamPlayers(goal.team).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select value={goal.assistId || 'none'} onValueChange={(v) => updateAssist(goal.id, v)} disabled={goal.scorerId === 'own_goal'}>
                                                                <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue placeholder="👟 도움" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">도움 없음</SelectItem>
                                                                    {getTeamPlayers(goal.team).filter(p => p.id !== goal.scorerId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={goalsEndRef} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* MOM 선택 */}
                                {players.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Trophy className="h-4 w-4 text-yellow-500" /> MOM 선택
                                        </div>
                                        <Select value={mvpId || 'none'} onValueChange={setMvpId}>
                                            <SelectTrigger><SelectValue placeholder="MOM 선택" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">선택 안함</SelectItem>
                                                {activePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        {/* 노쇼 관리 */}
                        {allAttendees.length > 0 && (
                            <div className="space-y-2 p-4 bg-red-50/50 rounded-xl border border-red-100">
                                <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                                    <AlertTriangle className="h-4 w-4" /> 노쇼(No-show) 관리
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between h-10 border-red-200">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {noShowUserIds.length > 0 ? (
                                                    <Badge variant="destructive" className="h-5 px-1.5">{noShowUserIds.length}명 노쇼</Badge>
                                                ) : <span className="text-xs text-muted-foreground">노쇼 인원 선택</span>}
                                            </div>
                                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1">
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {allAttendees.map(a => {
                                                const id = a.userId || a.guestId
                                                const name = a.user?.realName || a.user?.nickname || a.guestName || a.name
                                                const isNoShow = noShowUserIds.includes(id)
                                                return (
                                                    <div key={id} onClick={() => toggleNoShow(id)} className={cn("flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer", isNoShow ? "bg-red-50 text-red-700" : "hover:bg-slate-50")}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isNoShow ? "bg-red-500 border-red-500" : "border-slate-300")}>
                                                                {isNoShow && <Check className="h-2.5 w-2.5 text-white" />}
                                                            </div>
                                                            <span>{name}</span>
                                                        </div>
                                                        {isNoShow && <span className="text-[10px] font-bold">NO-SHOW</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {/* 사진 업로드 */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> 경기 사진
                            </div>
                            <div className="bg-gray-50 border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2">
                                {imagePreview ? (
                                    <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => { setSelectedImage(null); setImagePreview(null); setIsImageDeleted(true); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500">사진 업로드</div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-3 w-3 mr-1" /> {imagePreview ? '변경' : '파일 선택'}</Button>
                            </div>
                        </div>

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
