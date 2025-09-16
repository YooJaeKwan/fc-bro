"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { CalendarIcon, Clock, MapPin, Users, Plus, Check, X, AlertCircle, Timer, Coffee, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AttendanceVoting } from "./attendance-voting"

// 자주 사용하는 장소 목록 추가
const popularLocations = [
  "잠실종합운동장 보조구장",
  "한강공원 축구장",
  "올림픽공원 축구장",
  "월드컵공원 축구장",
  "탄천종합운동장",
  "서울숲 축구장",
  "뚝섬한강공원 축구장",
  "반포한강공원 축구장",
  "여의도한강공원 축구장",
  "상암월드컵경기장 보조구장",
  "송파구민체육센터",
  "강남구민체육센터",
]

interface ScheduleManagementProps {
  isManagerMode: boolean
  currentUser?: any
}

export function ScheduleManagement({ isManagerMode, currentUser }: ScheduleManagementProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    type: "internal",
    date: "",
    time: "",
    gatherTime: "",
    location: "",
    quarterTime: 20,
    restTime: 10,
    description: "",
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

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
      const scheduleData = {
        title: newSchedule.title,
        type: newSchedule.type,
        date: newSchedule.date,
        time: newSchedule.time,
        gatherTime: newSchedule.gatherTime,
        location: newSchedule.location,
        quarterTime: newSchedule.quarterTime,
        restTime: newSchedule.restTime,
        description: newSchedule.description,
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
      
      // 폼 초기화
      setNewSchedule({
        title: "",
        type: "internal",
        date: "",
        time: "",
        gatherTime: "",
        location: "",
        quarterTime: 20,
        restTime: 10,
        description: "",
      })
      setSelectedDate(undefined)
      setIsAddingSchedule(false)

    } catch (error) {
      console.error('일정 등록 오류:', error)
      setError(error instanceof Error ? error.message : '일정 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
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
    switch (position) {
      case "골키퍼":
        return "bg-yellow-100 text-yellow-800"
      case "수비수":
        return "bg-blue-100 text-blue-800"
      case "미드필더":
        return "bg-green-100 text-green-800"
      case "공격수":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">일정 관리</h2>
            <p className="text-muted-foreground">일정 정보를 불러오는 중...</p>
          </div>
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">일정 관리</h2>
            <p className="text-muted-foreground">팀 일정을 확인하세요</p>
          </div>
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">일정 관리</h2>
          <p className="text-muted-foreground">
            {isManagerMode ? "팀 일정을 등록하고 관리하세요" : "팀 일정을 확인하세요"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            총 {schedules.length}개의 일정
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSchedules} variant="outline">
            새로고침
          </Button>
          {isManagerMode && (
          <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                일정 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 일정 추가</DialogTitle>
                <DialogDescription>새로운 팀 일정을 등록하세요</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    placeholder="일정 제목을 입력하세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">유형 *</Label>
                  {/* 일정 유형 선택 옵션 변경 */}
                  <Select
                    value={newSchedule.type}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, type: value })}
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
                        <SelectValue placeholder="자주 사용하는 장소에서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted">
                          자주 사용하는 장소
                        </div>
                        {popularLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {location}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 직접 입력 */}
                    <div className="relative">
                      <Input
                        value={newSchedule.location}
                        onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                        placeholder="또는 직접 입력하세요"
                      />
                      {newSchedule.location && !popularLocations.includes(newSchedule.location) && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Badge variant="outline" className="text-xs">
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
                <Button variant="outline" onClick={() => setIsAddingSchedule(false)}>
                  취소
                </Button>
                <Button
                  onClick={handleScheduleSubmit}
                  disabled={!newSchedule.title || !selectedDate || !newSchedule.time || !newSchedule.location || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>등록 중...</span>
                    </div>
                  ) : (
                    '등록'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
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
          schedules.map((schedule) => {
          const stats = getAttendanceStats(schedule.attendees)

          return (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg leading-tight">{schedule.title}</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                      <Badge className={getTypeColor(schedule.type)} variant="secondary">
                        {schedule.type === "internal" ? "자체경기" : schedule.type === "match" ? "A매치" : "연습"}
                      </Badge>
                      <Badge className={getStatusColor(schedule.status)} variant="outline">
                        {schedule.status === "scheduled" ? "예정" : "완료"}
                      </Badge>
                    </div>
                  </div>

                  {/* 모바일에서는 세로 스택, 데스크톱에서는 그리드 */}
                  <div className="space-y-2 sm:space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{schedule.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>시작: {schedule.time}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>집합: {schedule.gatherTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{schedule.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{schedule.description}</p>

                {/* 참석 현황 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">참석 현황</span>
                    </div>
                    <Badge variant="secondary">
                      {stats.attending}/{stats.total} ({stats.percentage}%)
                    </Badge>
                  </div>
                  <Progress value={stats.percentage} className="h-2" />

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
                            <span className="text-xs text-muted-foreground flex-shrink-0">{attendee.rating}</span>
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
                </div>

                {/* 참석 투표 컴포넌트 */}
                {schedule.status === "scheduled" && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <AttendanceVoting 
                      schedule={schedule}
                      currentUser={currentUser}
                      isManagerMode={isManagerMode}
                      onAttendanceUpdate={fetchSchedules}
                    />
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
