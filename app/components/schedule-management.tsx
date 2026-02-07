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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2, Timer, Coffee, Target, UserPlus, UsersRound, Share2 } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn, generateKakaoShareText } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import ScheduleCard from "./schedule-card"
import { MatchResultDialog } from "./match-result-dialog"
import { AttendanceVoting } from "./attendance-voting"
import { TeamFormation } from "./team-formation"

interface ScheduleManagementProps {
  isManagerMode: boolean
  currentUser?: any
  viewMode?: 'upcoming' | 'past'  // 경기예정 또는 경기결과 모드
  isAddingSchedule?: boolean
  setIsAddingSchedule?: (value: boolean) => void
  isEditingSchedule?: boolean
  setIsEditingSchedule?: (value: boolean) => void
  editingScheduleId?: string | null
  setEditingScheduleId?: (id: string | null) => void
  resetScheduleForm?: () => void
}

export function ScheduleManagement({
  isManagerMode,
  currentUser,
  viewMode = 'upcoming',  // 기본값: 경기예정
  isAddingSchedule: externalIsAddingSchedule,
  setIsAddingSchedule: externalSetIsAddingSchedule,
  isEditingSchedule: externalIsEditingSchedule,
  setIsEditingSchedule: externalSetIsEditingSchedule,
  editingScheduleId: externalEditingScheduleId,
  setEditingScheduleId: externalSetEditingScheduleId,
  resetScheduleForm: externalResetScheduleForm
}: ScheduleManagementProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [internalIsAddingSchedule, setInternalIsAddingSchedule] = useState(false)
  const [internalIsEditingSchedule, setInternalIsEditingSchedule] = useState(false)
  const [internalEditingScheduleId, setInternalEditingScheduleId] = useState<string | null>(null)

  // 외부에서 전달된 상태가 있으면 사용, 없으면 내부 상태 사용
  const isAddingSchedule = externalIsAddingSchedule !== undefined ? externalIsAddingSchedule : internalIsAddingSchedule
  const setIsAddingSchedule = externalSetIsAddingSchedule || setInternalIsAddingSchedule
  const isEditingSchedule = externalIsEditingSchedule !== undefined ? externalIsEditingSchedule : internalIsEditingSchedule
  const setIsEditingSchedule = externalSetIsEditingSchedule || setInternalIsEditingSchedule
  const editingScheduleId = externalEditingScheduleId !== undefined ? externalEditingScheduleId : internalEditingScheduleId
  const setEditingScheduleId = externalSetEditingScheduleId || setInternalEditingScheduleId
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableLocations, setAvailableLocations] = useState<any[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false)
  const [resultEditingSchedule, setResultEditingSchedule] = useState<any>(null)

  // 일정별 업데이트 상태 관리
  const [updatingSchedules, setUpdatingSchedules] = useState<Set<string>>(new Set())

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

  // 참석 통계 계산 함수
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

  // 단일 일정만 새로고침 (전체 리로드 방지)
  const refreshSchedule = async (scheduleId: string) => {
    try {
      // 해당 일정만 가져오는 API가 없으므로 전체 목록에서 필터링하거나, 
      // 목록 API가 가벼우면 그냥 써도 되지만, 최적화를 위해 attendance API 결과를 활용할 수도 있음.
      // 하지만 가장 확실한 건 전체 리로드보다 해당 일정의 데이터만 업데이트하는 것.
      // 현재 구조상 전체 list를 부르는게 낫지만, 사용자 요청은 '해당 카드만'임.
      // -> list API를 다시 부르되, UI 깜빡임 없이 state만 교체하는 방식이 가장 안전함.
      // 혹은 /api/schedule/attendance 결과로 stats를 업데이트.

      // 여기서는 전체를 불러오되 로딩 상태를 보여주지 않는 백그라운드 갱신 방식을 사용하거나
      // AttendanceVoting에서 받은 최신 데이터를 이용해야 함.

      // 사용자 요청: "참석이나 불참을 눌렀을때 해당 카드만 리프레쉬"
      // -> AttendanceVoting에서 투표 후 onVoteUpdate를 호출함.
      // -> 여기서 전체 fetchSchedules를 호출하면 모든 카드가 깜빡일 수 있음.
      // -> fetchSchedules 내부에서 isLoading을 false로 유지하면 깜빡임은 없음. (현재 setIsLoading(true)가 있음)

      // 해결책: isLoading 없이 데이터만 갱신하는 fetchSchedulesBackground 함수 추가 또는 fetchSchedules 수정.
      await fetchSchedulesSilently()
    } catch (error) {
      console.error("일정 갱신 실패", error)
    }
  }

  const fetchSchedulesSilently = async () => {
    try {
      // 로딩 상태 변경 없이 데이터만 갱신
      const response = await fetch('/api/schedule/list')
      const result = await response.json()
      if (response.ok) {
        setSchedules(result.schedules)
      } else {
        console.error(result.error || '일정 목록을 가져올 수 없습니다.')
      }
    } catch (error) {
      console.error('일정 목록 조회 중 오류가 발생했습니다.', error)
    }
  }

  // 단일 일정 로컬 상태 업데이트 (리프레시 없이 UI 갱신)
  const handleScheduleStateUpdate = (updatedScheduleId: string, newData: any) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(schedule =>
        schedule.id === updatedScheduleId
          ? { ...schedule, ...newData }
          : schedule
      )
    )
  }

  // 투표 업데이트 핸들러
  const handleVoteUpdate = () => {
    fetchSchedules()
  }

  // 참석 상태 업데이트 핸들러
  const handleAttendanceUpdate = (scheduleId: string) => {
    fetchSchedules()
  }

  // 참석 통계 업데이트 핸들러
  const handleAttendanceStatsUpdate = (scheduleId: string) => {
    fetchSchedules()
  }

  // 팀편성 리셋 핸들러
  const handleFormationReset = () => {
    fetchSchedules()
  }

  // 개별 일정의 게스트 허용 상태 업데이트 함수
  const updateScheduleGuestStatus = async (scheduleId: string) => {
    startScheduleUpdate(scheduleId)
    try {
      const response = await fetch(`/api/schedule/list`)
      const result = await response.json()

      if (response.ok) {
        // 해당 일정의 게스트 허용 상태만 업데이트
        setSchedules(prevSchedules =>
          prevSchedules.map(schedule =>
            schedule.id === scheduleId
              ? { ...schedule, allowGuests: result.schedules.find((s: any) => s.id === scheduleId)?.allowGuests || false }
              : schedule
          )
        )
        console.log('게스트 허용 상태 업데이트 완료:', scheduleId)
      }
    } catch (error) {
      console.error('게스트 허용 상태 업데이트 오류:', error)
    } finally {
      endScheduleUpdate(scheduleId)
    }
  }

  // 일정 업데이트 상태 관리 함수들
  const startScheduleUpdate = (scheduleId: string) => {
    setUpdatingSchedules(prev => new Set([...prev, scheduleId]))
  }

  const endScheduleUpdate = (scheduleId: string) => {
    setUpdatingSchedules(prev => {
      const newSet = new Set(prev)
      newSet.delete(scheduleId)
      return newSet
    })
  }

  const isScheduleUpdating = (scheduleId: string) => {
    return updatingSchedules.has(scheduleId)
  }

  // 스켈레톤 컴포넌트
  const ScheduleSkeleton = () => (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span className="text-sm font-medium">업데이트 중...</span>
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "internal": return "bg-green-100 text-green-800"
      case "match": return "bg-red-100 text-red-800"
      case "training": return "bg-blue-100 text-blue-800"
      case "futsal": return "bg-orange-100 text-orange-800"
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
    return `${location}\n${time}`
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
    try {
      const [year, month, day] = schedule.date.split('-')
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day))
      if (!isNaN(dateObj.getTime())) {
        setSelectedDate(dateObj)
      } else {
        console.error('유효하지 않은 날짜:', schedule.date)
        setSelectedDate(undefined)
      }
    } catch (error) {
      console.error('날짜 파싱 오류:', schedule.date, error)
      setSelectedDate(undefined)
    }
    setIsEditingSchedule(true)
  }

  const handleOpenResultDialog = (schedule: any) => {
    setResultEditingSchedule(schedule)
    setIsResultDialogOpen(true)
  }

  const handleResultSuccess = () => {
    fetchSchedules()
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


  // 다음 일정 찾기 (가장 가까운 미래 일정 - 시작 시간 기준)
  const getNextUpcomingSchedule = () => {
    const now = new Date()
    const upcomingSchedules = schedules
      .filter(schedule => {
        // 날짜와 시간을 함께 사용하여 경기 시작시간 계산
        const [year, month, day] = schedule.date.split('-')
        const [hours, minutes] = (schedule.time || '23:59').split(':')
        const scheduleDateTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
        // 시작 시간이 지나지 않은 경기만 표시
        return scheduleDateTime > now && schedule.status === 'scheduled'
      })
      .sort((a, b) => {
        // 날짜와 시간을 함께 비교
        const [yearA, monthA, dayA] = a.date.split('-')
        const [hoursA, minutesA] = (a.time || '23:59').split(':')
        const dateTimeA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA), Number(hoursA), Number(minutesA))

        const [yearB, monthB, dayB] = b.date.split('-')
        const [hoursB, minutesB] = (b.time || '23:59').split(':')
        const dateTimeB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB), Number(hoursB), Number(minutesB))

        return dateTimeA.getTime() - dateTimeB.getTime()
      })

    return upcomingSchedules[0] || null
  }

  const nextUpcomingSchedule = getNextUpcomingSchedule()

  // viewMode에 따라 표시할 스케줄 필터링 (경기 시간 기준)
  const filteredSchedules = schedules.filter(schedule => {
    const [year, month, day] = schedule.date.split('-')
    const [hours, minutes] = (schedule.time || '23:59').split(':')
    const matchDateTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))
    const now = new Date()

    if (viewMode === 'past') {
      // 경기 시간이 지난 경기
      return matchDateTime <= now
    } else {
      // 경기 시간이 지나지 않은 경기 (upcoming)
      // 다음 일정은 상단에 표시되므로 목록에서 제외
      if (nextUpcomingSchedule && schedule.id === nextUpcomingSchedule.id) {
        return false
      }
      return matchDateTime > now
    }
  }).sort((a, b) => {
    const [yearA, monthA, dayA] = a.date.split('-')
    const [yearB, monthB, dayB] = b.date.split('-')
    const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA))
    const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB))

    if (viewMode === 'past') {
      // 경기결과: 최신순 (내림차순)
      return dateB.getTime() - dateA.getTime()
    } else {
      // 경기예정: 가까운 순 (오름차순)
      return dateA.getTime() - dateB.getTime()
    }
  })

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

  const getPositionColor = (position: string) => {
    switch (position) {
      case "GK": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "CB": case "RB": case "LB": case "LRB": case "LRCB": return "bg-blue-100 text-blue-800 border-blue-300"
      case "CM": case "CAM": case "CDM": return "bg-green-100 text-green-800 border-green-300"
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

  // resetScheduleForm 함수
  const resetScheduleForm = externalResetScheduleForm || (() => {
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
    setIsEditingSchedule(false)
    setEditingScheduleId(null)
    setIsAddingSchedule(false)
  })

  return (
    <div className="space-y-6">
      {/* 일정 추가/수정 다이얼로그 */}
      {isManagerMode && (
        <Dialog open={isAddingSchedule || isEditingSchedule} onOpenChange={(open) => {
          if (!open) resetScheduleForm()
          else setIsAddingSchedule(true)
        }}>
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
                      <SelectItem value="futsal">풋살</SelectItem>
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
                      {(() => {
                        try {
                          return selectedDate && !isNaN(selectedDate.getTime())
                            ? format(selectedDate, "yyyy년 MM월 dd일 (EEE)", { locale: ko })
                            : "날짜를 선택하세요"
                        } catch (error) {
                          console.error('날짜 포맷 오류:', error)
                          return "날짜를 선택하세요"
                        }
                      })()}
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

              {(selectedDate && !isNaN(selectedDate.getTime()) || newSchedule.time || newSchedule.location) && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <h4 className="font-medium text-blue-800">일정 요약</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">
                        {newSchedule.type === "internal" ? "자체경기" :
                          newSchedule.type === "match" ? `vs ${newSchedule.opponentTeam || "상대팀"}` :
                        newSchedule.type === "futsal" ? "풋살" :
                            `연습 - ${newSchedule.trainingContent || "연습내용"}`}
                      </span>
                    </div>
                    {(() => {
                      try {
                        return selectedDate && !isNaN(selectedDate.getTime()) && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {format(selectedDate, "yyyy년 MM월 dd일 (EEE)", { locale: ko })}
                          </div>
                        )
                      } catch (error) {
                        console.error('날짜 포맷 오류:', error)
                        return null
                      }
                    })()}
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
                  isNaN(selectedDate.getTime()) ||
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

      {/* 일정 추가 버튼 (총무만, 경기예정 탭에서만) */}
      {isManagerMode && viewMode === 'upcoming' && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsAddingSchedule(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            일정 추가
          </Button>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 다음 일정 (경기예정 모드에서만 표시) */}
      {viewMode === 'upcoming' && nextUpcomingSchedule && (
        <div className="space-y-2">
          {/* <h3 className="text-lg font-semibold">다음 일정</h3> */}
          <Card className="border-l-4 border-l-blue-500">
            {/* <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                다음 경기 정보
                </CardTitle>
            </CardHeader> */}
            {isScheduleUpdating(nextUpcomingSchedule.id) ? (
              <ScheduleSkeleton />
            ) : (
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* D-Day 표시와 액션 버튼 */}
                  <div className="flex items-center justify-center gap-3">
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
                    <h3 className="text-xl font-bold">
                      {(() => {
                        // 한국시간으로 저장된 날짜를 그대로 표시
                        const [year, month, day] = nextUpcomingSchedule.date.split('-')
                        const date = new Date(Number(year), Number(month) - 1, Number(day))
                        return date.toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })
                      })()} <span >{nextUpcomingSchedule.time}</span>
                    </h3>
                    <h3 className="flex gap-2 items-center justify-center text-xl font-bold">
                      <MapPin className="h-4 w-4" />
                      {nextUpcomingSchedule.location}
                    </h3>
                    <h3 className="flex gap-2 items-center justify-center text-xl font-bold">
                      <div className="text-red-600 text-muted-foreground">집합 {nextUpcomingSchedule.gatherTime}</div>
                    </h3>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(nextUpcomingSchedule.type)} variant="secondary">
                        {nextUpcomingSchedule.type === "internal" ? "자체경기" : nextUpcomingSchedule.type === "match" ? `A매치${nextUpcomingSchedule.opponentTeam ? ` vs ${nextUpcomingSchedule.opponentTeam}` : ''}` : nextUpcomingSchedule.type === "futsal" ? "풋살" : "연습"}
                      </Badge>
                      {nextUpcomingSchedule.allowGuests && nextUpcomingSchedule.type === "internal" && (
                        <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                          게스트허용
                        </Badge>
                      )}
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

                  {/* 설명 */}
                  {nextUpcomingSchedule.description && (
                    <p className="text-sm text-muted-foreground text-center">{nextUpcomingSchedule.description}</p>
                  )}

                  {/* 참석 투표 섹션 (지난 일정이 아니고 사용자가 로그인한 경우) */}
                  {(() => {
                    const daysLeft = calculateDaysLeft(nextUpcomingSchedule.date)
                    const isPastSchedule = daysLeft < 0
                    return !isPastSchedule && currentUser?.id && (
                      <div className="pt-4 border-t">
                        <AttendanceVoting
                          scheduleId={nextUpcomingSchedule.id}
                          currentUserId={currentUser.id}
                          isPastSchedule={isPastSchedule}
                          allowGuests={nextUpcomingSchedule.allowGuests}
                          hasTeamFormation={!!nextUpcomingSchedule.teamFormation}
                          formationConfirmed={nextUpcomingSchedule.formationConfirmed}
                          isManagerMode={isManagerMode}
                          onVoteUpdate={() => refreshSchedule(nextUpcomingSchedule.id)}
                          initialAttendees={nextUpcomingSchedule.attendees?.map((att: any) => ({
                            userId: att.userId,
                            name: att.name,
                            status: att.status,
                            position: att.position,
                            subPositions: att.subPositions,
                            profileImage: att.profileImage || null,
                            isGuest: att.isGuest || false,
                            invitedBy: att.invitedBy
                          }))}
                          initialStats={getAttendanceStats(nextUpcomingSchedule.attendees)}
                        />
                      </div>
                    )
                  })()}

                  {/* 액션 버튼들 */}
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2 flex-wrap">
                      {/* 게스트 허용 버튼 (총무 전용) */}
                      {isManagerMode && nextUpcomingSchedule.type === "internal" && (
                        <Button
                          onClick={async () => {
                            startScheduleUpdate(nextUpcomingSchedule.id)
                            try {
                              const response = await fetch('/api/schedule/toggle-guests', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  scheduleId: nextUpcomingSchedule.id,
                                  userId: currentUser?.id,
                                  allowGuests: !nextUpcomingSchedule.allowGuests
                                })
                              })

                              if (response.ok) {
                                // 해당 일정의 게스트 허용 상태만 업데이트 (전체 페이지 리로딩 방지)
                                await updateScheduleGuestStatus(nextUpcomingSchedule.id)
                              }
                            } catch (error) {
                              console.error('게스트 허용 상태 변경 중 오류:', error)
                            } finally {
                              endScheduleUpdate(nextUpcomingSchedule.id)
                            }
                          }}
                          disabled={isScheduleUpdating(nextUpcomingSchedule.id)}
                          variant={nextUpcomingSchedule.allowGuests ? "destructive" : "outline"}
                          size="sm"
                          className={`flex-1 ${nextUpcomingSchedule.allowGuests ? "" : "bg-yellow-400"}`}
                        >
                          {isScheduleUpdating(nextUpcomingSchedule.id)
                            ? "업데이트 중..."
                            : nextUpcomingSchedule.allowGuests ? "게스트 중단" : "게스트 허용"
                          }
                        </Button>
                      )}

                      {/* 공유 버튼 추가 */}
                      {isManagerMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                          onClick={async () => {
                            const text = generateKakaoShareText(nextUpcomingSchedule, isManagerMode)
                            try {
                              await navigator.clipboard.writeText(text)
                              alert("경기 정보가 클립보드에 복사되었습니다.\n카카오톡 채팅창에 붙여넣기(Ctrl+V) 하세요.")
                            } catch (err) {
                              console.error('클립보드 복사 실패:', err)
                              prompt("아래 텍스트를 복사하세요:", text)
                            }
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          공유
                        </Button>
                      )}

                      {/* 자동 팀편성 버튼 (총무 전용, 내부 경기 또는 풋살만) */}
                      {isManagerMode && (nextUpcomingSchedule.type === "internal" || nextUpcomingSchedule.type === "futsal") && (() => {
                        const [year, month, day] = nextUpcomingSchedule.date.split('-')
                        const targetDate = new Date(Number(year), Number(month) - 1, Number(day))
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const diffTime = targetDate.getTime() - today.getTime()
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                        const attendingCount = nextUpcomingSchedule.attendances?.filter((a: any) => a.status === 'ATTENDING').length || 0
                        const minMembers = nextUpcomingSchedule.type === "futsal" ? 4 : 10
                        const isEnoughMembers = attendingCount >= minMembers
                        const isTimeReady = daysLeft <= 2
                        const isEnabled = isEnoughMembers && isTimeReady && !isScheduleUpdating(nextUpcomingSchedule.id)

                        return (
                          <Button
                            onClick={async () => {
                              let teamCount = 2
                              if (nextUpcomingSchedule.type === "futsal") {
                                const userInput = window.prompt("팀 수를 입력하세요 (2 또는 3)", "3")
                                if (userInput === null) return
                                teamCount = parseInt(userInput)
                                if (isNaN(teamCount) || (teamCount !== 2 && teamCount !== 3)) {
                                  alert("2 또는 3을 입력해야 합니다.")
                                  return
                                }
                              } else {
                                if (!confirm('자동 팀편성을 실행하시겠습니까?')) return
                              }

                              startScheduleUpdate(nextUpcomingSchedule.id)
                              try {
                                const response = await fetch('/api/schedule/team-formation', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    scheduleId: nextUpcomingSchedule.id,
                                    userId: currentUser?.id,
                                    teamCount: teamCount
                                  })
                                })

                                if (!response.ok) {
                                  const errorText = await response.text()
                                  console.error('팀편성 API 오류:', errorText)
                                  throw new Error('팀편성 API 호출 실패')
                                }

                                const result = await response.json()

                                if (result.success) {
                                  alert('팀편성이 완료되었습니다.')
                                  fetchSchedules()
                                } else {
                                  alert(result.error || '팀편성 중 오류가 발생했습니다.')
                                }
                              } catch (error) {
                                console.error('팀편성 처리 중 오류:', error)
                                alert('팀편성 처리 중 오류가 발생했습니다.')
                              } finally {
                                endScheduleUpdate(nextUpcomingSchedule.id)
                              }
                            }}
                            disabled={!isEnabled}
                            variant="default"
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                          >
                            <UsersRound className="h-4 w-4 mr-1" />
                            {isScheduleUpdating(nextUpcomingSchedule.id) ? "처리 중..." :
                              !isEnoughMembers ? `팀편성 (${attendingCount}/10명)` :
                                !isTimeReady ? `팀편성 (D-${daysLeft})` :
                                  "자동 팀편성"
                            }
                          </Button>
                        )
                      })()}
                    </div>
                  </div>

                  {/* 팀편성 결과 표시 - 확정 전에는 총무만 조회 가능 */}
                  {nextUpcomingSchedule.teamFormation && (isManagerMode || nextUpcomingSchedule.formationConfirmed) && (
                    <div className="pt-4 border-t">
                      <TeamFormation
                        scheduleId={nextUpcomingSchedule.id}
                        teamFormation={nextUpcomingSchedule.teamFormation}
                        formationDate={nextUpcomingSchedule.formationDate}
                        formationConfirmed={nextUpcomingSchedule.formationConfirmed}
                        isManagerMode={isManagerMode}
                        currentUserId={currentUser?.id || ''}
                        onFormationUpdate={fetchSchedules}
                        onFormationDelete={fetchSchedules}
                        onFormationConfirm={fetchSchedules}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* 일정 목록 - viewMode에 따라 표시 */}
      <div className="space-y-6">
        {viewMode === 'upcoming' ? (
          /* 경기예정 모드 */
          <div className="space-y-4">
            {filteredSchedules.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-muted-foreground">예정된 경기가 없습니다.</div>
                    {isManagerMode && (
                      <Button onClick={() => setIsAddingSchedule(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        새 일정 등록하기
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  compact={true}
                  schedule={schedule}
                  currentUser={currentUser}
                  isManagerMode={isManagerMode}
                  isUpdating={isScheduleUpdating(schedule.id)}
                  onAttendanceUpdate={handleAttendanceUpdate}
                  onAttendanceStatsUpdate={handleAttendanceStatsUpdate}
                  onFormationReset={handleFormationReset}
                  onGuestStatusUpdate={updateScheduleGuestStatus}
                  onDeleteSchedule={handleDeleteSchedule}
                  onEditSchedule={handleEditSchedule}
                  onVoteUpdate={handleVoteUpdate}
                  onEnterResult={handleOpenResultDialog}
                />
              ))
            )}
          </div>
        ) : (
          /* 경기결과 모드 */
          <div className="space-y-4">
            {filteredSchedules.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-muted-foreground">지난 경기가 없습니다.</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  currentUser={currentUser}
                  isManagerMode={isManagerMode}
                  isUpdating={isScheduleUpdating(schedule.id)}
                  onAttendanceUpdate={handleAttendanceUpdate}
                  onAttendanceStatsUpdate={handleAttendanceStatsUpdate}
                  onFormationReset={handleFormationReset}
                  onGuestStatusUpdate={updateScheduleGuestStatus}
                  onDeleteSchedule={handleDeleteSchedule}
                  onEditSchedule={handleEditSchedule}
                  onVoteUpdate={handleVoteUpdate}
                  onEnterResult={handleOpenResultDialog}
                />
              ))
            )}
          </div>
        )}
      </div>
      <MatchResultDialog
        isOpen={isResultDialogOpen}
        onClose={() => setIsResultDialogOpen(false)}
        schedule={resultEditingSchedule}
        onSuccess={handleResultSuccess}
      />
    </div >
  )
}