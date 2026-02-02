'use client'

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus, Upload, X, Image as ImageIcon, Goal, Trophy } from "lucide-react"
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

    // 참석자 목록 구성
    useEffect(() => {
        if (isOpen && schedule) {
            const playerList: Player[] = []

            // 팀편성이 있는 경우
            if (schedule.teamFormation) {
                const yellowTeam = schedule.teamFormation.yellowTeam || []
                const blueTeam = schedule.teamFormation.blueTeam || []

                yellowTeam.forEach((p: any) => {
                    playerList.push({
                        id: p.userId,
                        name: p.name,
                        team: 'yellow'
                    })
                })

                blueTeam.forEach((p: any) => {
                    playerList.push({
                        id: p.userId,
                        name: p.name,
                        team: 'blue'
                    })
                })
            } else if (schedule.attendees) {
                schedule.attendees
                    .filter((a: any) => a.status === 'ATTENDING')
                    .forEach((a: any) => {
                        playerList.push({
                            id: a.userId || a.guestId,
                            name: a.name || a.guestName
                        })
                    })
            }

            setPlayers(playerList)

            // 기존 결과 로드
            setOurScore(schedule.ourScore !== null && schedule.ourScore !== undefined ? Number(schedule.ourScore) : 0)
            setOpponentScore(schedule.opponentScore !== null && schedule.opponentScore !== undefined ? Number(schedule.opponentScore) : 0)
            setMvpId(schedule.mvpUserId || '')

            if (schedule.matchPhotoUrl) {
                setImagePreview(schedule.matchPhotoUrl)
                setIsImageDeleted(false)
            } else {
                setImagePreview(null)
                setIsImageDeleted(false)
            }

            // 기존 골/도움 기록 로드
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
                setGoals(schedule.goalRecords.map((g: any, idx: number) => ({
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
        } else if (!isOpen) {
            resetForm()
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
                    // 자책골인 경우 어시스트 삭제
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

    // 이미지 선택 핸들러
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

            // 이미지가 삭제된 경우
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

            // 골 기록을 쿼터순으로 정렬하여 저장
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
                    goals: sortedGoals
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "결과 저장에 실패했습니다.")
            }

            console.log('경기 결과 저장 성공:', data)
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
    const yellowPlayers = players.filter(p => p.team === 'yellow')
    const bluePlayers = players.filter(p => p.team === 'blue')

    // 쿼터 옵션
    const quarterOptions = [1, 2, 3, 4]

    // 골에 해당하는 팀의 선수 목록 반환
    const getTeamPlayers = (team: 'yellow' | 'blue' | 'home' | 'away') => {
        if (team === 'yellow') return yellowPlayers
        if (team === 'blue') return bluePlayers
        return players // home/away인 경우 전체 선수 (또는 빈 배열)
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

                <div className="py-4 space-y-6">
                    {schedule.type === 'training' ? (
                        <div className="text-center py-4 text-muted-foreground">
                            연습 경기는 별도의 점수를 기록하지 않습니다.
                        </div>
                    ) : (
                        <>
                            {/* 스코어보드 */}
                            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg">
                                <div className="flex items-center justify-between gap-4">
                                    {/* 우리팀/노랑팀 */}
                                    <div className="flex-1 space-y-2">
                                        <div className="text-center">
                                            <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block ${isInternal ? 'bg-yellow-400/20 text-yellow-200' : 'bg-sky-400/20 text-sky-200'}`}>
                                                {isInternal ? 'YELLOW' : 'HOME'}
                                            </div>
                                            <div className={`text-5xl font-bold font-mono ${isInternal ? 'text-yellow-400' : 'text-sky-400'}`}>
                                                {ourScore}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button type="button" onClick={decrementOurScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 hover:bg-slate-600 text-white" disabled={ourScore === 0}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Button type="button" onClick={incrementOurScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 hover:bg-slate-600 text-white" disabled={ourScore === 99}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-slate-500 text-sm font-bold">VS</div>

                                    {/* 상대팀/파랑팀 */}
                                    <div className="flex-1 space-y-2">
                                        <div className="text-center">
                                            <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full inline-block ${isInternal ? 'bg-blue-400/20 text-blue-200' : 'bg-rose-400/20 text-rose-200'}`}>
                                                {isInternal ? 'BLUE' : 'AWAY'}
                                            </div>
                                            <div className={`text-5xl font-bold font-mono ${isInternal ? 'text-blue-400' : 'text-rose-400'}`}>
                                                {opponentScore}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button type="button" onClick={decrementOpponentScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 hover:bg-slate-600 text-white" disabled={opponentScore === 0}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Button type="button" onClick={incrementOpponentScore} variant="secondary" size="sm" className="flex-1 h-8 bg-slate-700 hover:bg-slate-600 text-white" disabled={opponentScore === 99}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 골 기록 섹션 - 통합 UI */}
                            {isInternal && players.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Goal className="h-4 w-4" />
                                            골 기록
                                        </div>
                                        <Button type="button" size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={addGoal}>
                                            <Plus className="h-3 w-3 mr-1" /> 골 추가
                                        </Button>
                                    </div>

                                    {goals.length === 0 ? (
                                        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                                            골 기록이 없습니다. 위 버튼을 눌러 추가하세요.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {goals.map((goal) => (
                                                <div key={goal.id} className={`border rounded-lg p-3 space-y-2 ${goal.team === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                                                    }`}>
                                                    {/* 1행: 쿼터, 팀, 삭제 버튼 */}
                                                    <div className="flex items-center gap-2">
                                                        <Select value={goal.quarter.toString()} onValueChange={(v) => updateQuarter(goal.id, Number(v))}>
                                                            <SelectTrigger className="h-8 w-16 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {quarterOptions.map(q => (
                                                                    <SelectItem key={q} value={q.toString()} className="text-xs">{q}Q</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Select value={goal.team} onValueChange={(v) => updateTeam(goal.id, v as 'yellow' | 'blue')}>
                                                            <SelectTrigger className="h-8 w-24 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="yellow" className="text-xs">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                                                        Yellow
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="blue" className="text-xs">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                                                                        Blue
                                                                    </span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        <div className="flex-1" />

                                                        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => removeGoal(goal.id)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* 2행: 득점자, 도움 */}
                                                    <div className="flex items-center gap-2">
                                                        <Select value={goal.scorerId} onValueChange={(v) => updateScorer(goal.id, v)}>
                                                            <SelectTrigger className="h-8 flex-1 text-xs">
                                                                <SelectValue placeholder="⚽ 득점자 선택" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="own_goal" className="text-xs font-bold text-red-500 italic">⚠️ 자책골</SelectItem>
                                                                {getTeamPlayers(goal.team).map(p => (
                                                                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        <Select
                                                            value={goal.assistId || 'none'}
                                                            onValueChange={(v) => updateAssist(goal.id, v)}
                                                            disabled={goal.scorerId === 'own_goal'}
                                                        >
                                                            <SelectTrigger className="h-8 flex-1 text-xs">
                                                                <SelectValue placeholder={goal.scorerId === 'own_goal' ? "도움 없음" : "👟 도움 (선택)"} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none" className="text-xs">도움 없음</SelectItem>
                                                                {getTeamPlayers(goal.team).filter(p => p.id !== goal.scorerId).map(p => (
                                                                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                                                ))}
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
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        MOM 선택
                                    </div>
                                    <Select value={mvpId || 'none'} onValueChange={setMvpId}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="MOM을 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">선택 안함</SelectItem>
                                            {players.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <span className="flex items-center gap-2">
                                                        {p.team && (
                                                            <span className={`w-2 h-2 rounded-full ${p.team === 'yellow' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                                                        )}
                                                        {p.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </>
                    )}

                    {/* 이미지 업로드 섹션 */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            경기 사진 (선택)
                        </div>

                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                            {imagePreview ? (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100">
                                    <Image
                                        src={imagePreview}
                                        alt="경기 사진 미리보기"
                                        fill
                                        className="object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={() => {
                                            setSelectedImage(null)
                                            setImagePreview(null)
                                            setIsImageDeleted(true)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500">
                                    기념 사진을 업로드하세요
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {imagePreview ? "사진 변경" : "사진 선택"}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "저장 중..." : "저장"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
