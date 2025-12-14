"use client"

import { useState, useEffect, useRef } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Edit, Star, MapPin, Phone, Calendar, TrendingUp, Eye, Target, BarChart3, Shield, Award, Users, User, AlertCircle, UserMinus, UserX, Power, Footprints, Search, Loader2 } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { LEVEL_OPTIONS, LEVEL_CATEGORIES, LEVEL_SYSTEM, getLevelLabel, getLevelShortLabel, getLevelColor } from '@/lib/level-system'

// 포지션별 한국어 매핑
const positionMapping: Record<string, string> = {
  "GK": "골키퍼",
  "DC": "수비수",
  "CB": "수비수", // Center Back (DC와 동일)
  "DR": "수비수",
  "RB": "수비수", // Right Back (DR과 동일)
  "DL": "수비수",
  "LB": "수비수", // Left Back (DL과 동일)
  "LRB": "수비수", // Left/Right Back (양쪽 풀백)
  "LRCB": "수비수", // Left/Right/Center Back (멀티 수비수)
  "DM": "미드필더",
  "CDM": "미드필더",
  "MC": "미드필더",
  "CM": "미드필더",
  "AMC": "미드필더",
  "CAM": "미드필더",
  "ST": "공격수",
  "CF": "공격수",
  "SS": "공격수",
  "LWF": "공격수",
  "RWF": "공격수"
}

// 포지션 풀네임 매핑
const positionFullNames: Record<string, string> = {
  "GK": "GK (골키퍼)",
  "DC": "DC (센터백)",
  "CB": "CB (센터백)",
  "DR": "DR (우측풀백)",
  "RB": "RB (우측풀백)",
  "DL": "DL (좌측풀백)",
  "LB": "LB (좌측풀백)",
  "LRB": "LRB (양쪽 풀백)",
  "LRCB": "LRCB (멀티 수비수)",
  "MC": "CM (중앙미드필더)",
  "CM": "CM (중앙미드필더)",
  "AMC": "CAM (공격형미드필더)",
  "CAM": "CAM (공격형미드필더)",
  "DM": "CDM (수비형미드필더)",
  "CDM": "CDM (수비형미드필더)",
  "ST": "ST (스트라이커)",
  "CF": "CF (센터포워드)",
  "SS": "SS (세컨드스트라이커)",
  "LWF": "LWF (좌측윙포워드)",
  "RWF": "RWF (우측윙포워드)"
}

// 전화번호 포맷팅 함수
const formatPhoneNumber = (phone: string) => {
  if (!phone) return '정보 없음'
  const numbers = phone.replace(/[^0-9]/g, '')
  
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  }
  
  return phone
}

interface TeamManagementProps {
  isManagerMode: boolean
  currentUser?: any
}

