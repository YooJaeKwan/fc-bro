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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2, Timer, Coffee, Target } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AttendanceVoting } from "./attendance-voting"

interface ScheduleManagementProps {
  isManagerMode: boolean
  currentUser?: any
}

export function ScheduleManagement({ isManagerMode, currentUser }: ScheduleManagementProps) {
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
    quarterTime: 25,
    restTime: 5,
    description: "",
    opponentTeam: "",
    trainingContent: "",
  })

  useEffect(() => {
    fetchSchedules()
    fetchAvailableLocations()
  }, [])

  // 페이지 로드 시 저장된 팀편성 결과 확인
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
      const response = await fetch('/api/schedule/list')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '일정 목록을 가져올 수 없습니다.')
      }

      setSchedules(result.schedules)
      setError("")
    } catch (error) {
      setError(error instanceof Error ? error.message : '일정 목록 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableLocations = async () => {
    try {
      setIsLoadingLocations(true)
      const response = await fetch('/api/schedule/locations')
      
      if (response.ok) {
        const result = await response.json()
        setAvailableLocations(result.locations || [])
      }
    } catch (error) {
      console.error('장소 목록 조회 오류:', error)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const getAttendanceStats = (attendees: any[]) => {
    const attending = attendees.filter((a) => a.status === "attending" || a.status === "attended").length
    const total = attendees.length
    return { attending, total, percentage: Math.round((attending / total) * 100) }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "internal": return "bg-green-100 text-green-800"
      case "match": return "bg-red-100 text-red-800"
      case "training": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 6; hour <= 23; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`)
      if (hour < 23) {
        times.push(`${hour.toString().padStart(2, "0")}:30`)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

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

  const handleStartTimeChange = (time: string) => {
    const calculatedGatherTime = calculateGatherTime(time)
    setNewSchedule({
      ...newSchedule,
      time,
      gatherTime: calculatedGatherTime,
    })
  }

  const generateAutoTitle = (location: string, time: string) => {
    return `${location}\\n${time}`
  }

  const handleScheduleSubmit = async () => {
    if (!currentUser?.id) {
      setError('로그인이 필요합니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const autoTitle = generateAutoTitle(newSchedule.location, newSchedule.time)

      // 선택된 날짜를 정확하게 포맷팅 (한국시간 기준)
      const finalDate = selectedDate ? 
        `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}` 
        : newSchedule.date

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
      console.log('선택된 날짜 객체:', selectedDate)
      console.log('최종 전송 날짜:', finalDate)
      console.log('선택된 날짜의 요일:', selectedDate?.toLocaleDateString('ko-KR', { weekday: 'long' }))

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

      await fetchSchedules()
      fetchAvailableLocations()
      resetScheduleForm()

    } catch (error) {
      setError(error instanceof Error ? error.message : '일정 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
      console.log('선택된 날짜 객체:', selectedDate)
      console.log('선택된 날짜의 요일:', selectedDate?.toLocaleDateString('ko-KR', { weekday: 'long' }))

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

      await fetchSchedules()
      resetScheduleForm()

    } catch (error) {
      setError(error instanceof Error ? error.message : '일정 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
    // 한국시간으로 저장된 날짜를 그대로 Calendar에 설정
    const [year, month, day] = schedule.date.split('-')
    setSelectedDate(new Date(Number(year), Number(month) - 1, Number(day)))
    setIsEditingSchedule(true)
  }

  const handleDeleteSchedule = async (scheduleId: string, scheduleTitle?: string) => {
    if (!currentUser?.id) {
      setError('삭제 권한이 없습니다.')
      return
    }

    // 삭제 확인
    const isConfirmed = window.confirm(
      `정말로 이 일정을 삭제하시겠습니까?\n\n${scheduleTitle || '선택한 일정'}\n\n⚠️ 삭제된 일정은 복구할 수 없습니다.`
    )

    if (!isConfirmed) {
      return
    }

    try {
      console.log('일정 삭제 요청:', scheduleId)
      
      const response = await fetch('/api/schedule/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scheduleId,
          userId: currentUser.id 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '일정 삭제 중 오류가 발생했습니다.')
      }

      console.log('일정 삭제 성공:', result)
      await fetchSchedules()
      setError("")
      
    } catch (error) {
      console.error('일정 삭제 오류:', error)
      setError(error instanceof Error ? error.message : '일정 삭제 중 오류가 발생했습니다.')
    }
  }

  const resetScheduleForm = () => {
    setNewSchedule({
      type: "internal",
      date: "",
      time: "",
      gatherTime: "",
      location: "",
      quarterTime: 25,
      restTime: 5,
      description: "",
      opponentTeam: "",
      trainingContent: "",
    })
    setSelectedDate(undefined)
    setIsAddingSchedule(false)
    setIsEditingSchedule(false)
    setEditingScheduleId(null)
  }

  // 다음 일정 찾기 (가장 가까운 미래 일정)
  const getNextUpcomingSchedule = () => {
    const now = new Date()
    const upcomingSchedules = schedules
      .filter(schedule => {
        // 한국시간으로 저장된 날짜를 그대로 사용
        const [year, month, day] = schedule.date.split('-')
        const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day))
        return scheduleDate >= now && schedule.status === 'scheduled'
      })
      .sort((a, b) => {
        // 한국시간으로 저장된 날짜를 그대로 비교
        const [yearA, monthA, dayA] = a.date.split('-')
        const [yearB, monthB, dayB] = b.date.split('-')
        const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA))
        const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB))
        return dateA.getTime() - dateB.getTime()
      })
    
    return upcomingSchedules[0] || null
  }

  const nextUpcomingSchedule = getNextUpcomingSchedule()

  const calculateDaysLeft = (scheduleDate: string) => {
    // 한국시간 기준으로 D-Day 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [year, month, day] = scheduleDate.split('-')
    const matchDate = new Date(Number(year), Number(month) - 1, Number(day))
    matchDate.setHours(0, 0, 0, 0)
    
    const diffTime = matchDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // 쿼터 시간 계산 함수
  const calculateQuarters = (startTime: string, quarterTime: number, restTime: number) => {
    if (!startTime) return []

    const [hours, minutes] = startTime.split(":").map(Number)
    const startMinutes = hours * 60 + minutes
    
    const quarters = []
    let currentMinutes = startMinutes

    for (let i = 1; i <= 4; i++) {
      const quarterStart = currentMinutes
      const quarterEnd = quarterStart + quarterTime
      
      quarters.push({
        quarter: `${i}Q`,
        start: `${Math.floor(quarterStart / 60).toString().padStart(2, "0")}:${(quarterStart % 60).toString().padStart(2, "0")}`,
        end: `${Math.floor(quarterEnd / 60).toString().padStart(2, "0")}:${(quarterEnd % 60).toString().padStart(2, "0")}`
      })
      
      // 다음 쿼터 시작 시간 (쿼터 시간 + 휴식 시간)
      currentMinutes = quarterEnd + (i < 4 ? restTime : 0)
    }

    return quarters
  }

  // 자동 팀편성 알고리즘 (대시보드와 동일)
  const autoFormTeams = (schedule: any) => {
    const attendingPlayers = schedule.attendees.filter((attendee: any) => 
      attendee.status === 'attending' || attendee.status === 'attended'
    )
    
    if (attendingPlayers.length < 6) {
      return { yellowTeam: [], blueTeam: [], message: '팀편성에는 최소 6명이 필요합니다.' }
    }

    const players = [...attendingPlayers]
    const playersPerTeam = Math.floor(players.length / 2)
    const hasExtraPlayer = players.length % 2 === 1

    const yellowTeam = []
    const blueTeam = []

    players.forEach((player, index) => {
      const yellowMaxSize = hasExtraPlayer ? playersPerTeam + 1 : playersPerTeam
      
      if (index % 2 === 0 && yellowTeam.length < yellowMaxSize) {
        yellowTeam.push(player)
      } else if (blueTeam.length < playersPerTeam) {
        blueTeam.push(player)
      } else if (yellowTeam.length < yellowMaxSize) {
        yellowTeam.push(player)
      }
    })

    const result = {
      yellowTeam,
      blueTeam,
      yellowAverage: yellowTeam.reduce((sum, p) => sum + (p.level || 1), 0) / yellowTeam.length,
      blueAverage: blueTeam.reduce((sum, p) => sum + (p.level || 1), 0) / blueTeam.length
    }

    return {
      ...result,
      levelDifference: Math.abs(result.yellowAverage - result.blueAverage).toFixed(1)
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case "GK": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "DC": case "DR": case "DL": case "DRL": case "DRLC": return "bg-blue-100 text-blue-800 border-blue-300"
      case "MC": case "AMC": case "DM": return "bg-green-100 text-green-800 border-green-300"
      case "ST": case "CF": case "SS": case "LWF": case "RWF": return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">일정 관리</h2>
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
                      opponentTeam: "",
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

                {newSchedule.type === "match" && (
                  <div className="space-y-2">
                    <Label htmlFor="opponentTeam">상대팀명 *</Label>
                    <Input
                      id="opponentTeam"
                      value={newSchedule.opponentTeam}
                      onChange={(e) => setNewSchedule({ ...newSchedule, opponentTeam: e.target.value })}
                      placeholder="상대팀 이름을 입력하세요"
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
                      placeholder="연습 내용을 입력하세요"
                    />
                  </div>
                )}

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
                          setIsDatePickerOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

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

                <div className="space-y-2">
                  <Label>장소 *</Label>
                  <div className="space-y-3">
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
                          availableLocations.map((location: any) => (
                            <SelectItem key={location.name} value={location.name}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span>{location.name}</span>
                                {location.count && (
                                  <Badge variant="secondary" className="text-xs ml-auto">
                                    {location.count}회
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <Input
                        value={newSchedule.location}
                        onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                        placeholder="또는 직접 입력하세요"
                      />
                      {newSchedule.location && 
                       !availableLocations.some((loc: any) => loc.name === newSchedule.location) && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                            신규
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                {(selectedDate || newSchedule.time || newSchedule.location) && (
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
                          집합: {newSchedule.gatherTime}
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

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 다음 일정 */}
      {nextUpcomingSchedule && (
        <div className="space-y-2">
          {/* <h3 className="text-lg font-semibold">다음 일정</h3> */}
          <Card className="border-l-4 border-l-blue-500">            
            {/* <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                다음 경기 정보
                </CardTitle>
            </CardHeader> */}
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* D-Day 표시와 액션 버튼 */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                    <CalendarIcon className="h-4 w-4" />
                    {(() => {
                      const daysLeft = calculateDaysLeft(nextUpcomingSchedule.date)
                      if (daysLeft === 0) return "오늘 경기!"
                      if (daysLeft === 1) return "내일 경기!"
                      if (daysLeft > 0) return `D-${daysLeft}`
                      return "지난 경기"
                    })()}
                  </div>
                </div>

                {/* 일정 기본 정보 */}
                <div className="text-center space-y-2">
                  <h3 className="flex items-center justify-center text-xl font-bold">
                    {nextUpcomingSchedule.location}
                  </h3>
                  <h3 className="text-xl font-bold">
                    <span>{nextUpcomingSchedule.time}</span>
                  </h3>
                </div>
                
                <div className="flex items-center justify-center">                    
                    <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(nextUpcomingSchedule.type)} variant="secondary">
                        {nextUpcomingSchedule.type === "internal" ? "자체경기" : nextUpcomingSchedule.type === "match" ? "A매치" : "연습"}
                        </Badge>
                        {isManagerMode && (
                        <>
                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleEditSchedule(nextUpcomingSchedule)}
                            >
                            <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
                            onClick={() => handleDeleteSchedule(nextUpcomingSchedule.id, `${nextUpcomingSchedule.location} ${nextUpcomingSchedule.time}`)}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                        )}
                    </div>
                   </div>
                 {/* 경기 세부 정보 */}
                 <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                   <div className="flex items-center gap-3 text-sm">
                     <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                     <div className="flex-1">
                       <div className="font-medium">
                         {(() => {
                           // 한국시간으로 저장된 날짜를 그대로 표시
                           const [year, month, day] = nextUpcomingSchedule.date.split('-')
                           const date = new Date(Number(year), Number(month) - 1, Number(day))
                           return new Intl.DateTimeFormat('ko-KR', {
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric',
                             weekday: 'short'
                           }).format(date)
                         })()}
                       </div>
                       <div className="text-muted-foreground">집합: {nextUpcomingSchedule.gatherTime}</div>
                     </div>
                   </div>
                   
                   {/* 쿼터 시간 표시 */}
                   {nextUpcomingSchedule.quarterTime && (
                     <div className="space-y-2">
                       <div className="text-xs font-medium text-gray-600 text-left">경기 진행 시간</div>
                       <div className="bg-white rounded border p-2">
                         <div className="grid grid-cols-4 gap-0 text-xs font-mono">
                           {calculateQuarters(
                             nextUpcomingSchedule.time, 
                             nextUpcomingSchedule.quarterTime || 25, 
                             nextUpcomingSchedule.restTime || 5
                           ).map((quarter) => (
                             <div key={quarter.quarter} className="text-center p-1">
                               <div className="font-semibold text-blue-600 mb-1">{quarter.quarter}</div>
                               <div className="text-xs text-muted-foreground whitespace-nowrap">
                                 {quarter.start}
                               </div>
                               <div className="text-xs text-muted-foreground">
                                 ~
                               </div>
                               <div className="text-xs text-muted-foreground whitespace-nowrap">
                                 {quarter.end}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>

                {/* 참석 현황 */}
                <div className="space-y-2">
                  {(() => {
                    const stats = getAttendanceStats(nextUpcomingSchedule.attendees)
                    return (
                      <>
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
                      </>
                    )
                  })()}
                </div>

                {/* 설명 */}
                {nextUpcomingSchedule.description && (
                  <p className="text-sm text-muted-foreground text-center">{nextUpcomingSchedule.description}</p>
                )}

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
                            const result = autoFormTeams(nextUpcomingSchedule)
                            if (result.message) {
                              setFormationResults({ ...result, scheduleId: nextUpcomingSchedule.id })
                            } else {
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
                                fetchSchedules()
                              } else {
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 팀편성 결과 표시 */}
      {formationResults && formationResults.scheduleId === nextUpcomingSchedule?.id && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">팀편성 결과</h3>
              {formationResults.message && (
                <p className="text-sm text-red-600">{formationResults.message}</p>
              )}
            </div>

            {!formationResults.message && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 노랑팀 */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <h4 className="font-medium text-base">노랑팀 ({formationResults.yellowTeam.length}명)</h4>
                    </div>
                    <div className="text-xs text-muted-foreground text-left pl-6">
                      골키퍼 {formationResults.yellowTeam.filter((p: any) => p.position === 'GK').length} | 
                      수비수 {formationResults.yellowTeam.filter((p: any) => ['DC', 'DR', 'DL', 'DRL', 'DRLC'].includes(p.position)).length} | 
                      미드필더 {formationResults.yellowTeam.filter((p: any) => ['MC', 'AMC', 'DM'].includes(p.position)).length} | 
                      공격수 {formationResults.yellowTeam.filter((p: any) => ['ST', 'CF', 'SS', 'LWF', 'RWF'].includes(p.position)).length}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formationResults.yellowTeam
                      .sort((a: any, b: any) => {
                        const getPositionOrder = (pos: string) => {
                          if (pos === 'GK') return 1
                          if (['DC', 'DR', 'DL', 'DRL', 'DRLC'].includes(pos)) return 2
                          if (['MC', 'AMC', 'DM'].includes(pos)) return 3
                          if (['ST', 'CF', 'SS', 'LWF', 'RWF'].includes(pos)) return 4
                          return 5
                        }
                        return getPositionOrder(a.position) - getPositionOrder(b.position)
                      })
                      .map((player: any) => (
                      <div key={player.userId || player.id} className="flex items-center gap-2 text-sm p-2 bg-yellow-50 rounded-lg">
                        <Avatar className="h-6 w-6">
                          {player.profileImage || player.image ? (
                            <img 
                              src={player.profileImage || player.image} 
                              alt={player.name}
                              className="h-full w-full object-cover rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          <Badge className={getPositionColor(player.position)} variant="outline" size="sm">
                            {player.position}
                          </Badge>
                          {player.subPositions && player.subPositions.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              + {player.subPositions.join(', ')}
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {(() => {
                            if (!player.level || player.level < 1 || player.level > 13) return '루키'
                            if (player.level === 1) return '루키'
                            if (player.level <= 4) return `B${player.level - 1}`
                            if (player.level <= 9) return `A${player.level - 4}`
                            if (player.level <= 12) return `SP${player.level - 9}`
                            return '프로'
                          })()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 파랑팀 */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <h4 className="font-medium text-base">파랑팀 ({formationResults.blueTeam.length}명)</h4>
                    </div>
                    <div className="text-xs text-muted-foreground text-left pl-6">
                      골키퍼 {formationResults.blueTeam.filter((p: any) => p.position === 'GK').length} | 
                      수비수 {formationResults.blueTeam.filter((p: any) => ['DC', 'DR', 'DL', 'DRL', 'DRLC'].includes(p.position)).length} | 
                      미드필더 {formationResults.blueTeam.filter((p: any) => ['MC', 'AMC', 'DM'].includes(p.position)).length} | 
                      공격수 {formationResults.blueTeam.filter((p: any) => ['ST', 'CF', 'SS', 'LWF', 'RWF'].includes(p.position)).length}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formationResults.blueTeam
                      .sort((a: any, b: any) => {
                        const getPositionOrder = (pos: string) => {
                          if (pos === 'GK') return 1
                          if (['DC', 'DR', 'DL', 'DRL', 'DRLC'].includes(pos)) return 2
                          if (['MC', 'AMC', 'DM'].includes(pos)) return 3
                          if (['ST', 'CF', 'SS', 'LWF', 'RWF'].includes(pos)) return 4
                          return 5
                        }
                        return getPositionOrder(a.position) - getPositionOrder(b.position)
                      })
                      .map((player: any) => (
                      <div key={player.userId || player.id} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded-lg">
                        <Avatar className="h-6 w-6">
                          {player.profileImage || player.image ? (
                            <img 
                              src={player.profileImage || player.image} 
                              alt={player.name}
                              className="h-full w-full object-cover rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          <Badge className={getPositionColor(player.position)} variant="outline" size="sm">
                            {player.position}
                          </Badge>
                          {player.subPositions && player.subPositions.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              + {player.subPositions.join(', ')}
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {(() => {
                            if (!player.level || player.level < 1 || player.level > 13) return '루키'
                            if (player.level === 1) return '루키'
                            if (player.level <= 4) return `B${player.level - 1}`
                            if (player.level <= 9) return `A${player.level - 4}`
                            if (player.level <= 12) return `SP${player.level - 9}`
                            return '프로'
                          })()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 팀편성 초기화 버튼 (총무 전용) */}
            {!formationResults.message && isManagerMode && (
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
                        fetchSchedules()
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

      {/* 전체 일정 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">전체 일정</h3>
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
            .filter(schedule => schedule.id !== nextUpcomingSchedule?.id) // 다음 일정 제외
            .map((schedule) => {
            const stats = getAttendanceStats(schedule.attendees)
            
            return (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 일정 기본 정보 */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {(() => {
                          // 한국시간으로 저장된 날짜를 그대로 표시
                          const [year, month, day] = schedule.date.split('-')
                          const date = new Date(Number(year), Number(month) - 1, Number(day))
                          return date.toLocaleDateString('ko-KR', { 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })
                        })()} <span className="text-blue-600">{schedule.time}</span>
                      </h3>
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Badge className={getTypeColor(schedule.type)} variant="secondary">
                          {schedule.type === "internal" ? "자체경기" : schedule.type === "match" ? "A매치" : "연습"}
                        </Badge>
                        {isManagerMode && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => handleDeleteSchedule(schedule.id, `${schedule.location} ${schedule.time}`)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                     <div className="items-center gap-4 text-sm text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <MapPin className="h-4 w-4" />
                         <span>{schedule.location}</span>
                       </div>
                       {schedule.gatherTime && (
                         <div className="flex items-center gap-1">
                           <Clock className="h-4 w-4" />
                           <span>집합: {schedule.gatherTime}</span>
                         </div>
                       )}
                     </div>

                    {/* 참석 현황 */}
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

                    {/* 설명 */}
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground text-center">{schedule.description}</p>
                    )}

                    {/* 참석 투표 */}
                    {schedule.status === "scheduled" && (
                      <div className="space-y-3 pt-2">
                        <AttendanceVoting 
                          schedule={schedule}
                          currentUser={currentUser}
                          isManagerMode={isManagerMode}
                          onAttendanceUpdate={fetchSchedules}
                        />
                        
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}