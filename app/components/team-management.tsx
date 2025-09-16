"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { UserPlus, Edit, Star, MapPin, Phone, Mail, Calendar, TrendingUp, Plus, X, Eye, EyeOff } from 'lucide-react'

// 팀 설정에서 가져온 능력치와 포지션 (실제로는 전역 상태나 props로 관리)
const teamSkillCategories = ["속도", "패스", "수비", "슈팅", "드리블", "체력", "멘탈"]
const teamPositions = {
  "골키퍼": ["GK"],
  "수비수": ["CB", "LB", "RB", "SW"],
  "미드필더": ["CDM", "CM", "CAM", "LM", "RM"],
  "공격수": ["CF", "LW", "RW", "ST"]
}

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

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true)
      console.log('팀원 목록 가져오는 중...')

      const response = await fetch('/api/team/members')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '팀원 목록을 가져올 수 없습니다.')
      }

      console.log('팀원 목록 로드 성공:', result.count + '명')
      setTeamMembers(result.members)
      setError("")

    } catch (error) {
      console.error('팀원 목록 조회 오류:', error)
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

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">팀원 관리</h2>
            <p className="text-muted-foreground">팀원 정보를 불러오는 중...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
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
            <h2 className="text-2xl font-bold">팀원 관리</h2>
            <p className="text-muted-foreground">팀원 정보를 확인하세요</p>
          </div>
        </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">팀원 관리</h2>
          <p className="text-muted-foreground">
            {isManagerMode ? "팀원 정보를 관리하고 평가하세요" : "팀원 정보를 확인하세요"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            총 {teamMembers.length}명의 팀원
          </p>
        </div>
        <Button onClick={fetchTeamMembers} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 팀원 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={member.profileImage || "/placeholder.svg"} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{member.name}</CardTitle>
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
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{member.overallRating}</span>
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
                    <Tabs defaultValue="info" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="info">기본 정보</TabsTrigger>
                        <TabsTrigger value="position">포지션</TabsTrigger>
                        {isManagerMode && <TabsTrigger value="skills">능력치</TabsTrigger>}
                        <TabsTrigger value="stats">통계</TabsTrigger>
                      </TabsList>
                      <TabsContent value="info" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>이름</Label>
                          <Input defaultValue={member.name} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>연락처</Label>
                          <Input defaultValue={member.phone} disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>거주지역</Label>
                        <Input defaultValue={`${member.region} ${member.city}`} disabled />
                      </div>
                      {member.preferredFoot && (
                        <div className="space-y-2">
                          <Label>주발</Label>
                          <Input defaultValue={member.preferredFoot === 'RIGHT' ? '오른발' : member.preferredFoot === 'LEFT' ? '왼발' : '양발'} disabled />
                        </div>
                      )}
                      </TabsContent>
                      <TabsContent value="position" className="space-y-4">
                        <div className="space-y-2">
                          <Label>희망포지션 (주포지션)</Label>
                          <div className="p-2 bg-gray-50 rounded-md">
                            <Badge className={getPositionColor(member.mainPosition)}>
                              {member.mainPosition}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>부포지션</Label>
                          <div className="flex flex-wrap gap-2">
                            {member.subPositions && member.subPositions.length > 0 ? (
                              member.subPositions.map((pos: string) => (
                                <Badge key={pos} variant="outline">{pos}</Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">설정된 부포지션 없음</span>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      {isManagerMode && (
                        <TabsContent value="skills" className="space-y-4">
                          <div className="space-y-4">
                            {Object.entries(member.skills).map(([skill, value]) => (
                              <div key={skill} className="space-y-2">
                                <div className="flex justify-between">
                                  <Label>{skill}</Label>
                                  <span className="text-sm font-medium">{value}/10</span>
                                </div>
                                <Progress value={value * 10} className="h-2" />
                              </div>
                            ))}
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">종합 점수</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {member.overallRating}/10
                                </span>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      )}
                      <TabsContent value="stats" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">출석률</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{member.attendanceRate}%</div>
                              <Progress value={member.attendanceRate} className="mt-2" />
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {member.subPositions && member.subPositions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>부포지션:</span>
                    <div className="flex flex-wrap gap-1">
                      {member.subPositions.slice(0, 2).map((pos: string) => (
                        <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                      ))}
                      {member.subPositions.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{member.subPositions.length - 2}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
    </div>
  )
}