export function TeamManagement({ isManagerMode, currentUser }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activePositionTab, setActivePositionTab] = useState("all")
  const [editingMember, setEditingMember] = useState<any>(null)
  const [tempLevel, setTempLevel] = useState<number>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [positionFilter, setPositionFilter] = useState<string | null>(null) // null = 전체 표시
  const [sortBy, setSortBy] = useState<"name" | "position" | "level">("name") // 기본: 가나다순
  const [searchQuery, setSearchQuery] = useState<string>("") // 이름 검색어

  // 중복 호출 방지를 위한 ref
  const fetchingRef = useRef(false)
  const lastRequestRef = useRef<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const prevRequesterIdRef = useRef<string | undefined>(undefined)
  const prevShowInactiveRef = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const user = currentUser || JSON.parse(sessionStorage.getItem('user') || '{}')
    const requesterId = user?.id || ''

    // 이전 요청과 동일한지 확인
    const requesterIdChanged = prevRequesterIdRef.current !== requesterId
    const showInactiveChanged = prevShowInactiveRef.current !== showInactive

    // 변경사항이 없고 이미 요청 중이면 중단
    if (!requesterIdChanged && !showInactiveChanged && fetchingRef.current) {
      return
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // 요청 키 생성
    const requestKey = `${requesterId}-${showInactive}`
    
    // 동일한 요청이 이미 진행 중이면 중단
    if (fetchingRef.current && lastRequestRef.current === requestKey) {
      return
    }

    // ref 업데이트
    prevRequesterIdRef.current = requesterId
    prevShowInactiveRef.current = showInactive
    lastRequestRef.current = requestKey
    fetchingRef.current = true

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError("")

        const queryParams = new URLSearchParams({
          requesterId,
          includeInactive: showInactive.toString()
        })

        const response = await fetch(`/api/team/members?${queryParams}`, {
          signal: abortController.signal
        })

        // 요청이 취소되었으면 중단
        if (abortController.signal.aborted) {
          return
        }

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || '팀원 목록을 가져올 수 없습니다.')
        }

        const result = await response.json()
        
        // 요청이 취소되었으면 상태 업데이트 하지 않음
        if (!abortController.signal.aborted) {
          setTeamMembers(result.members)
          setError("")
        }
      } catch (error: any) {
        // AbortError는 무시
        if (error?.name === 'AbortError') {
          return
        }
        
        // 요청이 취소되었으면 에러 설정하지 않음
        if (!abortController.signal.aborted) {
          setError(error instanceof Error ? error.message : '팀원 목록 조회 중 오류가 발생했습니다.')
        }
      } finally {
        // 요청이 취소되지 않았을 때만 로딩 상태 해제
        if (!abortController.signal.aborted) {
          setIsLoading(false)
          fetchingRef.current = false
        }
      }
    }

    fetchData()

    return () => {
      abortController.abort()
      fetchingRef.current = false
    }
  }, [showInactive, currentUser?.id])

  const fetchTeamMembers = async (includeInactive = false) => {
    try {
      setIsLoading(true)
      // 현재 사용자 정보 가져오기 (역할 확인용)
      const user = currentUser || JSON.parse(sessionStorage.getItem('user') || '{}')
      const requesterId = user?.id || ''

      const queryParams = new URLSearchParams({
        requesterId,
        includeInactive: includeInactive.toString()
      })

      const response = await fetch(`/api/team/members?${queryParams}`)
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

  // 포지션별 카테고리 색상
  const getCategoryColor = (position: string) => {
    const positionType = positionMapping[position] || position
    switch (positionType) {
      case "골키퍼": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "수비수": return "bg-blue-100 text-blue-700 border-blue-300"
      case "미드필더": return "bg-green-100 text-green-700 border-green-300"
      case "공격수": return "bg-red-100 text-red-700 border-red-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  // 우측 상단 인디케이터 색상 (포지션 카테고리별)
  const getPositionIndicatorColor = (position: string) => {
    const positionType = positionMapping[position] || position
    switch (positionType) {
      case "골키퍼": return "bg-yellow-500"
      case "수비수": return "bg-blue-500"
      case "미드필더": return "bg-green-500"
      case "공격수": return "bg-red-500"
      default: return "bg-gray-400"
    }
  }

  // 주포지션 색상 (초록)
  const getMainPositionColor = () => {
    return "bg-green-100 text-green-800 border-green-300"
  }

  // 부포지션 색상 (파랑)
  const getSubPositionColor = () => {
    return "bg-blue-100 text-blue-800 border-blue-300"
  }

  // 포지션별 팀원 필터링 및 정렬
  const getFilteredMembers = () => {
    let filtered = teamMembers

    // 이름 검색 필터 적용 (가나다순일 때만)
    if (sortBy === "name" && searchQuery.trim()) {
      filtered = filtered.filter(member => {
        const name = member.name || ""
        return name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      })
    }

    // 포지션 필터 적용 (null이면 전체 표시)
    if (positionFilter) {
      filtered = filtered.filter(member => {
        const memberPositionType = positionMapping[member.mainPosition || member.preferredPosition] || (member.mainPosition || member.preferredPosition)
        return memberPositionType === positionFilter
      })
    }

    // 정렬 적용
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        // 가나다순 (이름 기준)
        return a.name.localeCompare(b.name, 'ko')
      } else if (sortBy === "position") {
        // 포지션순 (골키퍼 > 수비수 > 미드필더 > 공격수)
        const positionOrder: { [key: string]: number } = { "골키퍼": 0, "수비수": 1, "미드필더": 2, "공격수": 3 }
        const aPosition = positionMapping[a.mainPosition || a.preferredPosition] || "미분류"
        const bPosition = positionMapping[b.mainPosition || b.preferredPosition] || "미분류"
        const orderDiff = (positionOrder[aPosition] || 99) - (positionOrder[bPosition] || 99)
        
        // 같은 포지션이면 이름순
        if (orderDiff === 0) {
          return a.name.localeCompare(b.name, 'ko')
        }
        return orderDiff
      } else if (sortBy === "level") {
        // 레벨순 (높은 순 > 낮은 순)
        const levelDiff = (b.level || 1) - (a.level || 1)
        
        // 같은 레벨이면 이름순
        if (levelDiff === 0) {
          return a.name.localeCompare(b.name, 'ko')
        }
        return levelDiff
      }
      return 0
    })

    return sorted
  }

  // 레벨 카테고리 가져오기
  const getLevelCategory = (level: number | null | undefined): string => {
    if (!level || level < 1 || level > 10) return '루키'
    const category = LEVEL_SYSTEM[level as keyof typeof LEVEL_SYSTEM]?.category
    return category || '루키'
  }

  // 포지션 대분류로 멤버 그룹화
  const getGroupedMembers = () => {
    const filtered = getFilteredMembers()
    
    if (sortBy === "level") {
      // 레벨순일 때는 레벨 카테고리별로 그룹화
      const grouped: { [key: string]: any[] } = {
        "프로": [] as any[],
        "세미프로": [] as any[],
        "아마추어": [] as any[],
        "루키": [] as any[]
      }

      filtered.forEach(member => {
        const category = getLevelCategory(member.level)
        if (grouped[category]) {
          grouped[category].push(member)
        }
      })

      // 각 그룹 내에서도 레벨 높은 순 > 이름순 정렬
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => {
          const levelDiff = (b.level || 1) - (a.level || 1)
          if (levelDiff === 0) {
            return a.name.localeCompare(b.name, 'ko')
          }
          return levelDiff
        })
      })

      return grouped
    } else {
      // 포지션순일 때는 포지션별로 그룹화
      const grouped: { [key: string]: any[] } = {
        "공격수": [] as any[],
        "미드필더": [] as any[],
        "수비수": [] as any[],
        "골키퍼": [] as any[]
      }

      filtered.forEach(member => {
        const positionType = positionMapping[member.mainPosition || member.preferredPosition] || "미분류"
        if (grouped[positionType]) {
          grouped[positionType].push(member)
        }
      })

      // 각 그룹 내에서도 이름순 정렬
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      })

      return grouped
    }
  }

  // 포지션별 카운트
  const getPositionCount = (positionType: string) => {
    return teamMembers.filter(member => {
      const memberPositionType = positionMapping[member.mainPosition || member.preferredPosition] || (member.mainPosition || member.preferredPosition)
      return memberPositionType === positionType
    }).length
  }

  // 포지션 필터 토글 함수
  const togglePositionFilter = (position: string) => {
    if (positionFilter === position) {
      setPositionFilter(null) // 같은 필터 클릭 시 해제
    } else {
      setPositionFilter(position) // 다른 필터 선택
    }
  }

  // 출석왕 확인 함수 (상위 3명)
  const isTopAttender = (member: any) => {
    if (!member.attendanceRate || teamMembers.length < 3) return false
    
  // 참석률 기준으로 정렬하여 상위 3명 찾기
    const sortedByAttendance = [...teamMembers]
      .filter(m => m.attendanceRate > 0) // 참석률이 0보다 큰 사람만
      .sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0))
    
    // 상위 3명에 포함되는지 확인
    const top3 = sortedByAttendance.slice(0, 3)
    return top3.some(m => m.id === member.id)
  }

  // 출석우수 확인 함수 (참석률 80% 이상)
  const isExcellentAttender = (member: any) => {
    return member.attendanceRate >= 80
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-muted-foreground">팀원 정보를 불러오는 중...</p>
          </div>
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
              <Button onClick={() => fetchTeamMembers(showInactive)}>다시 시도</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex flex-col gap-3">
        {/* 정렬 필터 - SELECT 형태 (전체 너비) */}
        <Select value={sortBy} onValueChange={(value: "name" | "position" | "level") => {
          setSortBy(value)
          // 정렬 방식이 변경되면 포지션 필터 초기화
          if (value !== "position") {
            setPositionFilter(null)
          }
        }}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="정렬 방식" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">가나다순</SelectItem>
            <SelectItem value="position">포지션순</SelectItem>
            <SelectItem value="level">레벨순</SelectItem>
          </SelectContent>
        </Select>

        {/* 이름 검색 필터 - 가나다순일 때만 표시 */}
        {sortBy === "name" && (
          <div className="w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9"
            />
          </div>
        )}

        {/* 포지션 필터 탭 - 포지션순일 때만 표시 (전체 너비) */}
        {sortBy === "position" && (
          <div className="grid grid-cols-5 gap-2">
            <Button
              variant={positionFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setPositionFilter(null)}
              className={`w-full justify-center ${positionFilter === null ? "bg-blue-800 hover:bg-blue-900 text-white" : ""}`}
            >
              <span className="flex items-center gap-1 text-xs sm:text-base">
                All
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {teamMembers.length}
                </Badge>
              </span>
            </Button>

            <Button
              variant={positionFilter === "공격수" ? "default" : "outline"}
              size="sm"
              onClick={() => togglePositionFilter("공격수")}
              className={`w-full justify-center ${positionFilter === "공격수" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
            >
              <span className="flex items-center gap-1 text-xs sm:text-base">
                FW
                <Badge variant={positionFilter === "공격수" ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                  {getPositionCount("공격수")}
                </Badge>
              </span>
            </Button>

            <Button
              variant={positionFilter === "미드필더" ? "default" : "outline"}
              size="sm"
              onClick={() => togglePositionFilter("미드필더")}
              className={`w-full justify-center ${positionFilter === "미드필더" ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
            >
              <span className="flex items-center gap-1 text-xs sm:text-base">
                MF
                <Badge variant={positionFilter === "미드필더" ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                  {getPositionCount("미드필더")}
                </Badge>
              </span>
            </Button>

            <Button
              variant={positionFilter === "수비수" ? "default" : "outline"}
              size="sm"
              onClick={() => togglePositionFilter("수비수")}
              className={`w-full justify-center ${positionFilter === "수비수" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
            >
              <span className="flex items-center gap-1 text-xs sm:text-base">
                DF
                <Badge variant={positionFilter === "수비수" ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                  {getPositionCount("수비수")}
                </Badge>
              </span>
            </Button>

            <Button
              variant={positionFilter === "골키퍼" ? "default" : "outline"}
              size="sm"
              onClick={() => togglePositionFilter("골키퍼")}
              className={`w-full justify-center ${positionFilter === "골키퍼" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}
            >
              <span className="flex items-center gap-1 text-xs sm:text-base">
                GK
                <Badge variant={positionFilter === "골키퍼" ? "secondary" : "outline"} className="text-xs px-1.5 py-0">
                  {getPositionCount("골키퍼")}
                </Badge>
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* 멤버 표시 - 포지션순/레벨순일 때 그룹화 */}
      {sortBy === "position" || sortBy === "level" ? (
        // 포지션별/레벨별 그룹화된 멤버 표시
        <div className="space-y-6">
          {Object.entries(getGroupedMembers()).map(([categoryType, members]) => {
            if (members.length === 0) return null

            // 포지션순일 때 포지션 설정
            const positionConfig = {
              "공격수": {
                icon: BarChart3,
                color: "text-red-600",
                bgColor: "bg-gradient-to-r from-red-50 to-red-100/50",
                borderColor: "border-red-300",
                iconBg: "bg-red-100"
              },
              "미드필더": {
                icon: BarChart3,
                color: "text-green-600",
                bgColor: "bg-gradient-to-r from-green-50 to-green-100/50",
                borderColor: "border-green-300",
                iconBg: "bg-green-100"
              },
              "수비수": {
                icon: Shield,
                color: "text-blue-600",
                bgColor: "bg-gradient-to-r from-blue-50 to-blue-100/50",
                borderColor: "border-blue-300",
                iconBg: "bg-blue-100"
              },
              "골키퍼": {
                icon: Award,
                color: "text-yellow-600",
                bgColor: "bg-gradient-to-r from-yellow-50 to-yellow-100/50",
                borderColor: "border-yellow-300",
                iconBg: "bg-yellow-100"
              }
            }

            // 레벨순일 때 레벨 카테고리 설정
            const levelConfig = {
              "프로": {
                icon: Award,
                color: "text-yellow-600",
                bgColor: "bg-gradient-to-r from-yellow-50 to-yellow-100/50",
                borderColor: "border-yellow-300",
                iconBg: "bg-yellow-100"
              },
              "세미프로": {
                icon: Target,
                color: "text-purple-600",
                bgColor: "bg-gradient-to-r from-purple-50 to-purple-100/50",
                borderColor: "border-purple-300",
                iconBg: "bg-purple-100"
              },
              "아마추어": {
                icon: Shield,
                color: "text-blue-600",
                bgColor: "bg-gradient-to-r from-blue-50 to-blue-100/50",
                borderColor: "border-blue-300",
                iconBg: "bg-blue-100"
              },
              "루키": {
                icon: Users,
                color: "text-gray-600",
                bgColor: "bg-gradient-to-r from-gray-50 to-gray-100/50",
                borderColor: "border-gray-300",
                iconBg: "bg-gray-100"
              }
            }

            const config = sortBy === "level" 
              ? (levelConfig[categoryType as keyof typeof levelConfig] || {
                  icon: Users,
                  color: "text-gray-600",
                  bgColor: "bg-gradient-to-r from-gray-50 to-gray-100/50",
                  borderColor: "border-gray-300",
                  iconBg: "bg-gray-100"
                })
              : (positionConfig[categoryType as keyof typeof positionConfig] || {
                  icon: Users,
                  color: "text-gray-600",
                  bgColor: "bg-gradient-to-r from-gray-50 to-gray-100/50",
                  borderColor: "border-gray-300",
                  iconBg: "bg-gray-100"
                })
            const Icon = config.icon

            return (
              <div key={categoryType} className="space-y-4">
                {/* 카테고리 헤더 - 새 디자인 */}
                <div className={`flex items-center gap-3 px-5 py-4 rounded-lg ${config.bgColor} border-l-4 ${config.borderColor} shadow-sm`}>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${config.color}`}>{categoryType}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/80 text-gray-700 font-semibold px-3 py-1">
                    {members.length}명
                  </Badge>
                </div>

                {/* 멤버 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {members.map((member) => (
                <Card key={member.id} className={`relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${!member.isActive ? 'opacity-60 border-dashed border-gray-300' : 'border border-gray-200'}`}>
                  {/* 우측 상단 포지션 인디케이터 */}
                  {member.isActive && (
                    <div className={`absolute top-0 right-0 w-8 h-8 ${getPositionIndicatorColor(member.mainPosition || member.preferredPosition)} opacity-90`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
                  )}
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                            <AvatarImage src={member.profileImage || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                              {member.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {member.jerseyNumber && (
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md border-2 border-white">
                              {member.jerseyNumber}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900">{member.name}</span>
                                {/* 레벨 배지 */}
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${(() => {
                                    const level = member.level || 1
                                    if (level === 1) return 'bg-gray-50 text-gray-600 border-gray-200'
                                    if (level <= 6) return 'bg-blue-50 text-blue-600 border-blue-200'
                                    if (level <= 9) return 'bg-purple-50 text-purple-600 border-purple-200'
                                    return 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                  })()}`}
                                >
                                  {getLevelLabel(member.level)}
                                </Badge>
                                {!member.isActive && (
                                  <Badge variant="destructive" className="text-xs">
                                    비활성
                                  </Badge>
                                )}
                              </div>
                              {/* 출석왕/출석우수 뱃지 - 이름 아래 표시 */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isTopAttender(member) && (
                                  <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                                    👑 출석왕
                                  </Badge>
                                )}
                                {isExcellentAttender(member) && !isTopAttender(member) && (
                                  <Badge className="text-xs bg-gradient-to-r from-blue-400 to-blue-500 text-white border-0">
                                    ⭐ 출석우수
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardTitle>
                        </div>
                        </div>
                      <div className="flex items-center gap-1">
                        {/* 상세보기/수정 버튼 - 총무만 */}
                      {isManagerMode && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
                          <DialogHeader className="pb-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                {member.profileImage ? (
                                  <img src={member.profileImage} alt={member.name} className="h-full w-full object-cover" />
                                ) : (
                                  <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
                                    {member.name[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1">
                                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                  {member.name}
                                  {!member.isActive && (
                                    <Badge variant="destructive" className="text-xs">비활성</Badge>
                                  )}
                                </DialogTitle>
                                {/* <p className="text-muted-foreground mt-1">선수 상세 정보</p> */}
                              </div>
                            </div>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* 기본 정보 카드 */}
                            <Card className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <User className="h-4 w-4 text-blue-500" />
                                  기본 정보
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">이름</Label>
                                  <div className="p-2 bg-gray-50 rounded-lg border">
                                    <span className="text-sm">{member.name}</span>
                                  </div>
                                </div>
                                
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">전화번호</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                      <span className="text-sm">{formatPhoneNumber(member.phone)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">거주지역</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                      <span className="text-sm">{member.region} {member.city}</span>
                                    </div>
                            </div>
                              </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">주발</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border">
                                      <span className="text-sm">
                                        {member.preferredFoot === 'RIGHT' ? '오른발' : 
                                         member.preferredFoot === 'LEFT' ? '왼발' : 
                                         member.preferredFoot === 'BOTH' ? '양발' : '정보 없음'}
                                      </span>
                              </div>
                            </div>
                                  
                              <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">등번호</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                      <span className="text-sm">
                                        {member.jerseyNumber ? `${member.jerseyNumber}번` : '미배정'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">가입일</Label>
                                  <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{member.joinDate}</span>
                                  </div>
                                </div>
                                
                              </CardContent>
                            </Card>
                            
                            {/* 포지션 정보 카드 */}
                            <Card className="border-l-4 border-l-green-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-500" />
                                  포지션 정보
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-2 block">주포지션</Label>
                                    <Badge className={`${getMainPositionColor()} text-xs px-2 py-1 border`} variant="default">
                                      {positionFullNames[member.mainPosition || member.preferredPosition] || (member.mainPosition || member.preferredPosition)}
                                    </Badge>
                                  </div>
                                  
                                  {member.subPositions && member.subPositions.length > 0 && (
                                    <div>
                                      <Label className="text-xs font-medium text-gray-700 mb-2 block">부포지션</Label>
                                      <div className="flex flex-wrap gap-1">
                                        {member.subPositions.map((pos: string) => (
                                          <Badge key={pos} variant="outline" className="text-xs px-1.5 py-0.5">
                                            {positionFullNames[pos] || pos}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 참석률 */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="text-xs font-medium text-gray-700">참석률</Label>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground">
                                          ({member.attendedCount || 0}/{member.totalSchedules || 0})
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          {member.attendanceRate || 0}%
                                        </span>
                                      </div>
                                    </div>
                                    <Progress 
                                      value={member.attendanceRate || 0} 
                                      className="h-2 bg-gray-200" 
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* 레벨 관리 (총무 전용) */}
                            {isManagerMode && (
                              <div className="space-y-3">
                                {editingMember?.id !== member.id ? (
                                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">레벨:</span>
                                      <Badge className="text-sm px-2 py-1">
                                        {getLevelLabel(member.level)}
                                      </Badge>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        setEditingMember(member)
                                        setTempLevel(member.level || 1)
                                        setSaveMessage("")
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      수정
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm text-gray-700 min-w-[50px]">레벨:</Label>
                                      <Select
                                        value={tempLevel.toString()}
                                        onValueChange={(value) => {
                                          setTempLevel(parseInt(value))
                                          setSaveMessage("")
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {LEVEL_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value.toString()}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
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
                                              const updatedData = await response.json()
                                              setSaveMessage("저장되었습니다")
                                              
                                              if (updatedData.user) {
                                                setTeamMembers(prevMembers => 
                                                  prevMembers.map(m => 
                                                    m.id === member.id 
                                                      ? { ...m, level: updatedData.user.level }
                                                      : m
                                                  )
                                                )
                                              }
                                              
                                              setTimeout(() => {
                                                setEditingMember(null)
                                                setSaveMessage("")
                                              }, 1500)
                                            } else {
                                              setSaveMessage("저장 실패")
                                            }
                                          } catch (error) {
                                            console.error('레벨 수정 오류:', error)
                                            setSaveMessage("오류가 발생했습니다")
                                          } finally {
                                            setIsSaving(false)
                                          }
                                        }}
                                        disabled={isSaving}
                                        size="sm"
                                        className="flex-1"
                                      >
                                        {isSaving ? "저장 중..." : "저장"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setEditingMember(null)
                                          setTempLevel(member.level || 1)
                                          setSaveMessage("")
                                        }}
                                        size="sm"
                                        className="flex-1"
                                      >
                                        취소
                                      </Button>
                                    </div>
                                    {saveMessage && (
                                      <p className={`text-xs ${
                                        saveMessage.includes('저장되었습니다') 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                      }`}>
                                        {saveMessage}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* 출석 통계 카드 */}
                            <Card className="border-l-4 border-l-orange-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-orange-500" />
                                  출석 통계
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-gray-700">전체 참석률</Label>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-sm px-2 py-1 font-bold">
                                        {member.attendanceRate}%
                                      </Badge>
                                    </div>
                                  </div>
                            <div className="space-y-2">
                                    <Progress 
                                      value={member.attendanceRate} 
                                      className="h-3 bg-gray-200" 
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>0%</span>
                                      <span>50%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-muted-foreground">
                                        {member.attendanceRate >= 80 ? '우수' : 
                                         member.attendanceRate >= 60 ? '양호' : '개선 필요'}
                                      </span>
                              </div>
                            </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* 관리 버튼들 (총무 전용) */}
                            {isManagerMode && (
                              <div className="flex flex-col gap-3 pt-4 border-t">
                                {/* 비활성화/활성화 버튼 */}
                                <Button
                                  variant={member.isActive ? "outline" : "default"}
                                  className={`w-full ${member.isActive ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                  onClick={async () => {
                                    try {
                                      const user = currentUser || JSON.parse(sessionStorage.getItem('user') || '{}')

                                      if (!user?.id) {
                                        alert('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
                                        return
                                      }

                                      const endpoint = '/api/user/deactivate'
                                      const method = member.isActive ? 'PUT' : 'POST'

                                      console.log('Deactivate request:', {
                                        targetUserId: member.id,
                                        adminUserId: user.id,
                                        method
                                      })

                                      const response = await fetch(endpoint, {
                                        method,
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          targetUserId: member.id,
                                          adminUserId: user.id
                                        })
                                      })

                                      if (response.ok) {
                                        const updatedData = await response.json()
                                        // 현재 멤버 상태 즉시 업데이트
                                        if (updatedData.user) {
                                          setTeamMembers(prevMembers =>
                                            prevMembers.map(m =>
                                              m.id === member.id
                                                ? { ...m, isActive: updatedData.user.isActive }
                                                : m
                                            )
                                          )
                                        }
                                        alert(member.isActive ? '선수가 비활성화되었습니다.' : '선수가 활성화되었습니다.')
                                      } else {
                                        const error = await response.json()
                                        alert(error.error || '상태 변경에 실패했습니다.')
                                      }
                                    } catch (error) {
                                      console.error('상태 변경 중 오류:', error)
                                      alert('상태 변경 중 오류가 발생했습니다.')
                                    }
                                  }}
                                >
                                  {member.isActive ? (
                                    <>
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      비활성화
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2" />
                                      활성화
                                    </>
                                  )}
                                </Button>

                                {/* 삭제 버튼 */}
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={async () => {
                                    const confirmed = confirm(`${member.name} 선수를 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 선수의 모든 데이터가 삭제됩니다.`)
                                    if (!confirmed) return

                                    try {
                                      const user = currentUser || JSON.parse(sessionStorage.getItem('user') || '{}')
                                      const response = await fetch('/api/user/delete', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          targetUserId: member.id,
                                          adminUserId: user.id,
                                          confirmDelete: true
                                        })
                                      })

                                      if (response.ok) {
                                        // 삭제된 멤버를 목록에서 즉시 제거
                                        setTeamMembers(prevMembers =>
                                          prevMembers.filter(m => m.id !== member.id)
                                        )
                                        alert('선수가 성공적으로 삭제되었습니다.')
                                      } else {
                                        const error = await response.json()
                                        alert(error.error || '삭제에 실패했습니다.')
                                      }
                                    } catch (error) {
                                      console.error('삭제 중 오류:', error)
                                      alert('삭제 중 오류가 발생했습니다.')
                                    }
                                  }}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  선수 삭제
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 pb-3 px-4 space-y-3">
                    {/* 포지션 정보 */}
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">주포지션</Label>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMainPositionColor()}`}>
                            {positionFullNames[member.mainPosition || member.preferredPosition] || (member.mainPosition || member.preferredPosition)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pb-1">
                        <Label className="text-xs font-medium text-muted-foreground">부포지션</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {member.subPositions && member.subPositions.length > 0 ? (
                            member.subPositions.map((pos: string, idx: number) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSubPositionColor()}`}
                              >
                                {positionFullNames[pos] || pos}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                </div>

                <Separator />

                {/* 세부정보 - 2열 그리드 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* 전화번호 */}
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{formatPhoneNumber(member.phone)}</span>
                  </div>
                  
                  {/* 거주지역 */}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{member.region} {member.city}</span>
                  </div>

                  {/* 주발 */}
                  <div className="flex items-center gap-1.5">
                    <Footprints className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {member.preferredFoot === 'RIGHT' ? '오른발' :
                       member.preferredFoot === 'LEFT' ? '왼발' :
                       member.preferredFoot === 'BOTH' ? '양발' : '정보없음'}
                    </span>
                  </div>

                  {/* 가입일 */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">가입일: {member.joinDate}</span>
                  </div>

                  {/* 최근 참석경기 */}
                  <div className="flex items-center gap-1.5 col-span-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">
                      최근 참석일: {member.lastAttendedDate || '참석 이력 없음'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      )
    })}
  </div>
  ) : (
    // 가나다순일 때는 그룹화 없이 단순 리스트
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {getFilteredMembers().map((member) => (
            <Card key={member.id} className={`relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${!member.isActive ? 'opacity-60 border-dashed border-gray-300' : 'border border-gray-200'}`}>
              {/* 우측 상단 포지션 인디케이터 */}
              {member.isActive && (
                <div className={`absolute top-0 right-0 w-8 h-8 ${getPositionIndicatorColor(member.mainPosition || member.preferredPosition)} opacity-90`} style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
              )}
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                        <AvatarImage src={member.profileImage || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {member.jerseyNumber && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md border-2 border-white">
                          {member.jerseyNumber}
                        </div>
                      )}
                    </div>
                     <div className="min-w-0 flex-1">
                       <CardTitle className="text-base sm:text-lg">
                         <div className="space-y-1.5">
                           <div className="flex items-center gap-2 flex-wrap">
                             <span className="font-bold text-gray-900">{member.name}</span>
                             {/* 포지션 카테고리 배지 - 가나다순에서만 표시 */}
                             {sortBy === "name" && (
                               <Badge 
                                 variant="outline"
                                 className={`text-xs border ${getCategoryColor(member.mainPosition || member.preferredPosition)}`}
                               >
                                 {positionMapping[member.mainPosition || member.preferredPosition] || '미분류'}
                               </Badge>
                             )}
                             {/* 레벨 배지 */}
                             <Badge
                               variant="outline"
                                  className={`text-xs ${(() => {
                                    const level = member.level || 1
                                    if (level === 1) return 'bg-gray-50 text-gray-600 border-gray-200'
                                    if (level <= 6) return 'bg-blue-50 text-blue-600 border-blue-200'
                                    if (level <= 9) return 'bg-purple-50 text-purple-600 border-purple-200'
                                    return 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                  })()}`}
                             >
                               {getLevelLabel(member.level)}
                             </Badge>
                             {!member.isActive && (
                               <Badge variant="destructive" className="text-xs">
                                 비활성
                               </Badge>
                             )}
                           </div>
                           {/* 출석왕/출석우수 뱃지 - 이름 아래 표시 */}
                           <div className="flex items-center gap-1.5 flex-wrap">
                             {isTopAttender(member) && (
                               <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                                 👑 출석왕
                               </Badge>
                             )}
                             {isExcellentAttender(member) && !isTopAttender(member) && (
                               <Badge className="text-xs bg-gradient-to-r from-blue-400 to-blue-500 text-white border-0">
                                 ⭐ 출석우수
                               </Badge>
                             )}
                           </div>
                         </div>
                       </CardTitle>
                     </div>
                  </div>
                  {/* 상세보기/수정 버튼 - 총무만 표시 (선수는 숨김) */}
                  {isManagerMode && (
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
                          <DialogHeader className="pb-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                {member.profileImage ? (
                                  <img src={member.profileImage} alt={member.name} className="h-full w-full object-cover" />
                                ) : (
                                  <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
                                    {member.name[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1">
                                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                  {member.name}
                                  {!member.isActive && (
                                    <Badge variant="destructive" className="text-xs">비활성</Badge>
                                  )}
                                </DialogTitle>
                              </div>
                            </div>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* 기본 정보 카드 */}
                            <Card className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <User className="h-4 w-4 text-blue-500" />
                                  기본 정보
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">이름</Label>
                                  <div className="p-2 bg-gray-50 rounded-lg border">
                                    <span className="text-sm">{member.name}</span>
                                  </div>
                                </div>
                                
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">전화번호</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                      <span className="text-sm">{formatPhoneNumber(member.phone)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">거주지역</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                      <span className="text-sm">{member.region} {member.city}</span>
                                    </div>
                            </div>
                              </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">주발</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border">
                                      <span className="text-sm">
                                        {member.preferredFoot === 'RIGHT' ? '오른발' : 
                                         member.preferredFoot === 'LEFT' ? '왼발' : 
                                         member.preferredFoot === 'BOTH' ? '양발' : '정보 없음'}
                                      </span>
                              </div>
                            </div>
                                  
                              <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">등번호</Label>
                                    <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                      <span className="text-sm">
                                        {member.jerseyNumber ? `${member.jerseyNumber}번` : '미배정'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-gray-700">가입일</Label>
                                  <div className="p-2 bg-gray-50 rounded-lg border flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{member.joinDate}</span>
                                  </div>
                                </div>
                                
                              </CardContent>
                            </Card>
                            
                            {/* 포지션 정보 카드 */}
                            <Card className="border-l-4 border-l-green-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-500" />
                                  포지션 정보
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-2 block">주포지션</Label>
                                    <Badge className={`${getMainPositionColor()} text-xs px-2 py-1 border`} variant="default">
                                      {positionFullNames[member.mainPosition || member.preferredPosition] || (member.mainPosition || member.preferredPosition)}
                                    </Badge>
                                  </div>
                                  
                                  {member.subPositions && member.subPositions.length > 0 && (
                                    <div>
                                      <Label className="text-xs font-medium text-gray-700 mb-2 block">부포지션</Label>
                                      <div className="flex flex-wrap gap-1">
                                        {member.subPositions.map((pos: string) => (
                                          <Badge key={pos} variant="outline" className="text-xs px-1.5 py-0.5">
                                            {positionFullNames[pos] || pos}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 참석률 */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <Label className="text-xs font-medium text-gray-700">참석률</Label>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground">
                                          ({member.attendedCount || 0}/{member.totalSchedules || 0})
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          {member.attendanceRate || 0}%
                                        </span>
                                      </div>
                                    </div>
                                    <Progress 
                                      value={member.attendanceRate || 0} 
                                      className="h-2 bg-gray-200" 
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* 레벨 관리 (총무 전용) */}
                            {isManagerMode && (
                              <div className="space-y-3">
                                {editingMember?.id !== member.id ? (
                                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">레벨:</span>
                                      <Badge className="text-sm px-2 py-1">
                                        {getLevelLabel(member.level)}
                                      </Badge>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        setEditingMember(member)
                                        setTempLevel(member.level || 1)
                                        setSaveMessage("")
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      수정
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm text-gray-700 min-w-[50px]">레벨:</Label>
                                      <Select
                                        value={tempLevel.toString()}
                                        onValueChange={(value) => {
                                          setTempLevel(parseInt(value))
                                          setSaveMessage("")
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {LEVEL_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value.toString()}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
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
                                              const updatedData = await response.json()
                                              setSaveMessage("저장되었습니다")
                                              
                                              if (updatedData.user) {
                                                setTeamMembers(prevMembers => 
                                                  prevMembers.map(m => 
                                                    m.id === member.id 
                                                      ? { ...m, level: updatedData.user.level }
                                                      : m
                                                  )
                                                )
                                              }
                                              
                                              setTimeout(() => {
                                                setEditingMember(null)
                                                setSaveMessage("")
                                              }, 1500)
                                            } else {
                                              setSaveMessage("저장 실패")
                                            }
                                          } catch (error) {
                                            console.error('레벨 수정 오류:', error)
                                            setSaveMessage("오류가 발생했습니다")
                                          } finally {
                                            setIsSaving(false)
                                          }
                                        }}
                                        disabled={isSaving}
                                        size="sm"
                                        className="flex-1"
                                      >
                                        {isSaving ? "저장 중..." : "저장"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setEditingMember(null)
                                          setTempLevel(member.level || 1)
                                          setSaveMessage("")
                                        }}
                                        size="sm"
                                        className="flex-1"
                                      >
                                        취소
                                      </Button>
                                    </div>
                                    {saveMessage && (
                                      <p className={`text-xs ${
                                        saveMessage.includes('저장되었습니다') 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                      }`}>
                                        {saveMessage}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* 출석 통계 카드 */}
                            <Card className="border-l-4 border-l-orange-500">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-orange-500" />
                                  출석 통계
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-gray-700">전체 참석률</Label>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-sm px-2 py-1 font-bold">
                                        {member.attendanceRate}%
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Progress 
                                      value={member.attendanceRate} 
                                      className="h-3 bg-gray-200" 
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>0%</span>
                                      <span>50%</span>
                                      <span>100%</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-muted-foreground">
                                        {member.attendanceRate >= 80 ? '우수' : 
                                         member.attendanceRate >= 60 ? '양호' : '개선 필요'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* 관리 버튼들 (총무 전용) */}
                            {isManagerMode && (
                              <div className="flex flex-col gap-3 pt-4 border-t">
                                {/* 비활성화/활성화 버튼 */}
                                <Button
                                  variant={member.isActive ? "outline" : "default"}
                                  className={`w-full ${member.isActive ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                  onClick={async () => {
                                    try {
                                      const user = currentUser || JSON.parse(sessionStorage.getItem('user') || '{}')

                                      if (!user?.id) {
                                        alert('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
                                        return
                                      }

                                      const endpoint = '/api/user/deactivate'
                                      const method = member.isActive ? 'PUT' : 'POST'

                                      const response = await fetch(endpoint, {
                                        method,
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          targetUserId: member.id,
                                          adminUserId: user.id
                                        })
                                      })

                                      if (response.ok) {
                                        const updatedData = await response.json()
                                        if (updatedData.user) {
                                          setTeamMembers(prevMembers =>
                                            prevMembers.map(m =>
                                              m.id === member.id
                                                ? { ...m, isActive: updatedData.user.isActive }
                                                : m
                                            )
                                          )
                                        }
                                        alert(member.isActive ? '선수가 비활성화되었습니다.' : '선수가 활성화되었습니다.')
                                      } else {
                                        const error = await response.json()
                                        alert(error.error || '상태 변경에 실패했습니다.')
                                      }
                                    } catch (error) {
                                      console.error('상태 변경 중 오류:', error)
                                      alert('상태 변경 중 오류가 발생했습니다.')
                                    }
                                  }}
                                >
                                  {member.isActive ? (
                                    <>
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      비활성화
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2" />
                                      활성화
                                    </>
                                  )}
                                </Button>

                                {/* 삭제 버튼 */}
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={async () => {
                                    const confirmed = confirm(`${member.name} 선수를 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 선수의 모든 데이터가 삭제됩니다.`)
                                    if (!confirmed) return

                                    try {
                                      const user = currentUser || JSON.parse(sessionStorage.getItem('user') || '{}')
                                      const response = await fetch('/api/user/delete', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          targetUserId: member.id,
                                          adminUserId: user.id,
                                          confirmDelete: true
                                        })
                                      })

                                      if (response.ok) {
                                        setTeamMembers(prevMembers =>
                                          prevMembers.filter(m => m.id !== member.id)
                                        )
                                        alert('선수가 성공적으로 삭제되었습니다.')
                                      } else {
                                        const error = await response.json()
                                        alert(error.error || '삭제에 실패했습니다.')
                                      }
                                    } catch (error) {
                                      console.error('삭제 중 오류:', error)
                                      alert('삭제 중 오류가 발생했습니다.')
                                    }
                                  }}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  선수 삭제
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-3 pb-3 px-4 space-y-3">
                {/* 포지션 정보 */}
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">주포지션</Label>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMainPositionColor()}`}>
                        {positionFullNames[member.mainPosition || member.preferredPosition] || (member.mainPosition || member.preferredPosition)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pb-1">
                    <Label className="text-xs font-medium text-muted-foreground">부포지션</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {member.subPositions && member.subPositions.length > 0 ? (
                        member.subPositions.map((pos: string, idx: number) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSubPositionColor()}`}
                          >
                            {positionFullNames[pos] || pos}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  {/* 참석률 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">참석률 (임시)</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          ({member.attendedCount || 0}/{member.totalSchedules || 0})
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {member.attendanceRate || 0}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={member.attendanceRate || 0} 
                      className="h-2 bg-gray-200" 
                    />
                  </div>

                </div>

                <Separator />

                {/* 세부정보 - 2열 그리드 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* 전화번호 */}
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{formatPhoneNumber(member.phone)}</span>
                  </div>
                  
                  {/* 거주지역 */}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{member.region} {member.city}</span>
                  </div>

                  {/* 주발 */}
                  <div className="flex items-center gap-1.5">
                    <Footprints className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {member.preferredFoot === 'RIGHT' ? '오른발' :
                       member.preferredFoot === 'LEFT' ? '왼발' :
                       member.preferredFoot === 'BOTH' ? '양발' : '정보없음'}
                    </span>
                  </div>

                  {/* 가입일 */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">가입일: {member.joinDate}</span>
                  </div>

                  {/* 최근 참석경기 */}
                  <div className="flex items-center gap-1.5 col-span-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">
                      최근 참석일: {member.lastAttendedDate || '참석 이력 없음'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
