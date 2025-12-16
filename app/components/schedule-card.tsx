'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, X, Check, UserPlus, UserMinus, Edit, Trash2 } from 'lucide-react'
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

  return (
    <Card className={`transition-shadow ${
      isPastSchedule 
        ? 'bg-gray-50 border-gray-200' 
        : 'hover:shadow-lg'
    }`}>
      {isUpdating ? (
        <ScheduleSkeleton />
      ) : (
        <CardContent className={`p-6 ${isPastSchedule ? 'opacity-75' : ''}`}>
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
                  {schedule.type === 'internal' ? '내부경기' : 
                   schedule.type === 'external' ? '외부경기' : 
                   schedule.type === 'friendly' ? '친선경기' : schedule.type}
                </Badge>
                {isPastSchedule && (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">
                    지난 경기
                  </Badge>
                )}
              </div>
            </div>

            {/* D-Day 표시 */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                  <CalendarIcon className="h-4 w-4" />
                  {(() => {
                    if (daysLeft === 0) return "오늘 경기!"
                    if (daysLeft === 1) return "내일 경기!"
                    if (daysLeft > 0) return `D-${daysLeft}`
                    return "지난 경기"
                  })()}
                </div>
              </div>

              {/* 관리자 아이콘 버튼들 */}
              {isManagerMode && (
                <div className="flex items-center justify-center gap-2">
                  {/* 이후 일정: 수정/삭제 */}
                  {!isPastSchedule && (
                    <>
                      <Button
                        onClick={() => onEditSchedule(schedule)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onDeleteSchedule(schedule.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {/* 지난 경기: 삭제만 */}
                  {isPastSchedule && (
                    <Button
                      onClick={() => onDeleteSchedule(schedule.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* 장소 정보 */}
            {schedule.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className={`h-4 w-4 ${isPastSchedule ? 'text-gray-400' : ''}`} />
                <span className={isPastSchedule ? 'text-gray-500' : ''}>{schedule.location}</span>
              </div>
            )}

            {/* 설명 */}
            {schedule.description && (
              <div className={`text-sm ${isPastSchedule ? 'text-gray-500' : 'text-gray-600'}`}>
                {schedule.description}
              </div>
            )}

            {/* 지난 경기 안내 메시지 */}
            {isPastSchedule && (
              <div className="bg-gray-100 text-gray-600 text-sm p-3 rounded-lg text-center">
                이 경기는 더 이상 관리되지 않는 지난 경기입니다.
              </div>
            )}

            {/* 참석 투표 */}
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
