"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Check, X, Clock, RefreshCw, AlertCircle, UserPlus } from "lucide-react"
import { getLevelShortLabel, LEVEL_OPTIONS } from "@/lib/level-system"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

interface AttendanceVotingProps {
  schedule: any
  currentUser: any
  isManagerMode: boolean
  onAttendanceUpdate?: () => void
  allowGuests?: boolean
}

export function AttendanceVoting({ schedule, currentUser, isManagerMode, onAttendanceUpdate, allowGuests = false }: AttendanceVotingProps) {
  const [attendees, setAttendees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [guestLevel, setGuestLevel] = useState<number>(7) // 기본값 아마추어3
  const [guestPosition, setGuestPosition] = useState<string>("MC") // 기본값 미드필더
  const [guests, setGuests] = useState<any[]>([])

  useEffect(() => {
    fetchAttendees()
  }, [schedule.id])

  // 게스트 목록 가져오기
  const fetchGuests = async () => {
    try {
      const response = await fetch(`/api/schedule/guest?scheduleId=${schedule.id}`)
      const result = await response.json()

      if (response.ok) {
        setGuests(result.guests || [])
      }
    } catch (error) {
      console.error('게스트 목록 조회 오류:', error)
    }
  }

  useEffect(() => {
    if (allowGuests) {
      fetchGuests()
    }
  }, [schedule.id, allowGuests])

  const fetchAttendees = async () => {
    try {
      setIsLoading(true)
      console.log('참석자 목록 조회:', schedule.id)

      const response = await fetch(`/api/schedule/attendance?scheduleId=${schedule.id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '참석자 목록을 가져올 수 없습니다.')
      }

      console.log('참석자 목록 로드 성공:', result.stats)
      setAttendees(result.attendees)
      setError("")

    } catch (error) {
      console.error('참석자 목록 조회 오류:', error)
      setError(error instanceof Error ? error.message : '참석자 목록 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 현재 사용자의 참석 상태 가져오기
  const getCurrentUserStatus = () => {
    if (!currentUser?.id) return 'PENDING'
    const userAttendance = attendees.find(att => att.userId === currentUser.id)
    return userAttendance?.status || 'PENDING'
  }

  const handleAttendanceVote = async (status: string) => {
    if (!currentUser?.id) {
      setError('로그인이 필요합니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const voteData = {
        scheduleId: schedule.id,
        userId: currentUser.id,
        status: status.toUpperCase()
      }

      console.log('참석 투표 요청:', voteData)

      const response = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '참석 투표 중 오류가 발생했습니다.')
      }

      console.log('참석 투표 성공:', result)
      
      // 참석자 목록 새로고침
      await fetchAttendees()
      
      // API에서 팀편성이 초기화되었음을 알림받았을 때 사용자에게 피드백 제공
      if (result.teamFormationReset) {
        console.log('✅ 팀편성이 자동으로 초기화되었습니다.')
      }
      
      // 상위 컴포넌트에 알림 (일정 목록 새로고침용)
      onAttendanceUpdate?.()

    } catch (error) {
      console.error('참석 투표 오류:', error)
      setError(error instanceof Error ? error.message : '참석 투표 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 게스트 초대 함수
  const handleGuestInvite = async () => {
    if (!guestName.trim()) {
      setError('게스트 이름을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/schedule/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule.id,
          guestName: guestName.trim(),
          guestLevel,
          guestPosition,
          invitedByUserId: currentUser?.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '게스트 초대 중 오류가 발생했습니다.')
      }

      console.log('게스트 초대 성공:', result)
      
      // 참석자 목록 새로고침
      await fetchAttendees()
      
      // 게스트 목록 새로고침
      if (allowGuests) {
        await fetchGuests()
      }
      
      // 게스트 초대 폼 초기화
      setGuestName("")
      setGuestLevel(7)
      setGuestPosition("MC")
      setShowGuestDialog(false)
      
      // 상위 컴포넌트에 알림
      onAttendanceUpdate?.()

    } catch (error) {
      console.error('게스트 초대 오류:', error)
      setError(error instanceof Error ? error.message : '게스트 초대 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 게스트 삭제 함수
  const handleGuestRemove = async (guestId: string) => {
    if (!isManagerMode) {
      setError('게스트 삭제는 총무만 가능합니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/schedule/guest', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule.id,
          guestId: guestId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '게스트 삭제 중 오류가 발생했습니다.')
      }

      console.log('게스트 삭제 성공:', result)
      
      // 참석자 목록 새로고침
      await fetchAttendees()
      
      // 게스트 목록 새로고침
      if (allowGuests) {
        await fetchGuests()
      }
      
      // 상위 컴포넌트에 알림
      onAttendanceUpdate?.()

    } catch (error) {
      console.error('게스트 삭제 오류:', error)
      setError(error instanceof Error ? error.message : '게스트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "attending":
        return "bg-green-100 text-green-800"
      case "not_attending":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attending":
        return <Check className="h-4 w-4" />
      case "not_attending":
        return <X className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "attending":
        return "참석"
      case "not_attending":
        return "불참"
      case "pending":
        return "미정"
      default:
        return "미정"
    }
  }

  const getAttendanceStats = (attendees: any[]) => {
    const attending = attendees.filter((a) => a.status === "attending" || a.status === "attended").length
    const total = attendees.length
    return { attending, total, percentage: Math.round((attending / total) * 100) }
  }

  const currentUserStatus = getCurrentUserStatus()
  const stats = getAttendanceStats(attendees)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-muted-foreground">로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          {error}
        </div>
      )}

      {/* 참석 투표 버튼 (모든 사용자) */}
      <div className="flex gap-1">
        <Button
          onClick={() => handleAttendanceVote('attending')}
          disabled={isSubmitting}
          className={`flex-1 ${
            currentUserStatus === 'ATTENDING' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
          size="sm"
        >
          <Check className="h-3 w-3 mr-1" />
          참석
        </Button>
        <Button
          onClick={() => handleAttendanceVote('not_attending')}
          disabled={isSubmitting}
          className={`flex-1 ${
            currentUserStatus === 'NOT_ATTENDING' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
          size="sm"
        >
          <X className="h-3 w-3 mr-1" />
          불참
        </Button>
        <Button
          onClick={() => handleAttendanceVote('pending')}
          disabled={isSubmitting}
          className={`flex-1 ${
            currentUserStatus === 'PENDING' 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
          size="sm"
        >
          <Clock className="h-3 w-3 mr-1" />
          미정
        </Button>
      </div>

      {/* 참석 현황 (총무 모드 추가 정보) */}
      {isManagerMode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">참석률</span>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <Badge variant="outline" className="text-xs">
                {stats.attending}/{stats.total}명
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 게스트 초대 (게스트 허용 시) */}
      {allowGuests && (
        <div className="space-y-2">
          <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <UserPlus className="h-3 w-3 mr-1" />
                게스트 초대
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>게스트 초대</DialogTitle>
              <DialogDescription>
                게스트를 초대하여 경기에 참여시킬 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">게스트 이름 *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="게스트 이름을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestLevel">레벨</Label>
                <Select value={guestLevel.toString()} onValueChange={(value) => setGuestLevel(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPosition">포지션</Label>
                <Select value={guestPosition} onValueChange={setGuestPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GK">골키퍼 (GK)</SelectItem>
                    <SelectItem value="DC">센터백 (DC)</SelectItem>
                    <SelectItem value="DR">라이트백 (DR)</SelectItem>
                    <SelectItem value="DL">레프트백 (DL)</SelectItem>
                    <SelectItem value="DRL">윙백 (DRL)</SelectItem>
                    <SelectItem value="DRLC">풀백 (DRLC)</SelectItem>
                    <SelectItem value="MC">미드필더 (MC)</SelectItem>
                    <SelectItem value="AMC">공격형 미드필더 (AMC)</SelectItem>
                    <SelectItem value="DM">수비형 미드필더 (DM)</SelectItem>
                    <SelectItem value="ST">스트라이커 (ST)</SelectItem>
                    <SelectItem value="CF">센터포워드 (CF)</SelectItem>
                    <SelectItem value="SS">세컨드 스트라이커 (SS)</SelectItem>
                    <SelectItem value="LWF">레프트 윙어 (LWF)</SelectItem>
                    <SelectItem value="RWF">라이트 윙어 (RWF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGuestDialog(false)}>
                취소
              </Button>
              <Button onClick={handleGuestInvite} disabled={isSubmitting || !guestName.trim()}>
                {isSubmitting ? '초대 중...' : '초대하기'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 게스트 목록 (총무만 삭제 가능) */}
        {guests.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">초대된 게스트</div>
            {guests.map((guest) => (
              <div key={guest.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getLevelShortLabel(guest.level)}
                  </Badge>
                  <span className="font-medium">{guest.name}</span>
                  <span className="text-muted-foreground">({guest.position})</span>
                </div>
                {isManagerMode && (
                  <Button
                    onClick={() => handleGuestRemove(guest.id)}
                    disabled={isSubmitting}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  )
}