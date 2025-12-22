"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Users } from "lucide-react"

interface MatchResultDialogProps {
    isOpen: boolean
    onClose: () => void
    schedule: any
    onSuccess: () => void
}

export function MatchResultDialog({ isOpen, onClose, schedule, onSuccess }: MatchResultDialogProps) {
    const [ourScore, setOurScore] = useState("")
    const [opponentScore, setOpponentScore] = useState("")
    const [matchSummary, setMatchSummary] = useState("")
    const [mvpUserId, setMvpUserId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 일정이 변경될 때 초기값 설정
    useEffect(() => {
        if (schedule && isOpen) {
            setOurScore(schedule.ourScore !== null && schedule.ourScore !== undefined ? String(schedule.ourScore) : "")
            setOpponentScore(schedule.opponentScore !== null && schedule.opponentScore !== undefined ? String(schedule.opponentScore) : "")
            setMatchSummary(schedule.matchSummary || "")
            setMvpUserId(schedule.mvpUserId || "")
        }
    }, [schedule, isOpen])

    // 참석자 목록 (참석한 사람만)
    // API returns flat structure: { name, status, userId, ... }
    const attendees = schedule?.attendees?.filter((a: any) =>
        a.status === 'attending' || a.status === 'attended'
    ) || []

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
                    ourScore,
                    opponentScore,
                    matchSummary,
                    mvpUserId: mvpUserId === "none" ? null : mvpUserId,
                }),
            })

            if (!response.ok) {
                throw new Error("결과 저장에 실패했습니다.")
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error("결과 저장 오류:", error)
            alert("결과 저장 중 오류가 발생했습니다.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!schedule) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>경기 결과 입력</DialogTitle>
                    <DialogDescription>
                        {schedule.title} ({schedule.date} {schedule.time})
                        <br />
                        경기 결과를 입력해주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ourScore" className="text-blue-600 font-bold">우리팀 점수</Label>
                            <Input
                                id="ourScore"
                                type="number"
                                value={ourScore}
                                onChange={(e) => setOurScore(e.target.value)}
                                placeholder="0"
                                className="text-center text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="opponentScore" className="text-red-600 font-bold">상대팀 점수</Label>
                            <Input
                                id="opponentScore"
                                type="number"
                                value={opponentScore}
                                onChange={(e) => setOpponentScore(e.target.value)}
                                placeholder="0"
                                className="text-center text-lg font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mvp" className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            MOM (Man of the Match)
                        </Label>
                        <Select value={mvpUserId} onValueChange={setMvpUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="MOM을 선택해주세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">선택 안 함</SelectItem>
                                {attendees.map((attendee: any) => (
                                    <SelectItem key={attendee.userId} value={attendee.userId}>
                                        {attendee.name} {attendee.isGuest ? "(게스트)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {attendees.length === 0 && (
                            <p className="text-xs text-muted-foreground text-red-500">
                                * 참석 투표 완료된 인원이 없어 MOM을 선택할 수 없습니다.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">경기 총평 / 코멘트</Label>
                        <Textarea
                            id="summary"
                            value={matchSummary}
                            onChange={(e) => setMatchSummary(e.target.value)}
                            placeholder="경기 내용, 특이사항, 피드백 등을 자유롭게 적어주세요."
                            className="h-24"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "저장 중..." : "저장완료"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
