"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Star, MapPin, Phone, Calendar, TrendingUp, Eye, Target, BarChart3, Shield, Award, Users } from 'lucide-react'
import { LEVEL_OPTIONS, LEVEL_CATEGORIES, getLevelLabel, getLevelShortLabel, getLevelColor } from '@/lib/level-system'

// 포지션별 한국어 매핑
const positionMapping: Record<string, string> = {
  "GK": "골키퍼",
  "DC": "수비수", 
  "DR": "수비수",
  "DL": "수비수",
  "DRL": "수비수",
  "DRLC": "수비수",
  "DM": "미드필더",
  "MC": "미드필더", 
  "AMC": "미드필더",
  "ST": "공격수",
  "CF": "공격수",
  "SS": "공격수",
  "LWF": "공격수",
  "RWF": "공격수"
}

interface TeamManagementProps {
  isManagerMode: boolean
}

export function TeamManagement({ isManagerMode }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activePositionTab, setActivePositionTab] = useState("all")
  const [editingMember, setEditingMember] = useState<any>(null)
  const [tempLevel, setTempLevel] = useState<number>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/team/members')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '팀원 목록을 가져올 수 없습니다.')
      }

      setTeamMembers(result.members)
      setError("")
    } catch (error) {
      setError(error instanceof Error ? error.message : '팀원 목록 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPositionColor = (position: string) => {
    const positionType = positionMapping[position] || position
    switch (positionType) {
      case "골키퍼": return "bg-yellow-100 text-yellow-800"
      case "수비수": return "bg-blue-100 text-blue-800"
      case "미드필더": return "bg-green-100 text-green-800"
      case "공격수": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // 포지션별 팀원 필터링
  const getFilteredMembers = (positionType: string) => {
    if (positionType === "all") return teamMembers
    
    return teamMembers.filter(member => {
      const memberPositionType = positionMapping[member.mainPosition] || member.mainPosition
      return memberPositionType === positionType
    })
  }

  // 포지션별 카운트
  const getPositionCount = (positionType: string) => {
    return getFilteredMembers(positionType).length
  }

  // 포지션 탭 구성
  const positionTabs = [
    { value: "all", label: "전체", icon: Users, count: teamMembers.length },
    { value: "공격수", label: "FW", icon: Target, count: getPositionCount("공격수") },
    { value: "미드필더", label: "MF", icon: BarChart3, count: getPositionCount("미드필더") },
    { value: "수비수", label: "DF", icon: Shield, count: getPositionCount("수비수") },
    { value: "골키퍼", label: "GK", icon: Award, count: getPositionCount("골키퍼") }
  ]

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">팀원 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500">{error}</div>
              <Button onClick={fetchTeamMembers}>다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      {/* <div className="flex justify-end items-center">
        <Button onClick={fetchTeamMembers} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div> */}

      {/* 포지션별 탭 */}
      <Tabs value={activePositionTab} onValueChange={setActivePositionTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {positionTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1">
                <Icon className="h-4 w-4 hidden sm:inline" />
                <span className="text-sm">{tab.label}</span>
                <span className="text-xs">({tab.count})</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {positionTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {getFilteredMembers(tab.value).map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage src={member.profileImage || "/placeholder.svg"} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          {/* {member.jerseyNumber && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {member.jerseyNumber}
                            </div>
                          )} */}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg truncate flex items-center gap-2">
                            {member.name}
                            {member.jerseyNumber && (
                              <span className="text-sm font-normal text-muted-foreground">#{member.jerseyNumber}</span>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={getPositionColor(member.mainPosition)} variant="secondary">
                              {member.mainPosition}
                            </Badge>
                            {member.subPositions && member.subPositions.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                + {member.subPositions.join(', ')}
                              </span>
                            )}
                            {isManagerMode && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-blue-500" />
                                <span className="text-sm font-medium">{getLevelShortLabel(member.level)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            {isManagerMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{member.name} 상세 정보</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5">
                            {/* 기본 정보 */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>이름</Label>
                                <Input defaultValue={member.realName || member.nickname} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>전화번호</Label>
                                <Input defaultValue={member.phoneNumber} disabled />
                              </div>
                            </div>
                            
                            {/* 포지션 */}
                            <div className="space-y-2">
                              <Label>포지션</Label>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getPositionColor(member.preferredPosition)} variant="default">
                                  {member.preferredPosition}
                                </Badge>
                                {member.subPositions && member.subPositions.length > 0 && (
                                  member.subPositions.map((pos: string) => (
                                    <Badge key={pos} variant="outline">{pos}</Badge>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            {/* 지역 */}
                            <div className="space-y-2">
                              <Label>거주 지역</Label>
                              <Input defaultValue={`${member.region} ${member.city}`} disabled />
                            </div>
                            
                            {/* 주발 */}
                            {member.preferredFoot && (
                              <div className="space-y-2">
                                <Label>주발</Label>
                                <Input defaultValue={member.preferredFoot === 'right' ? '오른발' : member.preferredFoot === 'left' ? '왼발' : '양발'} disabled />
                              </div>
                            )}
                            
                            {/* 등번호 */}
                            {member.jerseyNumber && (
                              <div className="space-y-2">
                                <Label>등번호</Label>
                                <Input defaultValue={`${member.jerseyNumber}번`} disabled />
                              </div>
                            )}
                            
                            {/* 레벨 (총무 전용, 가장 아래에 표시) */}
                            {isManagerMode && (
                              <div className="space-y-2 pt-4 border-t">
                                <Label className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  선수 레벨 (총무 전용)
                                </Label>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={editingMember?.id === member.id ? tempLevel.toString() : (member.level?.toString() || "1")}
                                      onValueChange={(value) => {
                                        setEditingMember(member)
                                        setTempLevel(parseInt(value))
                                        setSaveMessage("")
                                      }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {LEVEL_CATEGORIES.map((category) => (
                                          <div key={category.name}>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                              {category.name}
                                            </div>
                                            {category.levels.map((levelValue) => (
                                              <SelectItem key={levelValue} value={levelValue.toString()}>
                                                <div className="flex items-center gap-2">
                                                  <span className={`px-2 py-1 rounded text-xs ${category.color}`}>
                                                    {getLevelShortLabel(levelValue)}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </div>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <span className="text-xs text-muted-foreground">
                                      현재: {getLevelLabel(editingMember?.id === member.id ? tempLevel : member.level)}
                                    </span>
                                  </div>
                                  
                                  {/* 레벨 저장 버튼 */}
                                  {editingMember?.id === member.id && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          setIsSaving(true)
                                          setSaveMessage("")
                                          
                                          try {
                                            const response = await fetch('/api/user/update', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                userId: member.id,
                                                level: tempLevel
                                              })
                                            })
                                            
                                            if (response.ok) {
                                              setSaveMessage("레벨이 성공적으로 저장되었습니다!")
                                              setEditingMember(null)
                                              // 팀원 목록 새로고침
                                              fetchTeamMembers()
                                            } else {
                                              setSaveMessage("레벨 저장에 실패했습니다.")
                                            }
                                          } catch (error) {
                                            console.error('레벨 수정 오류:', error)
                                            setSaveMessage("레벨 저장 중 오류가 발생했습니다.")
                                          } finally {
                                            setIsSaving(false)
                                          }
                                        }}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        {isSaving ? "저장 중..." : "레벨 저장"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingMember(null)
                                          setTempLevel(member.level || 1)
                                          setSaveMessage("")
                                        }}
                                      >
                                        취소
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {/* 저장 메시지 */}
                                  {saveMessage && editingMember?.id === member.id && (
                                    <div className={`text-xs ${saveMessage.includes('성공') ? 'text-green-600' : 'text-red-600'}`}>
                                      {saveMessage}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>출석률</Label>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{member.attendanceRate}%</span>
                                <Progress value={member.attendanceRate} className="h-2 flex-1 ml-4" />
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{member.region} {member.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>가입일: {member.joinDate}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">출석률</span>
                      <span className="text-sm font-medium">{member.attendanceRate}%</span>
                    </div>
                    <Progress value={member.attendanceRate} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
