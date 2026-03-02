"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Users,
  User,
  Menu,
  LogOut,
  BarChart3,
  Calendar,
  Trophy,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react"
import { UserProfile } from "./components/user-profile"
import { AttendanceStats } from "./components/attendance-stats"
import { MatchResultsView } from "./components/match-results-view"
import { DashboardHome } from "./components/dashboard-home"
import { Announcements } from "./components/announcements"
import { TeamDashboard } from "./components/team-dashboard"

// 무거운 컴포넌트 동적 로딩 (탭 전환 시에만 로드)
const TeamManagement = dynamic(
  () => import("./components/team-management").then(mod => ({ default: mod.TeamManagement })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)
const ScheduleManagement = dynamic(
  () => import("./components/schedule-management").then(mod => ({ default: mod.ScheduleManagement })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)
const AttendanceStatsView = dynamic(
  () => import("./components/attendance-stats-view").then(mod => ({ default: mod.AttendanceStatsView })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)
const AlbumView = dynamic(
  () => import("./components/album-view").then(mod => ({ default: mod.AlbumView })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)

// 기본 팀 정보 (고정값)
const defaultTeamInfo = {
  name: "FC BRO",
  emblem: "/fc-bro-emblem.jpg",
}

interface DashboardProps {
  userInfo?: any
  onUserUpdate?: (updatedUser: any) => void
  onLogout?: () => void
}

export default function Dashboard({ userInfo, onUserUpdate, onLogout }: DashboardProps) {
  // 실제 사용자 정보 사용
  const [user, setUser] = useState(userInfo || {
    realName: "데모 사용자",
    nickname: "데모 사용자",
    preferredPosition: "ST",
    region: "서울"
  })

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

  const [activeTab, setActiveTab] = useState("dashboard")
  // 사용자 role 기반으로 관리자 모드 결정 (DB에서 ADMIN 권한 확인)
  const [isManagerMode, setIsManagerMode] = useState(user?.role === 'ADMIN')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


  const tabItems = [
    { value: "dashboard", label: "대시보드", icon: BarChart3 },
    { value: "team-stats", label: "팀 랭킹", icon: Trophy },
    { value: "team", label: "팀 멤버", icon: Users },
    { value: "schedule", label: "경기예정", icon: Calendar },
    { value: "results", label: "경기결과", icon: ClipboardList },
    ...(isManagerMode ? [
      { value: "attendance", label: "출석부", icon: Users }
    ] : []),
    { value: "album", label: "앨범", icon: ImageIcon },
    { value: "profile", label: "내 정보", icon: User },
  ]



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
                <h1 className="text-xl font-bold text-gray-900">
                  {tabItems.find(item => item.value === activeTab)?.label || defaultTeamInfo.name}
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">
                  {tabItems.find(item => item.value === activeTab)?.label || "FC BRO"}
                </h1>
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
              {/* 공지사항 알림 */}
              <Announcements isManagerMode={isManagerMode} currentUser={user} />
              <Button variant="ghost" size="sm" onClick={() => onLogout ? onLogout() : window.location.reload()}>
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
              {/* 모바일 공지사항 알림 */}
              <Announcements isManagerMode={isManagerMode} currentUser={user} />
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
                          {user?.jerseyNumber && <span className="mr-1">#{user.jerseyNumber}</span>}
                          {user?.preferredPosition}
                          {user?.subPositions && user.subPositions.length > 0 &&
                            ` (+${user.subPositions.join(',')})`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Navigation Menu */}
                    <div className="space-y-2">
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
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => onLogout ? onLogout() : window.location.reload()}>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <TabsList className="flex w-auto gap-1">
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
          {/* 대시보드 */}
          <TabsContent value="dashboard" className="mt-6">
            <DashboardHome currentUser={user} onUserUpdate={handleUserUpdate} isManagerMode={isManagerMode} />
          </TabsContent>

          <TabsContent value="team-stats" className="mt-6">
            <TeamDashboard currentUser={user} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleManagement isManagerMode={isManagerMode} currentUser={user} viewMode="upcoming" />
          </TabsContent>

          <TabsContent value="results">
            <ScheduleManagement isManagerMode={isManagerMode} currentUser={user} viewMode="past" />
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <AttendanceStatsView />
          </TabsContent>

          <TabsContent value="album" className="mt-6">
            <AlbumView />
          </TabsContent>

          {/* 팀 멤버 */}
          <TabsContent value="team" className="mt-6">
            <TeamManagement isManagerMode={isManagerMode} currentUser={user} />
          </TabsContent>

          {/* 내 정보 */}
          <TabsContent value="profile" className="mt-6">
            <UserProfile userInfo={user} onUserUpdate={handleUserUpdate} />
          </TabsContent>

        </Tabs>
      </div>
    </div >
  )
}
