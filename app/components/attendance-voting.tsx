'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface AttendanceVotingProps {
  scheduleId: string
  currentUserId: string
  isPastSchedule: boolean
  onVoteUpdate?: () => void
}

interface AttendanceStats {
  attending: number
  notAttending: number
  pending: number
  total: number
}

interface Attendee {
  userId: string
  name: string
  status: 'attending' | 'not_attending' | 'pending'
  position?: string
  profileImage?: string | null
  isGuest?: boolean
}

export function AttendanceVoting({
  scheduleId,
  currentUserId,
  isPastSchedule,
  onVoteUpdate
}: AttendanceVotingProps) {
  const [myStatus, setMyStatus] = useState<'attending' | 'not_attending' | 'pending'>('pending')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState<AttendanceStats>({
    attending: 0,
    notAttending: 0,
    pending: 0,
    total: 0
  })
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [detailDialogType, setDetailDialogType] = useState<'attending' | 'not_attending' | 'pending' | null>(null)

  // 투표 현황 조회
  const fetchAttendance = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/schedule/attendance?scheduleId=${scheduleId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        // 내 투표 상태 찾기
        const myAttendance = result.attendees.find((a: Attendee) => a.userId === currentUserId && !a.isGuest)
        if (myAttendance) {
          setMyStatus(myAttendance.status)
        } else {
          setMyStatus('pending')
        }

        // 통계 업데이트
        setStats(result.stats)

        // 참석자 목록 업데이트
        setAttendees(result.attendees)
      }
    } catch (error) {
      console.error('참석 현황 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (scheduleId && currentUserId) {
      fetchAttendance()
    }
  }, [scheduleId, currentUserId])

  // 투표 제출
  const handleVote = async (status: 'ATTENDING' | 'NOT_ATTENDING') => {
    if (isSubmitting || isPastSchedule) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          userId: currentUserId,
          status
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 투표 상태 업데이트
        setMyStatus(status.toLowerCase() as 'attending' | 'not_attending')
        // 현황 다시 조회
        await fetchAttendance()
        // 상위 컴포넌트에 알림
        onVoteUpdate?.()
      } else {
        console.error('투표 실패:', result.error)
        alert(result.error || '투표 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('투표 처리 오류:', error)
      alert('투표 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending': return 'bg-green-100 text-green-700 border-green-300'
      case 'not_attending': return 'bg-red-100 text-red-700 border-red-300'
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending': return <Check className="h-4 w-4" />
      case 'not_attending': return <X className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'attending': return '참석'
      case 'not_attending': return '불참'
      case 'pending': return '미응답'
      default: return '미응답'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 내 투표 상태 표시 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">내 투표:</span>
        <Badge className={getStatusColor(myStatus)} variant="secondary">
          {getStatusIcon(myStatus)}
          <span className="ml-1">{getStatusText(myStatus)}</span>
        </Badge>
      </div>

      {/* 투표 버튼 (지난 일정이 아닐 때만) */}
      {!isPastSchedule && (
        <div className="flex gap-2">
          <Button
            onClick={() => handleVote('ATTENDING')}
            disabled={isSubmitting || myStatus === 'attending'}
            variant={myStatus === 'attending' ? 'default' : 'outline'}
            className={`flex-1 ${
              myStatus === 'attending' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'hover:bg-green-50 hover:text-green-700'
            }`}
            size="sm"
          >
            <Check className="h-4 w-4 mr-1" />
            참석
          </Button>
          <Button
            onClick={() => handleVote('NOT_ATTENDING')}
            disabled={isSubmitting || myStatus === 'not_attending'}
            variant={myStatus === 'not_attending' ? 'default' : 'outline'}
            className={`flex-1 ${
              myStatus === 'not_attending' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'hover:bg-red-50 hover:text-red-700'
            }`}
            size="sm"
          >
            <X className="h-4 w-4 mr-1" />
            불참
          </Button>
        </div>
      )}

      {/* 투표 통계 (클릭 가능) - 투표 후에만 표시 */}
      {myStatus !== 'pending' && (
        <div className="flex gap-2">
          <Dialog open={detailDialogType === 'attending'} onOpenChange={(open) => setDetailDialogType(open ? 'attending' : null)}>
            <DialogTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  stats.attending > 0
                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
                disabled={isPastSchedule}
              >
                <span className="text-sm font-medium">참석 {stats.attending}</span>
              </button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>참석 인원</DialogTitle>
              <DialogDescription>
                참석으로 투표한 멤버 목록입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {attendees.filter(a => a.status === 'attending').length === 0 ? (
                <p className="text-center text-gray-500 py-4">참석 인원이 없습니다.</p>
              ) : (
                attendees
                  .filter(a => a.status === 'attending')
                  .map((attendee) => (
                    <div key={attendee.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={attendee.profileImage || undefined} />
                        <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attendee.name}</p>
                        {attendee.position && (
                          <p className="text-xs text-gray-500">{attendee.position}</p>
                        )}
                      </div>
                      {attendee.isGuest && (
                        <Badge variant="outline" className="text-xs">게스트</Badge>
                      )}
                    </div>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>

          <Dialog open={detailDialogType === 'not_attending'} onOpenChange={(open) => setDetailDialogType(open ? 'not_attending' : null)}>
            <DialogTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  stats.notAttending > 0
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
                disabled={isPastSchedule}
              >
                <span className="text-sm font-medium">불참 {stats.notAttending}</span>
              </button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>불참 인원</DialogTitle>
              <DialogDescription>
                불참으로 투표한 멤버 목록입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {attendees.filter(a => a.status === 'not_attending').length === 0 ? (
                <p className="text-center text-gray-500 py-4">불참 인원이 없습니다.</p>
              ) : (
                attendees
                  .filter(a => a.status === 'not_attending')
                  .map((attendee) => (
                    <div key={attendee.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={attendee.profileImage || undefined} />
                        <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attendee.name}</p>
                        {attendee.position && (
                          <p className="text-xs text-gray-500">{attendee.position}</p>
                        )}
                      </div>
                      {attendee.isGuest && (
                        <Badge variant="outline" className="text-xs">게스트</Badge>
                      )}
                    </div>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>

          <Dialog open={detailDialogType === 'pending'} onOpenChange={(open) => setDetailDialogType(open ? 'pending' : null)}>
            <DialogTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  stats.pending > 0
                    ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
                disabled={isPastSchedule}
              >
                <span className="text-sm font-medium">미응답 {stats.pending}</span>
              </button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>미응답 인원</DialogTitle>
              <DialogDescription>
                아직 투표하지 않은 멤버 목록입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {attendees.filter(a => a.status === 'pending').length === 0 ? (
                <p className="text-center text-gray-500 py-4">미응답 인원이 없습니다.</p>
              ) : (
                attendees
                  .filter(a => a.status === 'pending')
                  .map((attendee) => (
                    <div key={attendee.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={attendee.profileImage || undefined} />
                        <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attendee.name}</p>
                        {attendee.position && (
                          <p className="text-xs text-gray-500">{attendee.position}</p>
                        )}
                      </div>
                      {attendee.isGuest && (
                        <Badge variant="outline" className="text-xs">게스트</Badge>
                      )}
                    </div>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      )}
    </div>
  )
}

