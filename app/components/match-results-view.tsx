"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trophy, ChevronDown, ChevronUp, Users } from "lucide-react"
import ScheduleCard from "./schedule-card"
import { TeamFormation } from "./team-formation"
import { MatchResultDialog } from "./match-result-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface MatchResultsViewProps {
    isManagerMode: boolean
    currentUser?: any
}

export function MatchResultsView({ isManagerMode, currentUser }: MatchResultsViewProps) {
    const [schedules, setSchedules] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false)
    const [resultEditingSchedule, setResultEditingSchedule] = useState<any>(null)

    useEffect(() => {
        fetchSchedules()
    }, [])

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

    // 단일 일정 갱신 (결과 입력 후 등)
    const refreshSchedule = async (scheduleId: string) => {
        try {
            const response = await fetch('/api/schedule/list')
            const result = await response.json()
            if (result.success) {
                setSchedules(result.schedules)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleOpenResultDialog = (schedule: any) => {
        setResultEditingSchedule(schedule)
        setIsResultDialogOpen(true)
    }

    const handleResultSuccess = () => {
        fetchSchedules() // 전체 다시 불러오기 (순서 등이 바뀔 수도 있으므로)
        setIsResultDialogOpen(false)
        setResultEditingSchedule(null)
    }

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return
        try {
            const response = await fetch('/api/schedule/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduleId, userId: currentUser?.id })
            })
            if (response.ok) fetchSchedules()
        } catch (error) {
            console.error(error)
        }
    }

    // Past & Completed or just Past?
    // User said "Past games".
    const pastSchedules = schedules
        .filter(schedule => {
            // 이미 종료된 경기(결과 입력됨)는 무조건 표시
            if (schedule.status === 'COMPLETED') return true

            // 날짜와 시간으로 과거 여부 판별
            const [year, month, day] = schedule.date.split('-')
            const [hours, minutes] = schedule.time.split(':')

            const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
            // 경기 시간이 확실히 지난 경우만 표시 (마진 2시간?) 
            // -> 그냥 현재 시간보다 앞서면 '지난 일정'으로 간주하지만, 
            //    경기 진행중일 수 있으니 쿼터타임 고려? 
            //    단순히 시작시간이 지났으면 리스트에 띄우는게 결과 입력하기 좋음.
            const now = new Date()
            return scheduleDate < now
        })
        .sort((a, b) => {
            const [yearA, monthA, dayA] = a.date.split('-')
            const [yearB, monthB, dayB] = b.date.split('-')
            const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA))
            const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB))
            return dateB.getTime() - dateA.getTime() // 최신순
        })

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    경기 결과 및 기록
                </h2>
            </div>

            {pastSchedules.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        지난 경기 기록이 없습니다.
                    </CardContent>
                </Card>
            ) : (
                pastSchedules.map(schedule => (
                    <div key={schedule.id} className="space-y-4">
                        <ScheduleCard
                            schedule={schedule}
                            currentUser={currentUser}
                            isManagerMode={isManagerMode}
                            isUpdating={false}
                            onAttendanceUpdate={() => { }} // 지난 경기는 투표 불가하므로 빈 함수
                            onAttendanceStatsUpdate={() => { }}
                            onFormationReset={() => { }}
                            onGuestStatusUpdate={() => { }}
                            onDeleteSchedule={handleDeleteSchedule} // 삭제는 허용
                            onEditSchedule={() => { }} // 수정은 상위에서 처리 안하고 여기서직접? ScheduleCard calls onEditSchedule prop... 
                            // 단순화를 위해 결과 입력만 허용하고 일정 자체 수정은 일정관리 탭에서? 
                            // User said "managed separately", implying full management. 
                            // For now, let's enable result entry.
                            onVoteUpdate={() => { }}
                            onEnterResult={handleOpenResultDialog}
                        />

                        <div className="border-b border-gray-200 my-6"></div>
                    </div>
                ))
            )}

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
