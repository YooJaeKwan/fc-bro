'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, UserPlus } from 'lucide-react'

interface AttendanceVotingProps {
  scheduleId: string
  currentUserId: string
  isPastSchedule: boolean
  allowGuests?: boolean
  hasTeamFormation?: boolean
  onVoteUpdate: () => void
}

export function AttendanceVoting({
  scheduleId,
  currentUserId,
  isPastSchedule,
  allowGuests = false,
  hasTeamFormation = false,
  onVoteUpdate
}: AttendanceVotingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userStatus, setUserStatus] = useState<string | null>(null)

  // 현재 사용자의 투표 상태 가져오기
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`/api/schedule/attendance?scheduleId=${scheduleId}&userId=${currentUserId}`)
        if (response.ok) {
          const data = await response.json()
          const userAttendance = data.attendees?.find((att: any) => att.userId === currentUserId)
          setUserStatus(userAttendance?.status || null)
        }
      } catch (error) {
        console.error('투표 상태 조회 오류:', error)
      }
    }

    if (currentUserId && scheduleId) {
      fetchUserStatus()
    }
  }, [scheduleId, currentUserId])

  // 투표 처리
  const handleVote = async (status: 'attending' | 'not_attending') => {
    if (isSubmitting || isPastSchedule) return

    // 팀편성 결과가 있으면 확인 메시지 표시
    if (hasTeamFormation) {
      const confirmMessage = '팀편성 결과가 있습니다. 투표를 변경하면 팀편성 결과가 초기화됩니다. 투표하시겠습니까?'
      if (!confirm(confirmMessage)) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          userId: currentUserId,
          status: status.toUpperCase()
        })
      })

      if (response.ok) {
        setUserStatus(status)
        onVoteUpdate()
      } else {
        const error = await response.json()
        alert(error.error || '투표 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('투표 처리 오류:', error)
      alert('투표 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPastSchedule) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">참석 투표</span>
        {userStatus && (
          <Badge 
            variant="outline" 
            className={
              userStatus === 'attending' || userStatus === 'ATTENDING'
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }
          >
            {userStatus === 'attending' || userStatus === 'ATTENDING' ? '참석' : '불참'}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleVote('attending')}
          disabled={isSubmitting || (userStatus === 'attending' || userStatus === 'ATTENDING')}
          variant={userStatus === 'attending' || userStatus === 'ATTENDING' ? 'default' : 'outline'}
          className="flex-1"
          size="sm"
        >
          <Check className="h-4 w-4 mr-2" />
          참석
        </Button>
        <Button
          onClick={() => handleVote('not_attending')}
          disabled={isSubmitting || (userStatus === 'not_attending' || userStatus === 'NOT_ATTENDING')}
          variant={userStatus === 'not_attending' || userStatus === 'NOT_ATTENDING' ? 'default' : 'outline'}
          className="flex-1"
          size="sm"
        >
          <X className="h-4 w-4 mr-2" />
          불참
        </Button>
      </div>
    </div>
  )
}

