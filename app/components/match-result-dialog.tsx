"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface MatchResultDialogProps {
    isOpen: boolean
    onClose: () => void
    schedule: any
    onSuccess: () => void
}

export function MatchResultDialog({ isOpen, onClose, schedule, onSuccess }: MatchResultDialogProps) {
    const [ourScore, setOurScore] = useState(0)
    const [opponentScore, setOpponentScore] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 일정이 변경되거나 다이얼로그가 열릴 때 초기값 설정
    useEffect(() => {
        if (isOpen && schedule) {
            // 결과가 이미 입력된 경우 기존 값 표시, 없으면 0
            setOurScore(schedule.ourScore !== null && schedule.ourScore !== undefined ? Number(schedule.ourScore) : 0)
            setOpponentScore(schedule.opponentScore !== null && schedule.opponentScore !== undefined ? Number(schedule.opponentScore) : 0)
        } else if (!isOpen) {
            // 다이얼로그가 닫힐 때 초기화
            resetForm()
        }
    }, [isOpen, schedule?.id]) // isOpen과 schedule.id가 변경될 때마다 실행

    // 폼 초기화 함수
    const resetForm = () => {
        setOurScore(0)
        setOpponentScore(0)
    }

    // 다이얼로그 닫기 핸들러
    const handleClose = () => {
        resetForm()
        onClose()
    }

    // 점수 증가/감소 핸들러
    const incrementOurScore = () => setOurScore(prev => Math.min(prev + 1, 99))
    const decrementOurScore = () => setOurScore(prev => Math.max(prev - 1, 0))
    const incrementOpponentScore = () => setOpponentScore(prev => Math.min(prev + 1, 99))
    const decrementOpponentScore = () => setOpponentScore(prev => Math.max(prev - 1, 0))

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            const response = await fetch("/api/schedule/result", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scheduleId: schedule.id,
                    ourScore: ourScore,
                    opponentScore: opponentScore,
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>경기 결과 입력</DialogTitle>
                    <DialogDescription>
                        {schedule.title} ({schedule.date} {schedule.time})
                        <br />
                        경기 결과를 입력해주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {schedule.type === 'training' ? (
                        <div className="text-center py-4 text-muted-foreground">
                            연습 경기는 별도의 점수를 기록하지 않습니다.<br />
                            특이사항이 있다면 아래 코멘트에 남겨주세요.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 스코어보드 스타일 */}
                            <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between gap-6">
                                    {/* 우리팀/노랑팀 */}
                                    <div className="flex-1 space-y-3">
                                        <div className="text-center">
                                            <div className={`text-xs font-bold mb-2 px-3 py-1 rounded-full inline-block ${schedule.type === 'internal'
                                                ? 'bg-yellow-400/20 text-yellow-200'
                                                : 'bg-sky-400/20 text-sky-200'
                                                }`}>
                                                {schedule.type === 'internal' ? 'YELLOW' : 'HOME'}
                                            </div>
                                            <div className={`text-6xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-yellow-400' : 'text-sky-400'
                                                }`}>
                                                {ourScore}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={decrementOurScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={ourScore === 0}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={incrementOurScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={ourScore === 99}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-500 text-sm font-bold">VS</span>
                                        <div className="h-12 w-px bg-slate-700/50 my-2"></div>
                                    </div>

                                    {/* 상대팀/파랑팀 */}
                                    <div className="flex-1 space-y-3">
                                        <div className="text-center">
                                            <div className={`text-xs font-bold mb-2 px-3 py-1 rounded-full inline-block ${schedule.type === 'internal'
                                                ? 'bg-blue-400/20 text-blue-200'
                                                : 'bg-rose-400/20 text-rose-200'
                                                }`}>
                                                {schedule.type === 'internal' ? 'BLUE' : 'AWAY'}
                                            </div>
                                            <div className={`text-6xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-blue-400' : 'text-rose-400'
                                                }`}>
                                                {opponentScore}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={decrementOpponentScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={opponentScore === 0}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={incrementOpponentScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={opponentScore === 99}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-muted-foreground">
                                +/- 버튼을 눌러 점수를 조정하세요
                            </p>
                        </div>
                    )}
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
