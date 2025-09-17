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
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2, Timer, Coffee, Target } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

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
  
  const [newSchedule, setNewSchedule] = useState({
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

  useEffect(() => {
    fetchSchedules()
    fetchAvailableLocations()
  }, [])

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
    setSelectedDate(new Date(schedule.date))
    setIsEditingSchedule(true)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!currentUser?.id) {
      setError('삭제 권한이 없습니다.')
      return
    }

    try {
      const response = await fetch(`/api/schedule/delete?id=${scheduleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('일정 삭제 중 오류가 발생했습니다.')
      }

      await fetchSchedules()
    } catch (error) {
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
          schedules.map((schedule) => {
            const stats = getAttendanceStats(schedule.attendees)
            
            return (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 일정 기본 정보 */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold whitespace-pre-line">
                        {schedule.date} {schedule.time}
                      </h3>
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Badge className={getTypeColor(schedule.type)} variant="secondary">
                          {schedule.type === "internal" ? "자체경기" : schedule.type === "match" ? "A매치" : "연습"}
                        </Badge>
                        {isManagerMode && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2" 
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{schedule.location}</span>
                      </div>
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

                    {/* 총무 전용 삭제 버튼 */}
                    {isManagerMode && (
                      <div className="flex justify-center pt-2">
                        <Button 
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </Button>
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