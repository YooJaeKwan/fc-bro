"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Check, X, Clock, RefreshCw, AlertCircle, UserPlus, ChevronDown, ChevronRight } from "lucide-react"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface AttendanceVotingProps {
  schedule: any
  currentUser: any
  isManagerMode: boolean
  onAttendanceUpdate?: () => void
  onAttendanceStatsUpdate?: (scheduleId: string) => void
  onFormationReset?: () => void
  onGuestStatusUpdate?: (scheduleId: string) => void
  allowGuests?: boolean
  hasTeamFormation?: boolean
}

export function AttendanceVoting({ schedule, currentUser, isManagerMode, onAttendanceUpdate, onAttendanceStatsUpdate, onFormationReset, onGuestStatusUpdate, allowGuests = false, hasTeamFormation = false }: AttendanceVotingProps) {
  const [attendees, setAttendees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [guestLevel, setGuestLevel] = useState<number>(7) // 기본값 아마추어3
  const [guestPosition, setGuestPosition] = useState<string>("MC") // 기본값 미드필더
  const [guests, setGuests] = useState<any[]>([])
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [showFormationResetNotification, setShowFormationResetNotification] = useState(false)

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

  // 팀편성 초기화 알림 표시
  const showFormationResetAlert = () => {
    setShowFormationResetNotification(true)
    setTimeout(() => {
      setShowFormationResetNotification(false)
    }, 5000) // 5초 후 자동 숨김
  }

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
      
      // 개별 일정의 참석 현황 업데이트 (전체 페이지 리로딩 방지)
      onAttendanceStatsUpdate?.(schedule.id)
      
      // API에서 팀편성이 초기화되었음을 알림받았을 때만 상위 컴포넌트에 알림
      if (result.teamFormationReset) {
        console.log('✅ 팀편성이 자동으로 초기화되었습니다.')
        // 팀편성 결과가 있을 때만 초기화 메시지 표시
        if (hasTeamFormation) {
          showFormationResetAlert()
          // 팀편성 결과를 즉시 화면에서 제거
          onFormationReset?.()
        }
        // 팀편성 초기화 시에만 상위 컴포넌트에 알림 (전체 페이지 리로딩 방지)
        onAttendanceUpdate?.()
      }

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
      
      // 개별 일정의 참석 현황 업데이트 (전체 페이지 리로딩 방지)
      onAttendanceStatsUpdate?.(schedule.id)
      
      // 게스트 상태 업데이트 (게스트 초대 버튼 활성화/비활성화)
      onGuestStatusUpdate?.(schedule.id)
      
      // 게스트 초대 폼 초기화
      setGuestName("")
      setGuestLevel(7)
      setGuestPosition("MC")
      setShowGuestDialog(false)
      
      // 팀편성 초기화 시에만 상위 컴포넌트에 알림 (전체 페이지 리로딩 방지)
      if (result.teamFormationReset) {
        // 팀편성 결과가 있을 때만 초기화 메시지 표시
        if (hasTeamFormation) {
          showFormationResetAlert()
          // 팀편성 결과를 즉시 화면에서 제거
          onFormationReset?.()
        }
        onAttendanceUpdate?.()
      }

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
      
      // 개별 일정의 참석 현황 업데이트 (전체 페이지 리로딩 방지)
      onAttendanceStatsUpdate?.(schedule.id)
      
      // 게스트 상태 업데이트 (게스트 초대 버튼 활성화/비활성화)
      onGuestStatusUpdate?.(schedule.id)
      
      // 팀편성 초기화 시에만 상위 컴포넌트에 알림 (전체 페이지 리로딩 방지)
      if (result.teamFormationReset) {
        // 팀편성 결과가 있을 때만 초기화 메시지 표시
        if (hasTeamFormation) {
          showFormationResetAlert()
          // 팀편성 결과를 즉시 화면에서 제거
          onFormationReset?.()
        }
        onAttendanceUpdate?.()
      }

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

  // 참석자들을 상태별로 분류하는 함수
  const getAttendeesByStatus = (attendees: any[]) => {
    const attending = attendees.filter((a) => a.status === "attending" || a.status === "attended")
    const notAttending = attendees.filter((a) => a.status === "not_attending")
    const pending = attendees.filter((a) => a.status === "pending")
    return { attending, notAttending, pending }
  }

  const currentUserStatus = getCurrentUserStatus()
  const stats = getAttendanceStats(attendees)
  
  // 디버깅을 위한 콘솔 출력
  console.log('현재 사용자 상태:', currentUserStatus, '참석자 목록:', attendees)

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

      {/* 팀편성 초기화 알림 */}
      {showFormationResetNotification && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>참석 현황이 변경되어 팀편성이 초기화되었습니다.</span>
        </div>
      )}

      {/* 참석 투표 버튼 (현재 상태에 따라 반대 버튼만 표시) */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* 참석 상태일 때는 불참 버튼만 표시 */}
          {(currentUserStatus === 'ATTENDING' || currentUserStatus === 'attending') && (
            <Button
              onClick={() => handleAttendanceVote('not_attending')}
              disabled={isSubmitting}
              className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 border border-red-300"
              size="sm"
            >
              <X className="h-3 w-3 mr-1" />
              불참으로 변경
            </Button>
          )}
          
          {/* 불참 상태일 때는 참석 버튼만 표시 */}
          {(currentUserStatus === 'NOT_ATTENDING' || currentUserStatus === 'not_attending') && (
            <Button
              onClick={() => handleAttendanceVote('attending')}
              disabled={isSubmitting}
              className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
              size="sm"
            >
              <Check className="h-3 w-3 mr-1" />
              참석으로 변경
            </Button>
          )}
          
          {/* 미정 상태일 때는 두 버튼 모두 표시 */}
          {(currentUserStatus === 'PENDING' || currentUserStatus === 'pending') && (
            <>
              <Button
                onClick={() => handleAttendanceVote('attending')}
                disabled={isSubmitting}
                className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
                size="sm"
              >
                <Check className="h-3 w-3 mr-1" />
                참석
              </Button>
              <Button
                onClick={() => handleAttendanceVote('not_attending')}
                disabled={isSubmitting}
                className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 border border-red-300"
                size="sm"
              >
                <X className="h-3 w-3 mr-1" />
                불참
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 참석 현황 (펼쳐서 볼 수 있음) */}
      <Collapsible open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>참석 현황</span>
              <Badge variant="outline" className="text-xs">
                {stats.attending}/{stats.total}명
              </Badge>
            </div>
            {isAttendanceOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded border">
            {/* 참석자 목록을 상태별로 구분하여 표시 */}
            {(() => {
              const { attending, notAttending, pending } = getAttendeesByStatus(attendees)
              
              return (
                <div className="space-y-3">
                  {/* 참석자 목록 */}
                  {attending.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" />
                        <span>참석 ({attending.length}명)</span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {attending.map((attendee) => (
                          <div key={attendee.userId} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {attendee.name}
                              </span>
                              <span className="text-muted-foreground">
                                ({attendee.position})
                              </span>
                              {attendee.isGuest && (
                                <Badge variant="secondary" className="text-xs">
                                  게스트
                                </Badge>
                              )}
                              {attendee.isGuest && attendee.level && (
                                <Badge variant="outline" className="text-xs">
                                  {getLevelShortLabel(attendee.level)}
                                </Badge>
                              )}
                            </div>
                            {attendee.isGuest && isManagerMode && (
                              <Button
                                onClick={() => handleGuestRemove(attendee.userId)}
                                disabled={isSubmitting}
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 불참자 목록 */}
                  {notAttending.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-red-700">
                        <X className="h-3 w-3" />
                        <span>불참 ({notAttending.length}명)</span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {notAttending.map((attendee) => (
                          <div key={attendee.userId} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {attendee.name}
                              </span>
                              <span className="text-muted-foreground">
                                ({attendee.position})
                              </span>
                              {attendee.isGuest && (
                                <Badge variant="secondary" className="text-xs">
                                  게스트
                                </Badge>
                              )}
                              {attendee.isGuest && attendee.level && (
                                <Badge variant="outline" className="text-xs">
                                  {getLevelShortLabel(attendee.level)}
                                </Badge>
                              )}
                            </div>
                            {attendee.isGuest && isManagerMode && (
                              <Button
                                onClick={() => handleGuestRemove(attendee.userId)}
                                disabled={isSubmitting}
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 미정자 목록 */}
                  {pending.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-yellow-700">
                        <Clock className="h-3 w-3" />
                        <span>미정 ({pending.length}명)</span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {pending.map((attendee) => (
                          <div key={attendee.userId} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {attendee.name}
                              </span>
                              <span className="text-muted-foreground">
                                ({attendee.position})
                              </span>
                              {attendee.isGuest && (
                                <Badge variant="secondary" className="text-xs">
                                  게스트
                                </Badge>
                              )}
                              {attendee.isGuest && attendee.level && (
                                <Badge variant="outline" className="text-xs">
                                  {getLevelShortLabel(attendee.level)}
                                </Badge>
                              )}
                            </div>
                            {attendee.isGuest && isManagerMode && (
                              <Button
                                onClick={() => handleGuestRemove(attendee.userId)}
                                disabled={isSubmitting}
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
            
            {/* 참석률 통계 */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">참석률</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{stats.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 게스트 초대 (게스트 허용 시) */}
      {allowGuests && (
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
      )}

    </div>
  )
}