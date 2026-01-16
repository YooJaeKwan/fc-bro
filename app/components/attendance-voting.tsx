'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock, UserPlus, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface AttendanceVotingProps {
  scheduleId: string
  currentUserId: string
  isPastSchedule: boolean
  allowGuests?: boolean
  hasTeamFormation?: boolean
  formationConfirmed?: boolean
  isManagerMode?: boolean
  onVoteUpdate: () => void
  // Performance optimization: pre-fetched data from parent
  initialAttendees?: Attendee[]
  initialStats?: AttendanceStats
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
  subPositions?: string[]
  profileImage?: string | null
  isGuest?: boolean
  invitedBy?: string
}

export function AttendanceVoting({
  scheduleId,
  currentUserId,
  isPastSchedule,
  allowGuests = false,
  hasTeamFormation = false,
  formationConfirmed = false,
  isManagerMode = false,
  onVoteUpdate,
  initialAttendees,
  initialStats
}: AttendanceVotingProps) {
  // Initialize state from props if provided (performance optimization)
  const getInitialMyStatus = (): 'attending' | 'not_attending' | 'pending' => {
    if (initialAttendees) {
      const myAttendance = initialAttendees.find(a => a.userId === currentUserId && !a.isGuest)
      return myAttendance?.status || 'pending'
    }
    return 'pending'
  }

  const [myStatus, setMyStatus] = useState<'attending' | 'not_attending' | 'pending'>(getInitialMyStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState<AttendanceStats>(initialStats || {
    attending: 0,
    notAttending: 0,
    pending: 0,
    total: 0
  })
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees || [])
  // Skip loading if initial data is provided
  const [isLoading, setIsLoading] = useState(!initialAttendees)
  const [detailDialogType, setDetailDialogType] = useState<'attending' | 'not_attending' | 'pending' | null>(null)
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestLevel, setGuestLevel] = useState<string>('')
  const [guestPositions, setGuestPositions] = useState<string[]>([])
  const [isPositionAny, setIsPositionAny] = useState(false)
  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [sameTeamAsInviter, setSameTeamAsInviter] = useState(false) // 기본값: 체크 해제

  // 포지션 카테고리 정의
  const positionCategories = {
    attacker: {
      name: '공격수',
      positions: [
        { value: 'CF', label: 'CF (센터 포워드)' },
        { value: 'LWF', label: 'LWF (좌측 윙 포워드)' },
        { value: 'RWF', label: 'RWF (우측 윙 포워드)' }
      ]
    },
    midfielder: {
      name: '미드필더',
      positions: [
        { value: 'CAM', label: 'CAM (공격형 미드필더)' },
        { value: 'CM', label: 'CM (중앙 미드필더)' },
        { value: 'CDM', label: 'CDM (수비형 미드필더)' }
      ]
    },
    defender: {
      name: '수비수',
      positions: [
        { value: 'CB', label: 'CB (센터백)' },
        { value: 'LB', label: 'LB (좌측 풀백)' },
        { value: 'RB', label: 'RB (우측 풀백)' }
      ]
    },
    goalkeeper: {
      name: '골키퍼',
      positions: [
        { value: 'GK', label: 'GK (골키퍼)' }
      ]
    }
  }

  // 포지션 선택 핸들러
  const handlePositionToggle = (position: string) => {
    if (isPositionAny) return // 포지션 무관이 선택되어 있으면 무시

    if (guestPositions.includes(position)) {
      // 이미 선택된 포지션이면 제거
      setGuestPositions(guestPositions.filter(p => p !== position))
    } else {
      // 최대 3개까지만 선택 가능
      if (guestPositions.length < 3) {
        setGuestPositions([...guestPositions, position])
      } else {
        alert('포지션은 최대 3개까지 선택할 수 있습니다.')
      }
    }
  }

  // 포지션 무관 토글
  const handlePositionAnyToggle = (checked: boolean) => {
    setIsPositionAny(checked)
    if (checked) {
      setGuestPositions([]) // 포지션 무관 선택 시 다른 포지션 모두 해제
    }
  }

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
    // Skip initial fetch if data was provided via props
    if (scheduleId && currentUserId && !initialAttendees) {
      fetchAttendance()
    }
  }, [scheduleId, currentUserId])

  // 투표 제출
  const handleVote = async (status: 'ATTENDING' | 'NOT_ATTENDING') => {
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
        onVoteUpdate()
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

  // 참석 투표 삭제 (총무만 가능)
  const handleDeleteAttendance = async (attendee: Attendee) => {
    if (!isManagerMode) return

    const confirmMessage = attendee.isGuest
      ? `게스트 "${attendee.name}"의 참석 투표를 삭제하시겠습니까?`
      : `"${attendee.name}"님의 참석 투표를 삭제하시겠습니까?`

    if (!confirm(confirmMessage)) return

    // 팀편성 결과가 있으면 확인 메시지 표시
    if (hasTeamFormation) {
      if (!confirm('팀편성 결과가 있습니다. 투표를 삭제하면 팀편성 결과가 초기화됩니다. 삭제하시겠습니까?')) {
        return
      }
    }

    try {
      const response = await fetch('/api/schedule/attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          targetUserId: attendee.isGuest ? null : attendee.userId,
          guestId: attendee.isGuest ? attendee.userId : null,
          adminUserId: currentUserId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 현황 다시 조회
        await fetchAttendance()
        // 상위 컴포넌트에 알림
        onVoteUpdate()
        // 팀편성 결과가 있었을 때만 초기화 메시지 표시
        if (result.teamFormationReset && hasTeamFormation) {
          alert('참석 투표가 삭제되었습니다. 팀편성 결과가 초기화되었습니다.')
        }
        // 다이얼로그는 유지 (닫지 않음)
      } else {
        console.error('투표 삭제 실패:', result.error)
        alert(result.error || '투표 삭제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('투표 삭제 오류:', error)
      alert('투표 삭제 중 오류가 발생했습니다.')
    }
  }

  // 게스트 참석 추가
  const handleAddGuest = async () => {
    if (!guestName.trim() || !guestLevel) {
      alert('게스트 이름과 레벨을 입력해주세요.')
      return
    }

    if (!isPositionAny && guestPositions.length === 0) {
      alert('포지션을 선택하거나 포지션 무관을 선택해주세요.')
      return
    }

    // 팀편성 결과가 있으면 확인 메시지 표시
    if (hasTeamFormation) {
      const confirmMessage = '팀편성 결과가 있습니다. 게스트를 초대하면 팀편성 결과가 초기화됩니다. 초대하시겠습니까?'
      if (!confirm(confirmMessage)) {
        return
      }
    }

    setIsAddingGuest(true)
    try {
      // 레벨 매핑: 미숙=3, 보통=4, 잘함=5
      const levelMap: { [key: string]: number } = {
        '미숙': 3,
        '보통': 4,
        '잘함': 5
      }

      // 포지션 처리: 포지션 무관이면 'ANY', 아니면 선택된 포지션들을 콤마로 구분
      const guestPosition = isPositionAny
        ? 'ANY'
        : guestPositions.join(',')

      const response = await fetch('/api/schedule/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          guestName: guestName.trim(),
          guestLevel: levelMap[guestLevel],
          guestPosition: guestPosition,
          invitedByUserId: currentUserId,
          sameTeamAsInviter: sameTeamAsInviter
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 게스트 추가 성공
        setGuestName('')
        setGuestLevel('')
        setGuestPositions([])
        setIsPositionAny(false)
        setSameTeamAsInviter(false) // 기본값으로 리셋
        setIsGuestDialogOpen(false)
        // 현황 다시 조회
        await fetchAttendance()
        // 상위 컴포넌트에 알림
        onVoteUpdate()
        // 팀편성 결과가 있었을 때만 초기화 메시지 표시
        if (result.teamFormationReset && hasTeamFormation) {
          alert('게스트가 초대되었습니다. 팀편성 결과가 초기화되었습니다.')
        }
      } else {
        console.error('게스트 추가 실패:', result.error)
        alert(result.error || '게스트 추가 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('게스트 추가 오류:', error)
      alert('게스트 추가 중 오류가 발생했습니다.')
    } finally {
      setIsAddingGuest(false)
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

  if (isPastSchedule) {
    return null
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
      <div className="space-y-2">
        {/* 팀편성 확정 시 안내 메시지 */}
        {formationConfirmed && (
          <div className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
            팀편성이 확정되어 투표가 마감되었습니다
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => handleVote('ATTENDING')}
            disabled={isSubmitting || myStatus === 'attending' || formationConfirmed}
            variant={myStatus === 'attending' ? 'default' : 'outline'}
            className={`flex-1 ${myStatus === 'attending'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'hover:bg-green-50 hover:text-green-700'
              } ${formationConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
            size="sm"
          >
            <Check className="h-4 w-4 mr-1" />
            참석
          </Button>
          <Button
            onClick={() => handleVote('NOT_ATTENDING')}
            disabled={isSubmitting || myStatus === 'not_attending' || formationConfirmed}
            variant={myStatus === 'not_attending' ? 'default' : 'outline'}
            className={`flex-1 ${myStatus === 'not_attending'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'hover:bg-red-50 hover:text-red-700'
              } ${formationConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
            size="sm"
          >
            <X className="h-4 w-4 mr-1" />
            불참
          </Button>
        </div>

        {/* 게스트 초대 버튼 (게스트 허용된 일정일 때만) */}
        {allowGuests && (
          <Dialog
            open={isGuestDialogOpen}
            onOpenChange={(open) => {
              setIsGuestDialogOpen(open)
              // 다이얼로그가 닫힐 때 폼 필드 초기화
              if (!open) {
                setGuestName('')
                setGuestLevel('')
                setGuestPositions([])
                setIsPositionAny(false)
                setSameTeamAsInviter(false) // 기본값으로 리셋
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`w-full ${formationConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isPastSchedule || formationConfirmed}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                게스트 초대
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>게스트 초대 등록</DialogTitle>
                <DialogDescription>
                  게스트의 이름과 레벨을 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">게스트 이름</Label>
                  <Input
                    id="guestName"
                    placeholder="게스트 이름을 입력하세요"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    disabled={isAddingGuest}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestLevel">게스트 레벨</Label>
                  <Select
                    value={guestLevel}
                    onValueChange={setGuestLevel}
                    disabled={isAddingGuest}
                  >
                    <SelectTrigger id="guestLevel">
                      <SelectValue placeholder="레벨을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="미숙">미숙</SelectItem>
                      <SelectItem value="보통">보통</SelectItem>
                      <SelectItem value="잘함">잘함</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>게스트 포지션 (최대 3개)</Label>
                  <div className="space-y-3">
                    {/* 포지션 무관 체크박스 */}
                    <div className="flex items-center space-x-2 p-2 rounded border">
                      <Checkbox
                        id="position-any"
                        checked={isPositionAny}
                        onCheckedChange={handlePositionAnyToggle}
                        disabled={isAddingGuest}
                      />
                      <label
                        htmlFor="position-any"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        포지션 무관
                      </label>
                    </div>

                    {/* 포지션 카테고리별 선택 */}
                    {!isPositionAny && (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                        {Object.entries(positionCategories).map(([key, category]) => (
                          <div key={key} className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">
                              {category.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {category.positions.map((pos) => (
                                <div
                                  key={pos.value}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`position-${pos.value}`}
                                    checked={guestPositions.includes(pos.value)}
                                    onCheckedChange={() => handlePositionToggle(pos.value)}
                                    disabled={isAddingGuest || (guestPositions.length >= 3 && !guestPositions.includes(pos.value))}
                                  />
                                  <label
                                    htmlFor={`position-${pos.value}`}
                                    className={`text-sm leading-none cursor-pointer ${guestPositions.length >= 3 && !guestPositions.includes(pos.value)
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                      }`}
                                  >
                                    {pos.value}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {guestPositions.length > 0 && (
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            선택된 포지션: {guestPositions.join(', ')} ({guestPositions.length}/3)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <Checkbox
                      id="same-team-inviter"
                      checked={sameTeamAsInviter}
                      onCheckedChange={(checked) => setSameTeamAsInviter(checked === true)}
                      disabled={isAddingGuest}
                    />
                    <label
                      htmlFor="same-team-inviter"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      초대자와 같은 팀 희망
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddGuest}
                    disabled={isAddingGuest || !guestName.trim() || !guestLevel || (!isPositionAny && guestPositions.length === 0)}
                    className="flex-1"
                  >
                    {isAddingGuest ? '등록 중...' : '등록'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsGuestDialogOpen(false)
                      setGuestName('')
                      setGuestLevel('')
                      setGuestPositions([])
                      setIsPositionAny(false)
                      setSameTeamAsInviter(false) // 기본값으로 리셋
                    }}
                    variant="outline"
                    disabled={isAddingGuest}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 투표 통계 (클릭 가능) - 투표 후에만 표시 */}
      {myStatus !== 'pending' && (
        <div className="flex gap-2">
          <Dialog open={detailDialogType === 'attending'} onOpenChange={(open) => setDetailDialogType(open ? 'attending' : null)}>
            <DialogTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${stats.attending > 0
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
                    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                    .map((attendee) => (
                      <div key={attendee.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.profileImage || undefined} />
                          <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {attendee.name}
                            {attendee.isGuest && attendee.invitedBy && (
                              <span className="text-gray-500 font-normal"> ({attendee.invitedBy} 지인)</span>
                            )}
                          </p>
                          {attendee.position && (
                            <p className="text-xs text-gray-500">
                              {attendee.position}
                              {attendee.subPositions && attendee.subPositions.length > 0 && (
                                <span className="text-gray-400"> (+{attendee.subPositions.join(', ')})</span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {attendee.isGuest && (
                            <Badge variant="outline" className="text-xs">게스트</Badge>
                          )}
                          {isManagerMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAttendance(attendee)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={detailDialogType === 'not_attending'} onOpenChange={(open) => setDetailDialogType(open ? 'not_attending' : null)}>
            <DialogTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${stats.notAttending > 0
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
                    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                    .map((attendee) => (
                      <div key={attendee.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.profileImage || undefined} />
                          <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {attendee.name}
                            {attendee.isGuest && attendee.invitedBy && (
                              <span className="text-gray-500 font-normal"> ({attendee.invitedBy} 지인)</span>
                            )}
                          </p>
                          {attendee.position && (
                            <p className="text-xs text-gray-500">
                              {attendee.position}
                              {attendee.subPositions && attendee.subPositions.length > 0 && (
                                <span className="text-gray-400"> (+{attendee.subPositions.join(', ')})</span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {attendee.isGuest && (
                            <Badge variant="outline" className="text-xs">게스트</Badge>
                          )}
                          {isManagerMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAttendance(attendee)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={detailDialogType === 'pending'} onOpenChange={(open) => setDetailDialogType(open ? 'pending' : null)}>
            <DialogTrigger asChild>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${stats.pending > 0
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
                    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                    .map((attendee) => (
                      <div key={attendee.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.profileImage || undefined} />
                          <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {attendee.name}
                            {attendee.isGuest && attendee.invitedBy && (
                              <span className="text-gray-500 font-normal"> ({attendee.invitedBy} 지인)</span>
                            )}
                          </p>
                          {attendee.position && (
                            <p className="text-xs text-gray-500">
                              {attendee.position}
                              {attendee.subPositions && attendee.subPositions.length > 0 && (
                                <span className="text-gray-400"> (+{attendee.subPositions.join(', ')})</span>
                              )}
                            </p>
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

