'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, X, Check, UserPlus, UserMinus, Edit, Trash2, Trophy, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import { calculateDaysLeft, generateKakaoShareText, sortByPosition } from '@/lib/utils'
import { AttendanceVoting } from './attendance-voting'
import { ScheduleComments } from './schedule-comments'

interface ScheduleCardProps {
  compact?: boolean
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
  compact = false
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

  const stats = getAttendanceStats(schedule.attendees)
  const daysLeft = calculateDaysLeft(schedule.date)
  const isPastSchedule = daysLeft < 0
  
  // 경기 시작 시간이 지났는지 확인
  const isMatchTimePassed = (() => {
    const [year, month, day] = schedule.date.split('-')
    const [hours, minutes] = schedule.time.split(':')
    const scheduleDateTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
    return scheduleDateTime < new Date()
  })()

  const hasResult = schedule.ourScore !== null && schedule.ourScore !== undefined && schedule.opponentScore !== null && schedule.opponentScore !== undefined

  // 현재 사용자가 이 경기에 참석했는지 확인
  const didCurrentUserAttend = (() => {
    if (!currentUser?.id) return false
    const attendees = schedule.attendees || []
    const userAttendance = attendees.find((a: any) => a.userId === currentUser.id)
    if (!userAttendance) return false
    // API에서 status를 lowercase로 변환하므로 소문자로 체크
    // 'attending' = 참석 투표, 'attended' = 참석 완료
    // 'no_show' = 투표 후 불참, 'not_attending' = 불참 투표, 'pending' = 미투표
    return userAttendance.status === 'attending' || userAttendance.status === 'attended'
  })()

  const ScheduleSkeleton = () => (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span className="text-sm font-medium">로딩 중...</span>
        </div>
      </div>
    </div>
  )

