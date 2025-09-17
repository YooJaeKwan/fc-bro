"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Users, Check, X, Clock, RefreshCw, AlertCircle } from "lucide-react"

interface AttendanceVotingProps {
  schedule: any
  currentUser: any
  isManagerMode: boolean
  onAttendanceUpdate?: () => void
}

export function AttendanceVoting({ schedule, currentUser, isManagerMode, onAttendanceUpdate }: AttendanceVotingProps) {
  const [attendees, setAttendees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAttendees()
    }
  }, [isOpen, schedule.id])

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
      
      // 상위 컴포넌트에 알림 (일정 목록 새로고침용)
      onAttendanceUpdate?.()

    } catch (error) {
      console.error('참석 투표 오류:', error)
      setError(error instanceof Error ? error.message : '참석 투표 중 오류가 발생했습니다.')
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
        return <Check className="h-4 w-4 text-green-600" />
      case "not_attending":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "attending":
        return "참석"
      case "not_attending":
        return "불참"
      default:
        return "미정"
    }
  }

  // 현재 사용자의 투표 상태 확인
  const currentUserAttendance = attendees.find(a => a.userId === currentUser?.id)
  const currentUserStatus = currentUserAttendance?.status || 'pending'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          참석 여부 선택
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule.title} - 참석 투표</DialogTitle>
          <DialogDescription>
            {schedule.date} {schedule.time} | {schedule.location}
          </DialogDescription>
        </DialogHeader>

        {/* 에러 표시 */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 내 투표 상태 (선수 모드) */}
        {!isManagerMode && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">내 참석 여부</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Badge className={getStatusColor(currentUserStatus)} variant="secondary">
                  {getStatusIcon(currentUserStatus)}
                  <span className="ml-2">{getStatusLabel(currentUserStatus)}</span>
                </Badge>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => handleAttendanceVote('attending')}
                  disabled={isSubmitting}
                  variant={currentUserStatus === 'attending' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  참석
                </Button>
                <Button
                  onClick={() => handleAttendanceVote('not_attending')}
                  disabled={isSubmitting}
                  variant={currentUserStatus === 'not_attending' ? 'destructive' : 'outline'}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  불참
                </Button>
              </div>

              {isSubmitting && (
                <div className="text-center text-sm text-muted-foreground">
                  투표 처리 중...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* 참석자 현황 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">참석자 현황</span>
            </div>
            <Button
              onClick={fetchAttendees}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* 참석률 표시 */}
              {attendees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>참석률</span>
                    <span>
                      {attendees.filter(a => a.status === 'attending').length} / {attendees.length} 
                      ({Math.round((attendees.filter(a => a.status === 'attending').length / attendees.length) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(attendees.filter(a => a.status === 'attending').length / attendees.length) * 100} 
                    className="h-2" 
                  />
                </div>
              )}

              {/* 참석자 목록 */}
              <div className="space-y-3">
                {['attending', 'pending', 'not_attending'].map(statusFilter => {
                  const filteredAttendees = attendees.filter(a => a.status === statusFilter)
                  
                  if (filteredAttendees.length === 0) return null

                  return (
                    <div key={statusFilter}>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        {getStatusIcon(statusFilter)}
                        {getStatusLabel(statusFilter)} ({filteredAttendees.length}명)
                      </h4>
                      <div className="space-y-2">
                        {filteredAttendees.map((attendee) => (
                          <div key={attendee.userId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={attendee.profileImage || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{attendee.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{attendee.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {attendee.position}
                                </Badge>
                                {isManagerMode && (
                                  <span className="text-xs text-muted-foreground">
                                    ⭐ {attendee.rating}
                                  </span>
                                )}
                              </div>
                              {attendee.updatedAt && (
                                <div className="text-xs text-muted-foreground">
                                  {new Date(attendee.updatedAt).toLocaleString('ko-KR')}
                                </div>
                              )}
                            </div>
                            <Badge className={getStatusColor(attendee.status)} variant="secondary">
                              {getStatusIcon(attendee.status)}
                              <span className="ml-1">{getStatusLabel(attendee.status)}</span>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
