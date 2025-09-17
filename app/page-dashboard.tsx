"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Calendar,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  UserCheck,
  Target,
  BarChart3,
  Settings,
  Shield,
  User,
  Award,
  Menu,
  Star,
  LogOut,
} from "lucide-react"
import { TeamManagement } from "./components/team-management"
import { ScheduleManagement } from "./components/schedule-management"
import { TeamFormation } from "./components/team-formation"
import { AttendanceStats } from "./components/attendance-stats"
import { TeamSettings } from "./components/team-settings"
import { UserProfile } from "./components/user-profile"
// import { useSession, signOut } from "next-auth/react" // NextAuth 제거됨

// 기본 팀 정보 (고정값)
const defaultTeamInfo = {
  name: "FC BRO",
  emblem: "/fc-bro-emblem.jpg",
  skillCategories: ["속도", "패스", "수비", "슈팅", "드리블", "체력", "멘탈"]
}

interface DashboardProps {
  userInfo?: any
  onUserUpdate?: (updatedUser: any) => void
}

export default function Dashboard({ userInfo, onUserUpdate }: DashboardProps) {
  // 실제 사용자 정보 사용
  const [user, setUser] = useState(userInfo || {
    realName: "데모 사용자",
    nickname: "데모 사용자",
    preferredPosition: "ST",
    region: "서울"
  })

  // 대시보드 데이터 상태
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState("")

  // 사용자 정보 업데이트 핸들러
  const handleUserUpdate = (updatedUser: any) => {
    console.log('사용자 정보 업데이트:', updatedUser)
    setUser(updatedUser)
    // role이 변경되었을 때 관리자 모드도 업데이트
    setIsManagerMode(updatedUser?.role === 'ADMIN')
    // 상위 컴포넌트에도 알림
    onUserUpdate?.(updatedUser)
  }

  // 사용자 role 변경 시 관리자 모드 업데이트
  useEffect(() => {
    setIsManagerMode(user?.role === 'ADMIN')
  }, [user?.role])

  // 대시보드 데이터 로드
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsDashboardLoading(true)
      console.log('대시보드 데이터 로딩 중...')

      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '대시보드 데이터를 가져올 수 없습니다.')
      }

      console.log('대시보드 데이터 로드 성공:', result.data)
      setDashboardData(result.data)
      setDashboardError("")

    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error)
      setDashboardError(error instanceof Error ? error.message : '대시보드 데이터 조회 중 오류가 발생했습니다.')
    } finally {
      setIsDashboardLoading(false)
    }
  }
  const [activeTab, setActiveTab] = useState("schedule")
  // 사용자 role 기반으로 관리자 모드 결정 (DB에서 ADMIN 권한 확인)
  const [isManagerMode, setIsManagerMode] = useState(user?.role === 'ADMIN')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 팀 편성 결과를 저장할 상태
  const [formedTeamA, setFormedTeamA] = useState<any[]>([])
  const [formedTeamB, setFormedTeamB] = useState<any[]>([])
  const [formedBench, setFormedBench] = useState<any[]>([])
  const [isTeamFormationComplete, setIsTeamFormationComplete] = useState(false)

  const tabItems = [
    { value: "schedule", label: "일정 관리", icon: Calendar },
    { value: "dashboard", label: "팀 대시보드", icon: BarChart3 },
    { value: "profile", label: "내 정보", icon: User },
    { value: "team", label: "팀원 관리", icon: Users },
    ...(isManagerMode ? [{ value: "formation", label: "팀 편성", icon: Target }] : []),
    { value: "stats", label: "출석/통계", icon: TrendingUp },
    ...(isManagerMode ? [{ value: "settings", label: "팀 설정", icon: Settings }] : []),
  ]

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

  const calculateTeamLevel = (team: any[]) => {
    if (team.length === 0) return 0
    const total = team.reduce((sum, player) => sum + (player.level || 1), 0)
    return Math.round(total / team.length * 10) / 10 // 소수점 1자리
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={defaultTeamInfo.emblem || "/placeholder.svg"} alt="Team Logo" />
                <AvatarFallback>FC</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">{defaultTeamInfo.name}</h1>
                {/* <p className="text-sm text-gray-500">팀 관리 플랫폼</p> */}
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">FC BRO</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                  <AvatarFallback>{(user?.realName || user?.nickname)?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{user?.realName || user?.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    #{user?.jerseyNumber}
                    {/* {user?.subPositions && user.subPositions.length > 0 && 
                      ` (+ ${user.subPositions.join(', ')})`
                    } • {user?.region} {user?.city}
                    {user?.preferredFoot && ` • ${user.preferredFoot === 'RIGHT' ? '오른발' : user.preferredFoot === 'LEFT' ? '왼발' : '양발'}`} */}
                  </p>
                </div>
              </div>
              {/* Role 기반 권한 표시 */}
              <Badge
                variant="outline"
                className={user?.role === 'ADMIN' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}
              >
                {user?.role === 'ADMIN' ? "총무" : "선수"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`text-xs ${user?.role === 'ADMIN' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}
              >
                {user?.role === 'ADMIN' ? "총무" : "선수"}
              </Badge>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>메뉴</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 py-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 pb-4 border-b">
                      <Avatar>
                        <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                        <AvatarFallback>{(user?.realName || user?.nickname)?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user?.realName || user?.nickname}</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.preferredPosition}
                          {user?.subPositions && user.subPositions.length > 0 && 
                            ` (+ ${user.subPositions.join(', ')})`
                          }
                           {/* • {user?.region} {user?.city} */}
                          {/* {user?.preferredFoot && ` • ${user.preferredFoot === 'RIGHT' ? '오른발' : user.preferredFoot === 'LEFT' ? '왼발' : '양발'}`} */}
                        </p>
                      </div>
                    </div>

                    {/* Role 기반 권한 표시 */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">권한 정보</h3>
                      <div className="flex items-center justify-center">
                        <Badge
                          variant="outline"
                          className={user?.role === 'ADMIN' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}
                        >
                          {user?.role === 'ADMIN' ? (
                            <><Shield className="h-4 w-4 mr-2" />총무</>
                          ) : (
                            <><User className="h-4 w-4 mr-2" />선수</>
                          )}
                        </Badge>
                      </div>
                      {user?.role !== 'ADMIN' && (
                        <p className="text-xs text-muted-foreground text-center">
                          총무 권한이 필요한 기능은 표시되지 않습니다.
                        </p>
                      )}
                    </div>

                    {/* Navigation Menu */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">메뉴</h3>
                      {tabItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Button
                            key={item.value}
                            variant={activeTab === item.value ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              setActiveTab(item.value)
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Button>
                        )
                      })}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.reload()}>
                        <LogOut className="h-4 w-4 mr-2" />
                        로그아웃
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto">
              {tabItems.map((item) => {
                const Icon = item.icon
                return (
                  <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* Mobile Tab Indicator */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                {tabItems.find((item) => item.value === activeTab)?.label}
              </h2>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {/* 로딩 상태 */}
            {isDashboardLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : dashboardError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-red-500">{dashboardError}</div>
                    <Button onClick={fetchDashboardData}>다시 시도</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 주요 지표 카드들 - 실제 데이터 기반 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">총 팀원</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData?.team?.totalMembers || 0}명</div>
                      <p className="text-xs text-muted-foreground">활성 멤버 {dashboardData?.team?.activeMembers || 0}명</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData?.recentStats?.attendanceRate || 0}%</div>
                      <Progress value={dashboardData?.recentStats?.attendanceRate || 0} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        총 {dashboardData?.recentStats?.totalSchedules || 0}개 일정 기준
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">다음 경기</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.upcomingMatch ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-2xl font-bold">
                              {dashboardData.upcomingMatch.daysLeft === 0 ? (
                                <span className="text-red-600">D-DAY</span>
                              ) : dashboardData.upcomingMatch.daysLeft === 1 ? (
                                <span className="text-orange-600">D-1</span>
                              ) : dashboardData.upcomingMatch.daysLeft > 0 ? (
                                `D-${dashboardData.upcomingMatch.daysLeft}`
                              ) : (
                                <span className="text-gray-500">지남</span>
                              )}
                            </div>
                            {dashboardData.upcomingMatch.type === 'match' && (
                              <Badge variant="destructive" className="text-xs">A매치</Badge>
                            )}
                            {dashboardData.upcomingMatch.type === 'internal' && (
                              <Badge variant="default" className="text-xs">자체경기</Badge>
                            )}
                            {dashboardData.upcomingMatch.type === 'training' && (
                              <Badge variant="secondary" className="text-xs">연습</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Intl.DateTimeFormat('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            }).format(new Date(dashboardData.upcomingMatch.date))} {dashboardData.upcomingMatch.time}
                          </p>
                          <p className="text-xs text-muted-foreground truncate whitespace-pre-line">
                            {`${dashboardData.upcomingMatch.location}\n${dashboardData.upcomingMatch.time}`}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-gray-400">-</div>
                          <p className="text-xs text-muted-foreground">예정된 경기 없음</p>
                          <p className="text-xs text-blue-600 mt-1 cursor-pointer" onClick={() => setActiveTab("schedule")}>
                            일정 추가하기 →
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* 다음 경기 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    다음 경기 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData?.upcomingMatch ? (
                    <div className="space-y-4">
                      {/* D-Day 표시 */}
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                          <Calendar className="h-4 w-4" />
                          {dashboardData.upcomingMatch.daysLeft === 0 ? (
                            <span className="text-red-600 font-bold">오늘 경기!</span>
                          ) : dashboardData.upcomingMatch.daysLeft === 1 ? (
                            <span className="text-orange-600 font-bold">내일 경기!</span>
                          ) : dashboardData.upcomingMatch.daysLeft > 0 ? (
                            <span>D-{dashboardData.upcomingMatch.daysLeft}</span>
                          ) : (
                            <span className="text-gray-500">지난 경기</span>
                          )}
                        </div>
                      </div>

                      {/* 경기 제목 */}
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 whitespace-pre-line">
                          {`${dashboardData.upcomingMatch.location}\n${dashboardData.upcomingMatch.time}`}
                        </h3>
                        {dashboardData.upcomingMatch.type === 'match' && (
                          <Badge variant="destructive" className="mb-2">A매치</Badge>
                        )}
                        {dashboardData.upcomingMatch.type === 'internal' && (
                          <Badge variant="default" className="mb-2">자체경기</Badge>
                        )}
                        {dashboardData.upcomingMatch.type === 'training' && (
                          <Badge variant="secondary" className="mb-2">연습</Badge>
                        )}
                      </div>

                      {/* 경기 세부 정보 - 중복 제거 후 간소화 */}
                      <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">
                              {new Intl.DateTimeFormat('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short'
                              }).format(new Date(dashboardData.upcomingMatch.date))}
                            </div>
                            <div className="text-muted-foreground">집합: {dashboardData.upcomingMatch.gatherTime}</div>
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
                              {dashboardData.upcomingMatch.attendees}/{dashboardData.upcomingMatch.total}명
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({dashboardData.upcomingMatch.attendanceRate}%)
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={dashboardData.upcomingMatch.attendanceRate}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">예정된 경기가 없습니다.</p>
                    </div>
                  )}
                  {isManagerMode && (
                    <Button className="w-full mt-4" onClick={() => setActiveTab("formation")}>
                      팀 편성하기
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* 우수 선수 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5" />
                    올해 우수 출석왕
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {isDashboardLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      ))
                    ) : dashboardData?.topAttendancePlayers?.length > 0 ? (
                      dashboardData.topAttendancePlayers.map((player: any, index: number) => (
                        <div key={player.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{player.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{player.name}</p>
                              <p className="text-xs text-muted-foreground">{player.position}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{player.attendanceRate}%</p>
                            <p className="text-xs text-muted-foreground">{player.totalMatches}경기 참여</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">아직 출석 데이터가 부족합니다.</p>
                        <p className="text-xs">일정 참석 후 출석왕이 선정됩니다.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 편성된 팀 표시 (대시보드) */}
            {isTeamFormationComplete && (formedTeamA.length > 0 || formedTeamB.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    최근 편성된 팀
                  </CardTitle>
                  <CardDescription>가장 최근에 편성된 팀 정보입니다.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team A Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <h4 className="font-medium text-base">Team A ({formedTeamA.length}명)</h4>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm font-medium">{calculateTeamLevel(formedTeamA)}점</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {formedTeamA.map((player) => (
                        <div key={player.id} className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                          <Badge className={getPositionColor(player.mainPosition)} variant="outline" size="sm">
                            {player.mainPosition}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team B Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <h4 className="font-medium text-base">Team B ({formedTeamB.length}명)</h4>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm font-medium">{calculateTeamLevel(formedTeamB)}점</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {formedTeamB.map((player) => (
                        <div key={player.id} className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                          <Badge className={getPositionColor(player.mainPosition)} variant="outline" size="sm">
                            {player.mainPosition}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bench Summary */}
                  {formedBench.length > 0 && (
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                        <h4 className="font-medium text-base">벤치 ({formedBench.length}명)</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formedBench.map((player) => (
                          <Badge key={player.id} variant="secondary" className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                            </Avatar>
                            {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 최근 활동 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">최근 활동</CardTitle>
                <CardDescription>팀의 최근 활동 내역을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                {isDashboardLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                        <div className="h-2 w-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 w-12 bg-gray-300 rounded flex-shrink-0"></div>
                      </div>
                    ))}
                  </div>
                ) : dashboardData?.recentActivities?.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {dashboardData.recentActivities.map((activity, index) => (
                      <div key={index} className={`flex items-start gap-3 sm:gap-4 p-3 rounded-lg ${
                        activity.color === 'blue' ? 'bg-blue-50' :
                        activity.color === 'orange' ? 'bg-orange-50' :
                        activity.color === 'green' ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.color === 'blue' ? 'bg-blue-500' :
                          activity.color === 'orange' ? 'bg-orange-500' :
                          activity.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        </div>
                        <Badge 
                          variant={activity.color === 'green' ? 'secondary' : 'outline'} 
                          className="flex-shrink-0"
                        >
                          {activity.badge}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <div className="h-8 w-8 mx-auto mb-2 text-gray-300">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <p className="text-sm">최근 활동이 없습니다.</p>
                    <p className="text-xs">팀원이 가입하거나 일정이 등록되면 여기에 표시됩니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile userInfo={user} onUserUpdate={handleUserUpdate} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement isManagerMode={isManagerMode} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleManagement 
              isManagerMode={isManagerMode} 
              currentUser={user}
              onSwitchToFormation={() => setActiveTab("formation")}
            />
          </TabsContent>

          {isManagerMode && (
            <TabsContent value="formation">
              <TeamFormation
                setTeamA={setFormedTeamA}
                setTeamB={setFormedTeamB}
                setBench={setFormedBench}
                setIsFormationComplete={setIsTeamFormationComplete}
                teamA={formedTeamA}
                teamB={formedTeamB}
                bench={formedBench}
                isFormationComplete={isTeamFormationComplete}
              />
            </TabsContent>
          )}

          <TabsContent value="stats">
            <AttendanceStats isManagerMode={isManagerMode} />
          </TabsContent>

          {isManagerMode && (
            <TabsContent value="settings">
              <TeamSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
