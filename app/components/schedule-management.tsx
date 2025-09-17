"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Check, X, AlertCircle, Timer, Coffee, TrendingUp, Target, Edit } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AttendanceVoting } from "./attendance-voting"
import { getLevelShortLabel } from '@/lib/level-system'

// 장소 목록을 동적으로 로드

interface ScheduleManagementProps {
  isManagerMode: boolean
  currentUser?: any
  onSwitchToFormation?: () => void
}

export function ScheduleManagement({ isManagerMode, currentUser, onSwitchToFormation }: ScheduleManagementProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  
  // 팀편성 관련 상태
  const [formationResults, setFormationResults] = useState<any>(null)
  const [isFormingTeams, setIsFormingTeams] = useState(false)
  const [isSavingFormation, setIsSavingFormation] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    type: "internal",
    date: "",
    time: "",
    gatherTime: "",
    location: "",
    quarterTime: 20,
    restTime: 10,
    description: "",
    // 유형별 추가 필드
    opponentTeam: "", // A매치용 상대팀명
    trainingContent: "", // 연습용 연습내용
  })

  useEffect(() => {
    fetchSchedules()
    fetchAvailableLocations()
  }, [])

  // 페이지 로드 시 저장된 팀편성 결과 확인 (기존 useEffect와 합침)
  useEffect(() => {
    if (schedules.length > 0) {
      const nextSchedule = getNextUpcomingSchedule()
      if (nextSchedule && nextSchedule.teamFormation) {
        setFormationResults({
          ...nextSchedule.teamFormation,
          scheduleId: nextSchedule.id
        })
      }
    }
  }, [schedules])

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      console.log('일정 목록 가져오는 중...')

      const response = await fetch('/api/schedule/list')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '일정 목록을 가져올 수 없습니다.')
      }

      console.log('일정 목록 로드 성공:', result.count + '개')
      setSchedules(result.schedules)
      setError("")

    } catch (error) {
      console.error('일정 목록 조회 오류:', error)
      setError(error instanceof Error ? error.message : '일정 목록 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableLocations = async () => {
    try {
      setIsLoadingLocations(true)
      console.log('사용 가능한 장소 목록 가져오는 중...')

      const response = await fetch('/api/schedule/locations')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '장소 목록을 가져올 수 없습니다.')
      }

      console.log('장소 목록 로드 성공:', result.locations.length + '개')
      setAvailableLocations(result.locations)

    } catch (error) {
      console.error('장소 목록 조회 오류:', error)
      // 장소 로딩 실패는 전체 기능을 막지 않음
    } finally {
      setIsLoadingLocations(false)
    }
  }

  // 제목 자동 생성 함수 (장소 + 시간)
  const generateAutoTitle = (location: string, time: string) => {
    return `${location}\n${time}`
  }

  // D-Day 계산 함수
  const calculateDaysLeft = (scheduleDate: string) => {
    const today = new Date()
    const matchDate = new Date(scheduleDate)
    
    // 시간 차이를 제거하고 날짜만 비교
    today.setHours(0, 0, 0, 0)
    matchDate.setHours(0, 0, 0, 0)
    
    const diffTime = matchDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // 자동 팀편성 알고리즘 (레벨 기반)
  const autoFormTeams = (schedule: any) => {
    const attendingPlayers = schedule.attendees.filter((attendee: any) => 
      attendee.status === 'attending' || attendee.status === 'attended'
    )
    
    console.log('팀편성 시작:', {
      총인원: schedule.attendees.length,
      참석자: attendingPlayers.length,
      참석자목록: attendingPlayers.map(p => ({ 이름: p.name, 포지션: p.position, 레벨: p.level }))
    })
    
    if (attendingPlayers.length < 6) {
      return { yellowTeam: [], blueTeam: [], message: '팀편성에는 최소 6명이 필요합니다.' }
    }

    const players = [...attendingPlayers]
    const totalPlayers = players.length
    const playersPerTeam = Math.floor(totalPlayers / 2)
    
    // 1단계: 포지션별로 그룹화 및 레벨순 정렬
    const playersByPosition = {
      "골키퍼": players.filter(p => p.position === "GK").sort((a, b) => (b.level || 1) - (a.level || 1)),
      "수비수": players.filter(p => ["DC", "DR", "DL", "DRL", "DRLC"].includes(p.position)).sort((a, b) => (b.level || 1) - (a.level || 1)),
      "미드필더": players.filter(p => ["MC", "AMC", "DM"].includes(p.position)).sort((a, b) => (b.level || 1) - (a.level || 1)),
      "공격수": players.filter(p => ["ST", "CF", "SS", "LWF", "RWF"].includes(p.position)).sort((a, b) => (b.level || 1) - (a.level || 1))
    }
    
    console.log('포지션별 분류:', {
      골키퍼: playersByPosition["골키퍼"].map(p => p.name),
      수비수: playersByPosition["수비수"].map(p => p.name),
      미드필더: playersByPosition["미드필더"].map(p => p.name),
      공격수: playersByPosition["공격수"].map(p => p.name)
    })

    const yellowTeam = []
    const blueTeam = []
    const usedPlayers = new Set()

    // 2단계: 포지션별 균등 분배 (지그재그 방식)
    Object.entries(playersByPosition).forEach(([position, positionPlayers]) => {
      positionPlayers.forEach((player, index) => {
        if (usedPlayers.has(player.userId || player.id)) return
        
        if (yellowTeam.length < playersPerTeam && (index % 2 === 0 || blueTeam.length >= playersPerTeam)) {
          yellowTeam.push(player)
        } else if (blueTeam.length < playersPerTeam) {
          blueTeam.push(player)
        }
        usedPlayers.add(player.userId || player.id)
      })
    })

    // 3단계: 레벨 균형 조정
    const getTeamLevel = (team: any[]) => {
      if (team.length === 0) return 0
      return team.reduce((sum, p) => sum + (p.level || 1), 0) / team.length
    }

    // 필요시 선수 교환으로 레벨 균형 맞추기
    let attempts = 0
    while (attempts < 10) {
      const yellowLevel = getTeamLevel(yellowTeam)
      const blueLevel = getTeamLevel(blueTeam)
      const levelDiff = Math.abs(yellowLevel - blueLevel)
      
      if (levelDiff < 0.5) break // 충분히 균형잡힘
      
      // 교환할 선수 쌍 찾기
      let swapped = false
      for (let i = 0; i < yellowTeam.length && !swapped; i++) {
        for (let j = 0; j < blueTeam.length && !swapped; j++) {
          // 교환 후 균형이 더 좋아지는지 확인
          const tempYellow = [...yellowTeam]
          const tempBlue = [...blueTeam]
          
          tempYellow[i] = blueTeam[j]
          tempBlue[j] = yellowTeam[i]
          
          const newYellowLevel = getTeamLevel(tempYellow)
          const newBlueLevel = getTeamLevel(tempBlue)
          const newLevelDiff = Math.abs(newYellowLevel - newBlueLevel)
          
          if (newLevelDiff < levelDiff) {
            yellowTeam[i] = blueTeam[j]
            blueTeam[j] = tempBlue[j]
            swapped = true
          }
        }
      }
      
      if (!swapped) break
      attempts++
    }

    // 팀편성이 제대로 안된 경우 (모든 선수가 한 팀에만 배치된 경우 등)
    if (yellowTeam.length === 0 || blueTeam.length === 0) {
      console.log('팀편성 실패: 한쪽 팀이 비어있음')
      // 강제로 재분배
      const allPlayers = [...yellowTeam, ...blueTeam]
      const newYellow = []
      const newBlue = []
      
      allPlayers.forEach((player, index) => {
        if (index % 2 === 0) {
          newYellow.push(player)
        } else {
          newBlue.push(player)
        }
      })
      
      yellowTeam.length = 0
      blueTeam.length = 0
      yellowTeam.push(...newYellow)
      blueTeam.push(...newBlue)
    }

    const finalYellowTeam = yellowTeam.sort((a, b) => (b.level || 1) - (a.level || 1))
    const finalBlueTeam = blueTeam.sort((a, b) => (b.level || 1) - (a.level || 1))
    const yellowAvg = getTeamLevel(finalYellowTeam)
    const blueAvg = getTeamLevel(finalBlueTeam)
    
    console.log('팀편성 완료:', {
      노랑팀: finalYellowTeam.map(p => ({ 이름: p.name, 포지션: p.position, 레벨: p.level })),
      파랑팀: finalBlueTeam.map(p => ({ 이름: p.name, 포지션: p.position, 레벨: p.level })),
      노랑팀평균: yellowAvg,
      파랑팀평균: blueAvg,
      레벨차이: Math.abs(yellowAvg - blueAvg).toFixed(1)
    })

    return {
      yellowTeam: finalYellowTeam,
      blueTeam: finalBlueTeam,
      yellowAverage: yellowAvg.toFixed(1),
      blueAverage: blueAvg.toFixed(1),
      levelDifference: Math.abs(yellowAvg - blueAvg).toFixed(1)
    }
  }

  // 시간 옵션 생성 (6:00부터 23:30까지 30분 단위)
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 6; hour <= 23; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`)
      if (hour < 23) {
        // 23:30까지만
        times.push(`${hour.toString().padStart(2, "0")}:30`)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  // 시작시간에서 20분을 뺀 집합시간 계산 함수
  const calculateGatherTime = (startTime: string): string => {
    if (!startTime) return ""

    const [hours, minutes] = startTime.split(":").map(Number)
    let gatherHour = hours
    let gatherMinute = minutes - 20

    if (gatherMinute < 0) {
      gatherHour -= 1
      gatherMinute += 60
    }

    return `${gatherHour.toString().padStart(2, "0")}:${gatherMinute.toString().padStart(2, "0")}`
  }

  // 시작시간 변경 시 집합시간 자동 계산
  const handleStartTimeChange = (time: string) => {
    const calculatedGatherTime = calculateGatherTime(time)

    setNewSchedule({
      ...newSchedule,
      time,
      gatherTime: calculatedGatherTime,
    })
  }

  // 일정 등록 처리
  const handleScheduleSubmit = async () => {
    if (!currentUser?.id) {
      setError('로그인이 필요합니다.')
      return
    }

    setIsSubmitting(true)

    try {
      // 장소 + 시간으로 제목 자동 생성
      const autoTitle = generateAutoTitle(newSchedule.location, newSchedule.time)

      const scheduleData = {
        title: autoTitle,
        type: newSchedule.type,
        date: newSchedule.date,
        time: newSchedule.time,
        gatherTime: newSchedule.gatherTime,
        location: newSchedule.location,
        quarterTime: newSchedule.quarterTime,
        restTime: newSchedule.restTime,
        description: newSchedule.description,
        opponentTeam: newSchedule.opponentTeam || null,
        trainingContent: newSchedule.trainingContent || null,
        createdBy: currentUser.id
      }

      console.log('일정 등록 요청 데이터:', scheduleData)

      const response = await fetch('/api/schedule/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '일정 등록 중 오류가 발생했습니다.')
      }

      console.log('일정 등록 성공:', result.schedule)
      
      // 일정 목록 새로고침
      await fetchSchedules()
      
      // 새로운 장소가 추가되었을 수 있으므로 장소 목록 다시 로드
      fetchAvailableLocations()
      
      // 폼 초기화
      resetScheduleForm()

    } catch (error) {
      console.error('일정 등록 오류:', error)
      setError(error instanceof Error ? error.message : '일정 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 일정 수정 폼 열기
  const handleEditSchedule = (schedule: any) => {
    setEditingScheduleId(schedule.id)
    setNewSchedule({
      type: schedule.type,
      date: schedule.date,
      time: schedule.time,
      gatherTime: schedule.gatherTime,
      location: schedule.location,
      quarterTime: schedule.quarterTime,
      restTime: schedule.restTime,
      description: schedule.description || "",
      opponentTeam: schedule.opponentTeam || "",
      trainingContent: schedule.trainingContent || "",
    })
    setSelectedDate(new Date(schedule.date))
    setIsEditingSchedule(true)
  }

  // 일정 수정 처리
  const handleScheduleUpdate = async () => {
    if (!currentUser?.id || !editingScheduleId) {
      setError('수정 권한이 없습니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const scheduleData = {
        scheduleId: editingScheduleId,
        type: newSchedule.type,
        date: newSchedule.date,
        time: newSchedule.time,
        gatherTime: newSchedule.gatherTime,
        location: newSchedule.location,
        quarterTime: newSchedule.quarterTime,
        restTime: newSchedule.restTime,
        description: newSchedule.description,
        opponentTeam: newSchedule.opponentTeam || null,
        trainingContent: newSchedule.trainingContent || null,
        userId: currentUser.id
      }

      console.log('일정 수정 요청 데이터:', scheduleData)

      const response = await fetch('/api/schedule/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '일정 수정 중 오류가 발생했습니다.')
      }

      console.log('일정 수정 성공:', result.schedule)
      
      // 일정 목록 새로고침
      await fetchSchedules()
      
      // 폼 초기화 및 수정 모드 종료
      resetScheduleForm()

    } catch (error) {
      console.error('일정 수정 오류:', error)
      setError(error instanceof Error ? error.message : '일정 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 폼 초기화
  const resetScheduleForm = () => {
    setNewSchedule({
      type: "internal",
      date: "",
      time: "",
      gatherTime: "",
      location: "",
      quarterTime: 20,
      restTime: 10,
      description: "",
      opponentTeam: "",
      trainingContent: "",
    })
    setSelectedDate(undefined)
    setIsAddingSchedule(false)
    setIsEditingSchedule(false)
    setEditingScheduleId(null)
  }

  // getTypeColor 함수 업데이트
  const getTypeColor = (type: string) => {
    switch (type) {
      case "internal":
        return "bg-green-100 text-green-800" // 자체경기
      case "match":
        return "bg-red-100 text-red-800" // A매치
      case "training":
        return "bg-blue-100 text-blue-800" // 연습
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAttendanceStats = (attendees: any[]) => {
    const attending = attendees.filter((a) => a.status === "attending" || a.status === "attended").length
    const total = attendees.length
    return { attending, total, percentage: Math.round((attending / total) * 100) }
  }

  const getPositionColor = (position: string) => {
    // 포지션 코드 기반 색상 분류
    switch (position) {
      // 골키퍼 - 노란색
      case "GK":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      
      // 수비수 - 파란색  
      case "DC":
      case "DR": 
      case "DL":
      case "DRL":
      case "DRLC":
        return "bg-blue-100 text-blue-800 border-blue-300"
      
      // 미드필더 - 초록색
      case "MC":
      case "AMC":
      case "DM":
        return "bg-green-100 text-green-800 border-green-300"
      
      // 공격수 - 빨간색
      case "ST":
      case "CF":
      case "SS":
      case "LWF":
      case "RWF":
        return "bg-red-100 text-red-800 border-red-300"
      
      // 기타 - 회색
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">일정 정보 로딩 중 오류가 발생했습니다</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500">{error}</div>
              <Button onClick={fetchSchedules}>다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 다음 경기 찾기 (가장 가까운 미래 일정)
  const getNextUpcomingSchedule = () => {
    const now = new Date()
    const upcomingSchedules = schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        return scheduleDate >= now && schedule.status === 'scheduled'
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return upcomingSchedules[0] || null
  }

  const nextUpcomingSchedule = getNextUpcomingSchedule()

  return (
    <div className="space-y-6">
      {/* 다음 경기 섹션 - 간소화된 디자인 */}
      {nextUpcomingSchedule && (
        <Card className="border-l-4 border-l-blue-500">          
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              다음 경기 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* D-Day 표시 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                <CalendarIcon className="h-4 w-4" />
                {(() => {
                  const daysLeft = calculateDaysLeft(nextUpcomingSchedule.date)
                  return daysLeft === 0 ? (
                    <span className="font-bold">오늘 경기!</span>
                  ) : daysLeft === 1 ? (
                    <span className="font-bold">내일 경기!</span>
                  ) : daysLeft > 0 ? (
                    <span>D-{daysLeft}</span>
                  ) : (
                    <span className="text-gray-500">지난 경기</span>
                  )
                })()}
              </div>
            </div>

            {/* 경기 제목 */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {nextUpcomingSchedule.location}
              </h3>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {nextUpcomingSchedule.time}
              </h3>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge className={getTypeColor(nextUpcomingSchedule.type)} variant="secondary">
                  {nextUpcomingSchedule.type === "internal" ? "자체경기" : nextUpcomingSchedule.type === "match" ? "A매치" : "연습"}
                </Badge>
              </div>
            </div>

            {/* 경기 세부 정보 */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">
                    {new Intl.DateTimeFormat('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    }).format(new Date(nextUpcomingSchedule.date))}
                  </div>
                  <div className="text-muted-foreground">집합: {nextUpcomingSchedule.gatherTime}</div>
                </div>
              </div>
            </div>

            {/* 참석 현황 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">참석 현황</span>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Badge variant="outline" className="font-medium">
                    {getAttendanceStats(nextUpcomingSchedule.attendees).attending}/{getAttendanceStats(nextUpcomingSchedule.attendees).total}명
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({getAttendanceStats(nextUpcomingSchedule.attendees).percentage}%)
                  </span>
                </div>
              </div>
              <Progress value={getAttendanceStats(nextUpcomingSchedule.attendees).percentage} className="h-2" />
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2 pt-2">
              <div className="flex-1">
                <AttendanceVoting 
                  schedule={nextUpcomingSchedule}
                  currentUser={currentUser}
                  isManagerMode={isManagerMode}
                  onAttendanceUpdate={fetchSchedules}
                />
              </div>
              {(() => {
                const daysLeft = calculateDaysLeft(nextUpcomingSchedule.date)
                return isManagerMode && daysLeft <= 2 && daysLeft >= 0 && (
                  <Button 
                    onClick={async () => {
                      setIsFormingTeams(true)
                      try {
                        console.log('팀편성 버튼 클릭, 일정 데이터:', nextUpcomingSchedule)
                        const result = autoFormTeams(nextUpcomingSchedule)
                        console.log('팀편성 결과:', result)
                        
                        if (result.message) {
                          // 오류 메시지가 있는 경우 (인원 부족 등)
                          setFormationResults({ ...result, scheduleId: nextUpcomingSchedule.id })
                        } else {
                          // 정상 편성 결과를 데이터베이스에 저장
                          setIsSavingFormation(true)
                          const saveResponse = await fetch('/api/schedule/formation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              scheduleId: nextUpcomingSchedule.id,
                              yellowTeam: result.yellowTeam,
                              blueTeam: result.blueTeam,
                              yellowAverage: result.yellowAverage,
                              blueAverage: result.blueAverage,
                              levelDifference: result.levelDifference
                            })
                          })
                          
                          if (saveResponse.ok) {
                            setFormationResults({ ...result, scheduleId: nextUpcomingSchedule.id })
                            // 일정 목록 새로고침으로 저장된 데이터 반영
                            fetchSchedules()
                          } else {
                            console.error('팀편성 저장 실패')
                            setFormationResults({ 
                              yellowTeam: [], 
                              blueTeam: [], 
                              message: '팀편성 저장에 실패했습니다.',
                              scheduleId: nextUpcomingSchedule.id 
                            })
                          }
                          setIsSavingFormation(false)
                        }
                      } catch (error) {
                        console.error('팀편성 중 오류:', error)
                        setFormationResults({ 
                          yellowTeam: [], 
                          blueTeam: [], 
                          message: '팀편성 중 오류가 발생했습니다.',
                          scheduleId: nextUpcomingSchedule.id 
                        })
                      } finally {
                        setIsFormingTeams(false)
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                    disabled={isFormingTeams || isSavingFormation}
                  >
                    {isFormingTeams ? "편성 중..." : isSavingFormation ? "저장 중..." : "팀편성하기"}
                  </Button>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 팀편성 결과 표시 */}
      {formationResults && formationResults.scheduleId === nextUpcomingSchedule?.id && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">팀편성 결과</h3>
              {formationResults.message ? (
                <p className="text-sm text-red-600">{formationResults.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  레벨 차이: {formationResults.levelDifference}점
                </p>
              )}
            </div>

            {!formationResults.message && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 노랑팀 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <h4 className="font-medium text-base">노랑팀 ({formationResults.yellowTeam.length}명)</h4>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">평균 {formationResults.yellowAverage}점</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {formationResults.yellowTeam.map((player: any) => (
                    <div key={player.userId || player.id} className="flex items-center gap-2 text-sm p-2 bg-yellow-50 rounded-lg">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-medium">{player.name}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={getPositionColor(player.position)} variant="outline" size="sm">
                            {player.position}
                          </Badge>
                          {player.subPositions && player.subPositions.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              + {player.subPositions.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getLevelShortLabel(player.level)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 파랑팀 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <h4 className="font-medium text-base">파랑팀 ({formationResults.blueTeam.length}명)</h4>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">평균 {formationResults.blueAverage}점</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {formationResults.blueTeam.map((player: any) => (
                    <div key={player.userId || player.id} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded-lg">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-medium">{player.name}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={getPositionColor(player.position)} variant="outline" size="sm">
                            {player.position}
                          </Badge>
                          {player.subPositions && player.subPositions.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              + {player.subPositions.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getLevelShortLabel(player.level)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* 팀편성 초기화 버튼 (총무 전용) */}
            {isManagerMode && (
              <div className="text-center pt-2">
                <Button 
                  onClick={async () => {
                    if (!nextUpcomingSchedule?.id) return
                    
                    try {
                      const response = await fetch(`/api/schedule/formation?scheduleId=${nextUpcomingSchedule.id}`, {
                        method: 'DELETE'
                      })
                      
                      if (response.ok) {
                        setFormationResults(null)
                        // 일정 목록 새로고침으로 DB 변경사항 반영
                        fetchSchedules()
                      } else {
                        console.error('팀편성 초기화 실패')
                      }
                    } catch (error) {
                      console.error('팀편성 초기화 중 오류:', error)
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  팀편성 초기화
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 헤더 */}
      <div className="flex justify-end items-center">
        {isManagerMode && (
          <Dialog open={isAddingSchedule || isEditingSchedule} onOpenChange={(open) => {
            if (!open) resetScheduleForm()
            else setIsAddingSchedule(true)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                일정 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditingSchedule ? '일정 수정' : '새 일정 추가'}</DialogTitle>
                <DialogDescription>
                  {isEditingSchedule ? '일정 정보를 수정하세요' : '새로운 팀 일정을 등록하세요'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">경기 유형 *</Label>
                  <Select
                    value={newSchedule.type}
                    onValueChange={(value) => setNewSchedule({ 
                      ...newSchedule, 
                      type: value,
                      opponentTeam: "", // 유형 변경 시 관련 필드 초기화
                      trainingContent: ""
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">자체경기</SelectItem>
                      <SelectItem value="match">A매치</SelectItem>
                      <SelectItem value="training">연습</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 유형별 추가 정보 입력 */}
                {newSchedule.type === "match" && (
                  <div className="space-y-2">
                    <Label htmlFor="opponentTeam">상대팀명 *</Label>
                    <Input
                      id="opponentTeam"
                      value={newSchedule.opponentTeam}
                      onChange={(e) => setNewSchedule({ ...newSchedule, opponentTeam: e.target.value })}
                      placeholder="상대팀 이름을 입력하세요 (예: FC 라이트닝)"
                    />
                  </div>
                )}

                {newSchedule.type === "training" && (
                  <div className="space-y-2">
                    <Label htmlFor="trainingContent">연습 내용 *</Label>
                    <Input
                      id="trainingContent"
                      value={newSchedule.trainingContent}
                      onChange={(e) => setNewSchedule({ ...newSchedule, trainingContent: e.target.value })}
                      placeholder="연습 내용을 입력하세요 (예: 패스 연습, 슈팅 연습)"
                    />
                  </div>
                )}

                {/* 날짜 선택 - Calendar 컴포넌트 사용 (선택 시 자동 닫힘) */}
                <div className="space-y-2">
                  <Label>날짜 *</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, "yyyy년 MM월 dd일 (EEE)", { locale: ko })
                          : "날짜를 선택하세요"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setNewSchedule({
                            ...newSchedule,
                            date: date ? format(date, "yyyy-MM-dd") : "",
                          })
                          // 날짜 선택 시 달력 자동 닫기
                          setIsDatePickerOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 시간 선택 - 시작시간만 입력받고 집합시간은 자동 계산 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>시작 시간 *</Label>
                    <Select value={newSchedule.time} onValueChange={handleStartTimeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="시작 시간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 집합시간 표시 (입력 불가) */}
                  {newSchedule.time && newSchedule.gatherTime && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">집합 시간: {newSchedule.gatherTime}</span>
                        <span className="text-sm text-blue-600">(시작 20분 전)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 장소 선택 - 추천 장소와 직접 입력 */}
                <div className="space-y-2">
                  <Label>장소 *</Label>
                  <div className="space-y-3">
                    {/* 추천 장소 선택 */}
                    <Select
                      value={newSchedule.location}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="이전 사용 장소에서 선택" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {isLoadingLocations ? (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            장소 목록 로딩 중...
                          </div>
                        ) : (
                          <>
                            {availableLocations.filter(loc => loc.type === 'used').length > 0 && (
                              <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted">
                                이전에 사용한 장소
                              </div>
                            )}
                            {availableLocations.filter(loc => loc.type === 'used').map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                  <span>{location.name}</span>
                                  <Badge variant="secondary" className="text-xs ml-auto">
                                    {location.count}회
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                            
                            {availableLocations.filter(loc => loc.type === 'popular').length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted mt-2">
                                  추천 장소
                                </div>
                                {availableLocations.filter(loc => loc.type === 'popular').map((location) => (
                                  <SelectItem key={location.name} value={location.name}>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-green-500" />
                                      <span>{location.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    {/* 직접 입력 */}
                    <div className="relative">
                      <Input
                        value={newSchedule.location}
                        onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                        placeholder="또는 직접 입력하세요"
                      />
                      {newSchedule.location && 
                       !availableLocations.some(loc => loc.name === newSchedule.location) && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                            신규
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarterTime">쿼터 시간 (분)</Label>
                  <Select
                    value={newSchedule.quarterTime.toString()}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, quarterTime: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[15, 20, 25, 30, 35, 40, 45].map((minutes) => (
                        <SelectItem key={minutes} value={minutes.toString()}>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            {minutes}분
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restTime">휴식 시간 (분)</Label>
                  <Select
                    value={newSchedule.restTime.toString()}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, restTime: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20].map((minutes) => (
                        <SelectItem key={minutes} value={minutes.toString()}>
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4" />
                            {minutes}분
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    placeholder="추가 정보를 입력하세요"
                    rows={3}
                  />
                </div>

                {/* 일정 요약 */}
                {(selectedDate || newSchedule.time || newSchedule.gatherTime) && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <h4 className="font-medium text-blue-800">일정 요약</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="font-medium">
                          {newSchedule.type === "internal" ? "자체경기" :
                           newSchedule.type === "match" ? `vs ${newSchedule.opponentTeam || "상대팀"}` :
                           `연습 - ${newSchedule.trainingContent || "연습내용"}`}
                        </span>
                      </div>
                      {selectedDate && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {format(selectedDate, "yyyy년 MM월 dd일 (EEE)", { locale: ko })}
                        </div>
                      )}
                      {newSchedule.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          시작: {newSchedule.time}
                        </div>
                      )}
                      {newSchedule.gatherTime && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          집합: {newSchedule.gatherTime} (시작 20분 전)
                        </div>
                      )}
                      {newSchedule.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          장소: {newSchedule.location}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetScheduleForm}>
                  취소
                </Button>
                <Button
                  onClick={isEditingSchedule ? handleScheduleUpdate : handleScheduleSubmit}
                  disabled={
                    !selectedDate || 
                    !newSchedule.time || 
                    !newSchedule.location || 
                    (newSchedule.type === "match" && !newSchedule.opponentTeam) ||
                    (newSchedule.type === "training" && !newSchedule.trainingContent) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>등록 중...</span>
                    </div>
                  ) : (
                    isEditingSchedule ? '수정' : '등록'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
      </div>

      {/* 일정 목록 */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">등록된 일정이 없습니다.</div>
                {isManagerMode && (
                  <Button onClick={() => setIsAddingSchedule(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 일정 등록하기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          schedules
            .filter(schedule => schedule.id !== nextUpcomingSchedule?.id) // 다음 경기 제외
            .map((schedule) => {
            const stats = getAttendanceStats(schedule.attendees)
            const daysLeft = calculateDaysLeft(schedule.date)

          return (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4 p-6">
                {/* D-Day 표시 */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                    <CalendarIcon className="h-4 w-4" />
                    {daysLeft === 0 ? (
                      <span className="font-bold">오늘 경기!</span>
                    ) : daysLeft === 1 ? (
                      <span className="font-bold">내일 경기!</span>
                    ) : daysLeft > 0 ? (
                      <span>D-{daysLeft}</span>
                    ) : (
                      <span className="text-gray-500">지난 경기</span>
                    )}
                  </div>
                </div>

                {/* 경기 제목 */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 whitespace-pre-line">
                    {schedule.location}
                  </h3>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 whitespace-pre-line">
                    {schedule.time}
                  </h3>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge className={getTypeColor(schedule.type)} variant="secondary">
                      {schedule.type === "internal" ? "자체경기" : schedule.type === "match" ? "A매치" : "연습"}
                    </Badge>
                    {/* <Badge className={getStatusColor(schedule.status)} variant="outline">
                      {schedule.status === "scheduled" ? "예정" : "완료"}
                    </Badge> */}
                    {isManagerMode && schedule.status === "scheduled" && (
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleEditSchedule(schedule)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 경기 세부 정보 - 대시보드와 동일한 스타일 */}
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {new Intl.DateTimeFormat('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        }).format(new Date(schedule.date))}
                      </div>
                      <div className="text-muted-foreground">집합: {schedule.gatherTime}</div>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                {schedule.description && (
                  <p className="text-sm text-muted-foreground text-center">{schedule.description}</p>
                )}

                {/* 참석 현황 - 대시보드와 동일한 스타일 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">참석 현황</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <Badge variant="outline" className="font-medium">
                        {stats.attending}/{stats.total}명
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({stats.percentage}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={stats.percentage} className="h-2" />
                </div>

                {/* 참석자 목록 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {schedule.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="text-xs">{attendee.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm truncate">{attendee.name}</span>
                        <Badge className={getPositionColor(attendee.position)} variant="outline" size="sm">
                          {attendee.position}
                        </Badge>
                        {isManagerMode && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">{getLevelShortLabel(attendee.level)}</span>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {attendee.status === "attending" || attendee.status === "attended" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : attendee.status === "not_attending" ? (
                          <X className="h-3 w-3 text-red-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 참석 투표 및 팀편성 버튼 */}
                {schedule.status === "scheduled" && (
                  <div className="flex flex-col gap-3 pt-2">
                    {/* 참석 투표 */}
                    <AttendanceVoting 
                      schedule={schedule}
                      currentUser={currentUser}
                      isManagerMode={isManagerMode}
                      onAttendanceUpdate={fetchSchedules}
                    />
                    
                    {/* 총무 전용 팀편성 버튼 */}
                    {isManagerMode && (
                      <div className="flex justify-center">
                        <Button 
                          onClick={() => {
                            if (onSwitchToFormation) {
                              onSwitchToFormation()
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          팀편성하기
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