  // 포지션별 색상 반환 함수
  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase()
    if (pos === 'GK') return 'border-purple-400/50 text-purple-300 bg-purple-400/10'
    if (pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'LRB' || pos === 'LRCB' || pos === 'SW') {
      return 'border-blue-400/50 text-blue-300 bg-blue-400/10'
    }
    if (pos === 'CM' || pos === 'CDM' || pos === 'CAM' || pos === 'DM' || pos === 'AM' || pos === 'LM' || pos === 'RM' || pos === 'MC' || pos === 'AMC') {
      return 'border-green-400/50 text-green-300 bg-green-400/10'
    }
    if (pos === 'ST' || pos === 'CF' || pos === 'LWF' || pos === 'RWF' || pos === 'SS' || pos === 'LW' || pos === 'RW' || pos === 'FW') {
      return 'border-red-400/50 text-red-300 bg-red-400/10'
    }
    return 'border-slate-400/50 text-slate-300 bg-slate-400/10'
  }

  // 공유하기 핸들러
  const handleCopyForSharing = async () => {
    const text = generateKakaoShareText(schedule, isManagerMode)
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        alert("경기 정보가 클립보드에 복사되었습니다.")
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
    }
  }

  if (compact) {
    return (
      <Card className="mb-3 overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold">{schedule.date} {schedule.time}</div>
              <div className="text-xs text-gray-500">{schedule.location}</div>
            </div>
            <Badge className={getTypeColor(schedule.type)}>{schedule.type}</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {isUpdating ? (
        <Card className="bg-gray-50">
          <ScheduleSkeleton />
        </Card>
      ) : (
        <Card className={`transition-all overflow-hidden relative shadow-sm hover:shadow-md border border-slate-200`}>
          
          {/* 하이라이트 바 */}
          {hasResult && didCurrentUserAttend && (
            <div className={`h-1.5 w-full ${
              schedule.ourScore > schedule.opponentScore ? 'bg-emerald-500' :
              schedule.ourScore < schedule.opponentScore ? 'bg-rose-500' : 'bg-slate-400'
            }`} />
          )}

          {/* Header Section */}
          <div className={`px-6 py-4 border-b ${isPastSchedule ? 'bg-slate-50/50' : 'bg-blue-50/30 border-blue-100'}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-slate-800">
                    {(() => {
                      const [year, month, day] = schedule.date.split('-')
                      const date = new Date(Number(year), Number(month) - 1, Number(day))
                      return date.toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })
                    })()}
                  </h3>
                  <span className="text-sm font-semibold text-blue-600">
                    {schedule.time}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MapPinIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span>{schedule.location || '장소 미정'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div className="flex gap-1">
                  <Badge className={getTypeColor(schedule.type)} variant="secondary">
                    {schedule.type === "internal" ? "자체경기" :
                      schedule.type === "match" ? `A매치${schedule.opponentTeam ? ` vs ${schedule.opponentTeam}` : ''}` :
                        schedule.type === "training" ? "연습" : schedule.type}
                  </Badge>
                  {hasResult && didCurrentUserAttend ? (
                    <Badge className={`${
                      schedule.ourScore > schedule.opponentScore ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      schedule.ourScore < schedule.opponentScore ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {schedule.ourScore > schedule.opponentScore ? '승리' :
                       schedule.ourScore < schedule.opponentScore ? '패배' : '무승부'}
                    </Badge>
                  ) : isPastSchedule && (
                    <Badge variant="outline" className="text-slate-400 border-slate-200">종료</Badge>
                  )}
                </div>
                {!isPastSchedule && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {daysLeft === 0 ? "D-Day" : `D-${daysLeft}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* 스코어보드 (현대적인 화이트 카드 스타일) */}
            {hasResult && (
              <div className="bg-gradient-to-b from-white to-slate-50/50 px-6 py-6 border-b border-slate-100">
                <div className="flex items-center justify-center gap-12 mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-5xl font-black tabular-nums tracking-tighter ${
                      schedule.ourScore > schedule.opponentScore ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {schedule.ourScore}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                      YELLOW
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-slate-300 font-bold text-sm">VS</div>
                    <div className="w-px h-8 bg-slate-200 mt-1" />
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-5xl font-black tabular-nums tracking-tighter ${
                      schedule.opponentScore > schedule.ourScore ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      {schedule.opponentScore}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                      BLUE
                    </span>
                  </div>
                </div>

                {/* 골 기록 */}
                {schedule.goalRecords && schedule.goalRecords.length > 0 && (
                  <div className="space-y-1.5 max-w-xs mx-auto mb-6">
                    {schedule.goalRecords.map((goal: any, idx: number) => (
                      <div key={idx} className="flex items-center text-[13px] text-slate-600">
                        <span className="w-8 font-bold text-slate-400 text-[11px]">{goal.quarter}Q</span>
                        <div className="flex-1 flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs">⚽</span>
                          <span className={`font-semibold ${goal.team === 'yellow' ? 'text-amber-600' : 'text-blue-600'}`}>
                            {goal.scorerName}
                          </span>
                          {goal.assistName && (
                            <span className="text-[11px] text-slate-400">
                              (도움: {goal.assistName})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* MOM & Summary */}
                <div className="flex flex-col items-center gap-3 border-t border-slate-100/50 pt-4">
                  {schedule.mvpUserId && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100 shadow-sm">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold text-amber-900">MOM: {schedule.mvpUserName || 'MVP'}</span>
                    </div>
                  )}
                  {schedule.matchSummary && (
                    <p className="text-sm text-slate-500 italic text-center max-w-sm px-4 leading-relaxed">
                      "{schedule.matchSummary}"
                    </p>
                  )}
                </div>

                {/* 팀 명단 버튼 및 레이아웃 */}
                {schedule.teamFormation && (isManagerMode || schedule.formationConfirmed || isPastSchedule) && schedule.type === 'internal' && (
                  <div className="mt-4 border-t border-slate-100/50 pt-4 flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRosterExpanded(!isRosterExpanded)}
                      className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    >
                      {isRosterExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      팀 명단 보기
                    </Button>

                    {isRosterExpanded && (
                      <div className="w-full mt-4 grid grid-cols-2 gap-6 bg-white/50 p-4 rounded-xl border border-slate-100">
                        {/* Yellow Team */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-1 mb-2 text-center">
                            Yellow Team
                          </div>
                          <div className="space-y-1">
                            {sortByPosition(schedule.teamFormation.yellowTeam || []).map((player: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 min-w-[32px] justify-center ${getPositionColor(player.position || player.displayPosition || 'CM')}`}>
                                  {player.position || player.displayPosition || 'CM'}
                                </Badge>
                                <span className="font-medium">{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Blue Team */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-1 mb-2 text-center">
                            Blue Team
                          </div>
                          <div className="space-y-1">
                            {sortByPosition(schedule.teamFormation.blueTeam || []).map((player: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 min-w-[32px] justify-center ${getPositionColor(player.position || player.displayPosition || 'CM')}`}>
                                  {player.position || player.displayPosition || 'CM'}
                                </Badge>
                                <span className="font-medium">{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="p-6 space-y-6 text-slate-800">
              {/* 경기 설명 (결과 없을 때) */}
              {!hasResult && schedule.description && (
                <div className="text-sm text-slate-600 bg-slate-50/80 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                  {schedule.description}
                </div>
              )}

              {/* 투표 섹션 */}
              {!isPastSchedule && currentUser?.id && (
                <AttendanceVoting
                  scheduleId={schedule.id}
                  currentUserId={currentUser.id}
                  isPastSchedule={isPastSchedule}
                  allowGuests={schedule.allowGuests}
                  hasTeamFormation={!!schedule.teamFormation}
                  formationConfirmed={schedule.formationConfirmed}
                  isManagerMode={isManagerMode}
                  onVoteUpdate={() => onVoteUpdate?.()}
                  initialAttendees={schedule.attendees}
                  initialStats={stats}
                />
              )}

              {/* 관리자 버튼 (결과 입력/수정) */}
              {isManagerMode && onEnterResult && schedule.type !== 'training' && isMatchTimePassed && (
                <Button
                  onClick={() => onEnterResult(schedule)}
                  variant={hasResult ? "outline" : "default"}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  {hasResult ? "경기 결과 수정" : "경기 결과 입력"}
                </Button>
              )}

              {/* 공유/수정/삭제 버튼 */}
              {isManagerMode && (
                <div className="flex items-center justify-end gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyForSharing} className="text-slate-500 h-8 px-2 text-xs">
                    <Share2 className="h-3.5 w-3.5 mr-1" /> 공유
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditSchedule(schedule)} className="text-slate-500 h-8 px-2 text-xs">
                    <Edit className="h-3.5 w-3.5 mr-1" /> 수정
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteSchedule(schedule.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-xs">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> 삭제
                  </Button>
                </div>
              )}

              {/* 댓글 섹션 (가장 하단에 일관되게 배치) */}
              {currentUser?.id && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <header className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-800">댓글</h4>
                  </header>
                  <ScheduleComments
                    scheduleId={schedule.id}
                    currentUserId={currentUser.id}
                    isManagerMode={isManagerMode}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default ScheduleCard
