'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, X, Check, UserPlus, UserMinus, Edit, Trash2, Trophy, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import { calculateDaysLeft, generateKakaoShareText, getPositionOrder, sortByPosition } from '@/lib/utils'
import { AttendanceVoting } from './attendance-voting'
import { ScheduleComments } from './schedule-comments'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  const [isRosterExpanded, setIsRosterExpanded] = useState(false)

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

  // 경기 시작 후 2시간이 지났는지 확인 (결과 입력 가능 시점)
  const isMatchTimePassed = (() => {
    const [year, month, day] = schedule.date.split('-')
    const [hours, minutes] = schedule.time.split(':')
    const scheduleDateTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
    // 경기 시작 후 2시간 후
    scheduleDateTime.setHours(scheduleDateTime.getHours() + 2)
    return scheduleDateTime < new Date()
  })()

  const hasResult = schedule.ourScore !== null && schedule.ourScore !== undefined && schedule.opponentScore !== null && schedule.opponentScore !== undefined

  // 포지션별 색상 반환 함수
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

  // 포지션별 색상 반환 함수
  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    // 골키퍼
    if (pos === 'GK') return 'border-purple-400/50 text-purple-300 bg-purple-400/10'
    // 수비수 (CB, LB, RB, LRB, LRCB 등) - 파란색
    if (pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'LRB' || pos === 'LRCB' || pos === 'SW') {
      return 'border-blue-400/50 text-blue-300 bg-blue-400/10'
    }
    // 미드필더 (CM, CDM, CAM 등) - 초록색
    if (pos === 'CM' || pos === 'CDM' || pos === 'CAM' || pos === 'DM' || pos === 'AM' || pos === 'LM' || pos === 'RM') {
      return 'border-green-400/50 text-green-300 bg-green-400/10'
    }
    // 공격수 (ST, CF, LWF, RWF, SS, LW, RW 등)
    if (pos === 'ST' || pos === 'CF' || pos === 'LWF' || pos === 'RWF' || pos === 'SS' || pos === 'LW' || pos === 'RW' || pos === 'FW') {
      return 'border-red-400/50 text-red-300 bg-red-400/10'
    }
    return 'border-slate-400/50 text-slate-300 bg-slate-400/10' // Default
  }

  // 공유하기 핸들러
  const handleCopyForSharing = async () => {
    const text = generateKakaoShareText(schedule, isManagerMode)
    try {
      await navigator.clipboard.writeText(text)
      alert("경기 정보가 클립보드에 복사되었습니다.\n카카오톡 채팅창에 붙여넣기(Ctrl+V) 하세요.")
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
      // 보안상 이유로 실패할 경우 fallback (모바일 등)
      prompt("아래 텍스트를 복사하세요:", text)
    }
  }

  return (
    <>
      {isUpdating ? (
        <Card className="transition-shadow bg-gray-50 border-gray-200">
          <ScheduleSkeleton />
        </Card>
      ) : isMatchTimePassed && hasResult ? (
        /* 경기 시간이 지나고 결과 입력됨: 흰색 Card 없이 바로 검정 스코어보드 */
        <div className="space-y-4">
          {/* 통합 스코어보드 */}
          <div className="w-full bg-slate-900 rounded-xl p-5 text-white shadow-lg overflow-hidden relative">
            {/* 장식 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* 날짜, 타입, 장소 */}
            <div className="mb-4 pb-3 border-b border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-300">
                  {(() => {
                    const [year, month, day] = schedule.date.split('-')
                    const date = new Date(Number(year), Number(month) - 1, Number(day))
                    return date.toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })
                  })()} <span className="text-slate-400">{schedule.time}</span>
                </div>
                <div className="flex gap-2">
                  <Badge className={getTypeColor(schedule.type)} variant="secondary">
                    {schedule.type === "internal" ? "자체경기" :
                      schedule.type === "match" ? "A매치" :
                        schedule.type === "training" ? "연습" : schedule.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                    종료
                  </Badge>
                </div>
              </div>
              {schedule.location && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{schedule.location}</span>
                </div>
              )}
            </div>

            {/* 스코어 */}
            <div className="flex items-center justify-between relative z-10 mb-4">
              <div className="flex-1 flex flex-col items-center">
                <span className={`text-5xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-yellow-400' : 'text-sky-400'
                  }`}>
                  {schedule.ourScore}
                </span>
                <span className={`text-xs font-bold mt-2 px-3 py-1 rounded-full ${schedule.type === 'internal'
                  ? 'bg-yellow-400/20 text-yellow-200'
                  : 'bg-sky-400/20 text-sky-200'
                  }`}>
                  {schedule.type === 'internal' ? 'YELLOW' : 'HOME'}
                </span>
              </div>

              <div className="flex flex-col items-center px-6">
                <span className="text-slate-500 text-sm font-bold mb-2">VS</span>
                <div className="h-12 w-px bg-slate-700/50"></div>

                {schedule.teamFormation && (isManagerMode || schedule.formationConfirmed || isPastSchedule) && schedule.type === 'internal' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRosterExpanded(!isRosterExpanded)}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  >
                    {isRosterExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    명단
                  </Button>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center">
                <span className={`text-5xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-blue-400' : 'text-rose-400'
                  }`}>
                  {schedule.opponentScore}
                </span>
                <span className={`text-xs font-bold mt-2 px-3 py-1 rounded-full ${schedule.type === 'internal'
                  ? 'bg-blue-400/20 text-blue-200'
                  : 'bg-rose-400/20 text-rose-200'
                  }`}>
                  {schedule.type === 'internal' ? 'BLUE' : 'AWAY'}
                </span>
              </div>
            </div>

            {/* 팀 명단 */}
            {schedule.teamFormation && (isManagerMode || schedule.formationConfirmed || isPastSchedule) && isRosterExpanded && (
              <div className="mb-4 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-semibold text-yellow-400 mb-2 text-center">Yellow Team</div>
                    {sortByPosition(schedule.teamFormation.yellowTeam || []).map((player: any, idx: number) => (
                      <div key={idx} className="text-slate-300 flex items-center gap-2 py-1">
                        <Badge variant="outline" className={`text-[10px] ${getPositionColor(player.position || player.displayPosition || 'MC')}`}>
                          {player.position || player.displayPosition || 'MC'}
                        </Badge>
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-blue-400 mb-2 text-center">Blue Team</div>
                    {sortByPosition(schedule.teamFormation.blueTeam || []).map((player: any, idx: number) => (
                      <div key={idx} className="text-slate-300 flex items-center gap-2 py-1">
                        <Badge variant="outline" className={`text-[10px] ${getPositionColor(player.position || player.displayPosition || 'MC')}`}>
                          {player.position || player.displayPosition || 'MC'}
                        </Badge>
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MVP (잠시 숨김) */}
            {/* {schedule.mvpUserId && (
              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-slate-300 font-medium">MOM: </span>
                <span className="text-sm text-yellow-500 font-bold">
                  {schedule.attendances?.find((a: any) =>
                    (a.user?.id === schedule.mvpUserId) || (a.userId === schedule.mvpUserId)
                  )?.user?.realName ||
                    schedule.attendances?.find((a: any) =>
                      (a.user?.id === schedule.mvpUserId) || (a.userId === schedule.mvpUserId)
                    )?.user?.nickname ||
                    schedule.attendances?.find((a: any) =>
                      a.guestId === schedule.mvpUserId
                    )?.guestName ||
                    '알 수 없음'}
                </span>
              </div>
            )} */}

            {/* 총평 */}
            {schedule.matchSummary && (
              <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
                <p className="text-sm text-slate-300 italic">
                  "{schedule.matchSummary}"
                </p>
              </div>
            )}
          </div>

          {/* 관리 버튼들 (스코어보드 외부) */}
          {isManagerMode && (
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={handleCopyForSharing}
                variant="outline"
                size="sm"
                className="text-xs"
                title="카카오톡 공유 텍스트 복사"
              >
                <Share2 className="h-3 w-3 mr-1" />
                공유
              </Button>
              {schedule.type !== 'training' && onEnterResult && (
                <Button
                  onClick={() => onEnterResult(schedule)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  결과 수정
                </Button>
              )}
              <Button
                onClick={() => onDeleteSchedule(schedule.id)}
                variant="outline"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* 예정된 경기 또는 결과 없는 지난 경기: Card로 감싸기 */
        <Card className={`transition-shadow ${isPastSchedule
          ? 'bg-gray-50 border-gray-200'
          : 'hover:shadow-lg'
          }`}>
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

              {/* 스코어보드 또는 D-Day */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-center">
                  {hasResult ? (
                    <div className="w-full max-w-md bg-slate-900 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                      {/* 장식용 배경 효과 */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                      {/* 장소 정보 (스코어보드 상단) */}
                      {schedule.location && (
                        <div className="flex items-center justify-center gap-1 mb-3 text-slate-400 text-xs">
                          <MapPinIcon className="h-3 w-3" />
                          <span>{schedule.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between relative z-10">
                        {/* 홈/Yellow 팀 */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className={`text-4xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-yellow-400' : 'text-sky-400'
                            }`}>
                            {schedule.ourScore}
                          </span>
                          <span className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full ${schedule.type === 'internal'
                            ? 'bg-yellow-400/20 text-yellow-200'
                            : 'bg-sky-400/20 text-sky-200'
                            }`}>
                            {schedule.type === 'internal' ? 'YELLOW' : 'HOME'}
                          </span>
                        </div>

                        {/* VS / 종료 */}
                        <div className="flex flex-col items-center px-4">
                          <span className="text-slate-500 text-xs font-bold mb-1">VS</span>
                          <div className="h-8 w-px bg-slate-700/50"></div>

                          {/* 통합 명단 버튼 */}
                          {schedule.teamFormation && (isManagerMode || schedule.formationConfirmed || isPastSchedule) && schedule.type === 'internal' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsRosterExpanded(!isRosterExpanded)}
                              className="mt-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                            >
                              {isRosterExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                              명단
                            </Button>
                          )}
                        </div>

                        {/* 원정/Blue 팀 */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className={`text-4xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-blue-400' : 'text-rose-400'
                            }`}>
                            {schedule.opponentScore}
                          </span>
                          <span className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full ${schedule.type === 'internal'
                            ? 'bg-blue-400/20 text-blue-200'
                            : 'bg-rose-400/20 text-rose-200'
                            }`}>
                            {schedule.type === 'internal' ? 'BLUE' : 'AWAY'}
                          </span>
                        </div>
                      </div>

                      {/* 팀 명단 표시 - 좌우 병렬 */}
                      {schedule.teamFormation && (isManagerMode || schedule.formationConfirmed || isPastSchedule) && isRosterExpanded && (
                        <div className="mt-4 pt-3 border-t border-slate-700/50">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* Yellow Team */}
                            <div className="space-y-1">
                              <div className="font-semibold text-yellow-400 mb-2 text-center">Yellow Team</div>
                              {sortByPosition(schedule.teamFormation.yellowTeam || []).map((player: any, idx: number) => (
                                <div key={idx} className="text-slate-300 flex items-center gap-2 py-1">
                                  <Badge variant="outline" className={`text-[10px] ${getPositionColor(player.position || player.displayPosition || 'MC')}`}>
                                    {player.position || player.displayPosition || 'MC'}
                                  </Badge>
                                  <span>{player.name}</span>
                                </div>
                              ))}
                            </div>

                            {/* Blue Team */}
                            <div className="space-y-1">
                              <div className="font-semibold text-blue-400 mb-2 text-center">Blue Team</div>
                              {sortByPosition(schedule.teamFormation.blueTeam || []).map((player: any, idx: number) => (
                                <div key={idx} className="text-slate-300 flex items-center gap-2 py-1">
                                  <Badge variant="outline" className={`text-[10px] ${getPositionColor(player.position || player.displayPosition || 'MC')}`}>
                                    {player.position || player.displayPosition || 'MC'}
                                  </Badge>
                                  <span>{player.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MVP 표시 (잠시 숨김) */}
                      {/* {schedule.mvpUserId && (
                        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-center gap-2">
                          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="text-xs text-slate-300 font-medium">MOM: </span>
                          <span className="text-xs text-yellow-500 font-bold">
                            {schedule.attendances?.find((a: any) =>
                              (a.user?.id === schedule.mvpUserId) || (a.userId === schedule.mvpUserId)
                            )?.user?.realName ||
                              schedule.attendances?.find((a: any) =>
                                (a.user?.id === schedule.mvpUserId) || (a.userId === schedule.mvpUserId)
                              )?.user?.nickname ||
                              schedule.attendances?.find((a: any) =>
                                a.guestId === schedule.mvpUserId
                              )?.guestName ||
                              '알 수 없음'}
                          </span>
                        </div>
                      )} */}
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-blue-50 text-blue-700`}>
                      <CalendarIcon className="h-4 w-4" />
                      {(() => {
                        if (daysLeft === 0) return "오늘 경기!"
                        if (daysLeft === 1) return "내일 경기!"
                        if (daysLeft > 0) return `D-${daysLeft}`
                        return "경기 종료"
                      })()}
                    </div>
                  )}
                </div>

                {/* 관리자 아이콘 버튼들 */}
                {isManagerMode && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={handleCopyForSharing}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      title="카카오톡 공유 텍스트 복사"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
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

              {/* 장소 정보는 스코어보드 내부로 이동됨 - 예정 경기는 여기 표시 */}
              {!isPastSchedule && schedule.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{schedule.location}</span>
                </div>
              )}

              {/* 경기 설명 (예정) 또는 경기 총평 (완료) */}
              {isPastSchedule ? (
                // 지난 경기: 총평 표시
                schedule.matchSummary && (
                  <div className="text-sm text-gray-600 bg-slate-50 p-3 rounded-lg border-l-4 border-slate-400">
                    <span className="font-semibold text-slate-700">경기 총평: </span>
                    {schedule.matchSummary}
                  </div>
                )
              ) : (
                // 예정된 경기: 설명 표시
                schedule.description && (
                  <div className="text-sm text-gray-600">
                    {schedule.description}
                  </div>
                )
              )}

              {/* 경기 결과 입력 버튼 (관리자용) - 연습 경기는 제외, 지난 경기만 가능 */}
              {isManagerMode && onEnterResult && schedule.type !== 'training' && isPastSchedule && (
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
                    formationConfirmed={schedule.formationConfirmed}
                    isManagerMode={isManagerMode}
                    onVoteUpdate={() => {
                      onVoteUpdate?.()
                      onAttendanceUpdate(schedule.id)
                    }}
                    initialAttendees={schedule.attendees?.map((att: any) => ({
                      userId: att.userId,
                      name: att.name,
                      status: att.status as 'attending' | 'not_attending' | 'pending',
                      position: att.position,
                      subPositions: att.subPositions,
                      profileImage: att.profileImage || null,
                      isGuest: att.isGuest || false,
                      invitedBy: att.invitedBy
                    }))}
                    initialStats={stats}
                  />
                </div>
              )}

              {/* 댓글 섹션 */}
              {currentUser?.id && (
                <ScheduleComments
                  scheduleId={schedule.id}
                  currentUserId={currentUser.id}
                  isManagerMode={isManagerMode}
                />
              )}

            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default ScheduleCard

