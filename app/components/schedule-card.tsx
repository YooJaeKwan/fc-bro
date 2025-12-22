'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, X, Check, UserPlus, UserMinus, Edit, Trash2, Trophy } from 'lucide-react'
import { calculateDaysLeft } from '@/lib/utils'
import { AttendanceVoting } from './attendance-voting'

interface ScheduleCardProps {
  schedule: any
  currentUser: any
  isManagerMode: boolean
  isUpdating: boolean
  onAttendanceUpdate: (scheduleId: string) => void
  onAttendanceStatsUpdate: (scheduleId: string) => void
  onFormationReset: () => void
  onGuestStatusUpdate: (scheduleId: string) => void
  onDeleteSchedule: (scheduleId: string) => void
  onEditSchedule: (schedule: any) => void
  onVoteUpdate?: () => void
  onEnterResult?: (schedule: any) => void
  hasTeamFormation?: boolean
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  currentUser,
  isManagerMode,
  isUpdating,
  onAttendanceUpdate,
  onAttendanceStatsUpdate,
  onFormationReset,
  onGuestStatusUpdate,
  onDeleteSchedule,
  onEditSchedule,
  onVoteUpdate,
  onEnterResult,
  hasTeamFormation = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 참석 현황 통계 계산
  const getAttendanceStats = (attendees: any[]) => {
    if (!attendees || attendees.length === 0) {
      return { attending: 0, notAttending: 0, pending: 0, total: 0, percentage: 0 }
    }

    const attending = attendees.filter(att =>
      att.status === 'attending' || att.status === 'attended'
    ).length
    const notAttending = attendees.filter(att =>
      att.status === 'not_attending' || att.status === 'not_attended'
    ).length
    const pending = attendees.filter(att => att.status === 'pending').length
    const total = attendees.length
    const percentage = total > 0 ? Math.round((attending / total) * 100) : 0

    return { attending, notAttending, pending, total, percentage }
  }

  // 사용자 참석 상태 확인
  const getUserAttendanceStatus = (schedule: any) => {
    if (!currentUser?.id || !schedule.attendees) return null
    const userAttendance = schedule.attendees.find((att: any) => att.userId === currentUser.id)
    return userAttendance?.status || null
  }

  // 일정 타입별 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'external': return 'bg-green-100 text-green-800 border-green-300'
      case 'friendly': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'match': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // 게스트 허용 상태 토글
  const handleGuestToggle = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/schedule/toggle-guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: schedule.id })
      })

      if (response.ok) {
        onGuestStatusUpdate(schedule.id)
        onAttendanceUpdate(schedule.id)
      }
    } catch (error) {
      console.error('게스트 상태 토글 오류:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = getAttendanceStats(schedule.attendees)
  const daysLeft = calculateDaysLeft(schedule.date)
  const isPastSchedule = daysLeft < 0
  const userStatus = getUserAttendanceStatus(schedule)

  // 스켈레톤 로딩 컴포넌트
  const ScheduleSkeleton = () => (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span className="text-sm font-medium">참석현황 업데이트 중...</span>
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )

  const hasResult = schedule.ourScore !== null && schedule.ourScore !== undefined

  return (
    <Card className={`transition-shadow ${isPastSchedule
        ? 'bg-gray-50 border-gray-200'
        : 'hover:shadow-lg'
      }`}>
      {isUpdating ? (
        <ScheduleSkeleton />
      ) : (
        <CardContent className={`p-6 ${isPastSchedule ? 'opacity-90' : ''}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {/* 일정 기본 정보 */}
              <h3 className={`text-base font-semibold ${isPastSchedule ? 'text-gray-600' : ''}`}>
                {(() => {
                  // 한국시간으로 저장된 날짜를 그대로 표시
                  const [year, month, day] = schedule.date.split('-')
                  const date = new Date(Number(year), Number(month) - 1, Number(day))
                  return date.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })
                })()} <span className={isPastSchedule ? 'text-gray-500' : 'text-blue-600'}>{schedule.time}</span>
              </h3>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge className={getTypeColor(schedule.type)} variant="secondary">
                  {schedule.type === "internal" ? "자체경기" :
                    schedule.type === "match" ? "A매치" :
                      schedule.type === "training" ? "연습" : schedule.type}
                </Badge>
                {isPastSchedule && (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">
                    종료
                  </Badge>
                )}
              </div>
            </div>

            {/* D-Day 표시 */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${hasResult ? 'bg-slate-800 text-white' : 'bg-blue-50 text-blue-700'}`}>
                  {hasResult ? (
                    <>
                      <span className="text-xl">{schedule.ourScore}</span>
                      <span className="text-xs text-slate-400">vs</span>
                      <span className="text-xl">{schedule.opponentScore}</span>
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-4 w-4" />
                      {(() => {
                        if (daysLeft === 0) return "오늘 경기!"
                        if (daysLeft === 1) return "내일 경기!"
                        if (daysLeft > 0) return `D-${daysLeft}`
                        return "경기 종료"
                      })()}
                    </>
                  )}
                </div>
              </div>

              {/* 관리자 아이콘 버튼들 */}
              {isManagerMode && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => onEditSchedule(schedule)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    title="일정 수정"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onDeleteSchedule(schedule.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="일정 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 장소 정보 */}
            {schedule.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className={`h-4 w-4 ${isPastSchedule ? 'text-gray-400' : ''}`} />
                <span className={isPastSchedule ? 'text-gray-500' : ''}>{schedule.location}</span>
                {schedule.matchSummary && isPastSchedule && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">후기 있음</span>
                )}
              </div>
            )}

            {/* 설명 */}
            {schedule.description && (
              <div className={`text-sm ${isPastSchedule ? 'text-gray-500' : 'text-gray-600'}`}>
                {schedule.description}
              </div>
            )}

            {/* 경기 결과 입력 버튼 (관리자용) */}
            {isManagerMode && onEnterResult && (
              <div className="pt-2">
                <Button
                  onClick={() => onEnterResult(schedule)}
                  variant={hasResult ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {hasResult ? "경기 결과 수정" : "경기 결과 입력"}
                </Button>
              </div>
            )}

            {/* 참석 투표 (지난 경기가 아니거나, 지난 경기여도 결과가 없을 때 보여줄 수 있음 - 정책상 지난 경기는 투표 마감) */}
            {!isPastSchedule && currentUser?.id && (
              <div className="pt-4 border-t">
                <AttendanceVoting
                  scheduleId={schedule.id}
                  currentUserId={currentUser.id}
                  isPastSchedule={isPastSchedule}
                  allowGuests={false}
                  hasTeamFormation={!!schedule.teamFormation}
                  isManagerMode={isManagerMode}
                  onVoteUpdate={() => {
                    onVoteUpdate?.()
                    onAttendanceUpdate(schedule.id)
                  }}
                />
              </div>
            )}

          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default ScheduleCard
