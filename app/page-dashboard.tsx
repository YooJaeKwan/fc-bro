"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut,
  Users,
  ClipboardList,
  Image as ImageIcon,
} from "lucide-react"
import { UserProfile } from "./components/user-profile"
import { DashboardHome } from "./components/dashboard-home"
import { Announcements } from "./components/announcements"
import { TeamDashboard } from "./components/team-dashboard"
import { BottomNav, type MainTab } from "./components/bottom-nav"

// 무거운 컴포넌트 동적 로딩
const TeamManagement = dynamic(
  () => import("./components/team-management").then(mod => ({ default: mod.TeamManagement })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)
const AttendanceStatsView = dynamic(
  () => import("./components/attendance-stats-view").then(mod => ({ default: mod.AttendanceStatsView })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)
const MatchSchedulePage = dynamic(
  () => import("./components/match-schedule").then(mod => ({ default: mod.MatchSchedule })),
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

// 메인 탭 라벨
const tabLabels: Record<MainTab, string> = {
  home: "홈",
  schedule: "경기일정",
  team: "팀",
  ranking: "랭킹",
  profile: "내 정보",
}

interface DashboardProps {
  userInfo?: any
  onUserUpdate?: (updatedUser: any) => void
  onLogout?: () => void
}

// Team 탭 내부 서브탭
type TeamSubTab = 'members' | 'attendance' | 'album'

export default function Dashboard({ userInfo, onUserUpdate, onLogout }: DashboardProps) {
  const [user, setUser] = useState(userInfo || {
    realName: "데모 사용자",
    nickname: "데모 사용자",
    preferredPosition: "ST",
    region: "서울"
  })

  const handleUserUpdate = (updatedUser: any) => {
    console.log('사용자 정보 업데이트:', updatedUser)
    setUser(updatedUser)
    setIsManagerMode(updatedUser?.role === 'ADMIN')
    onUserUpdate?.(updatedUser)
  }

  useEffect(() => {
    setIsManagerMode(user?.role === 'ADMIN')
  }, [user?.role])

  const [activeTab, setActiveTab] = useState<MainTab>("home")
  const [teamSubTab, setTeamSubTab] = useState<TeamSubTab>("members")
  const [isManagerMode, setIsManagerMode] = useState(user?.role === 'ADMIN')

  // Team 서브탭 아이템
  const teamSubTabs = [
    { value: "members" as TeamSubTab, label: "멤버", icon: Users },
    ...(isManagerMode ? [{ value: "attendance" as TeamSubTab, label: "출석부", icon: ClipboardList }] : []),
    { value: "album" as TeamSubTab, label: "앨범", icon: ImageIcon },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header - 간소화 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={defaultTeamInfo.emblem || "/placeholder.svg"} alt="Team Logo" />
                <AvatarFallback>FC</AvatarFallback>
              </Avatar>
              <h1 className="text-lg font-bold text-gray-900">
                {tabLabels[activeTab]}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`text-xs ${user?.role === 'ADMIN' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}
              >
                {user?.role === 'ADMIN' ? "총무" : "선수"}
              </Badge>
              <Announcements isManagerMode={isManagerMode} currentUser={user} />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onLogout ? onLogout() : window.location.reload()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24">
        {/* Home */}
        {activeTab === 'home' && (
          <DashboardHome currentUser={user} onUserUpdate={handleUserUpdate} isManagerMode={isManagerMode} />
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <MatchSchedulePage isManagerMode={isManagerMode} currentUser={user} />
        )}

        {/* Team - 서브탭 포함 */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            {/* Team 서브탭 네비게이션 */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {teamSubTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = teamSubTab === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setTeamSubTab(tab.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Team 서브탭 콘텐츠 */}
            {teamSubTab === 'members' && (
              <TeamManagement isManagerMode={isManagerMode} currentUser={user} />
            )}
            {teamSubTab === 'attendance' && isManagerMode && (
              <AttendanceStatsView />
            )}
            {teamSubTab === 'album' && (
              <AlbumView />
            )}
          </div>
        )}

        {/* Ranking */}
        {activeTab === 'ranking' && (
          <TeamDashboard currentUser={user} />
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
          <UserProfile userInfo={user} onUserUpdate={handleUserUpdate} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
