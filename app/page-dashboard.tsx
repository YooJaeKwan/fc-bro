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
  BarChart3,
  Settings,
  ScrollText,
} from "lucide-react"
import { UserProfile } from "./components/user-profile"
import { DashboardHome } from "./components/dashboard-home"
import { PersonalRecord } from "./components/personal-record"
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
const TeamRules = dynamic(
  () => import("./components/team-rules").then(mod => ({ default: mod.TeamRules })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)
const FormationPage = dynamic<{ currentUser: any }>(
  () => import("./components/formation-page").then(mod => ({ default: mod.FormationPage })),
  { loading: () => <div className="animate-pulse p-8 text-center text-muted-foreground">로딩 중...</div> }
)

// 기본 팀 정보 (고정값)
const defaultTeamInfo = {
  name: "FC BRO",
  emblem: "/fc-bro-emblem.jpg",
}

// 메인 탭 라벨
const tabLabels: Record<MainTab, string> = {
  home: "Home",
  schedule: "Schedule",
  team: "Team",
  formation: "Tactics",
  ranking: "Ranking",
  profile: "My",
}

interface DashboardProps {
  userInfo?: any
  onUserUpdate?: (updatedUser: any) => void
  onLogout?: () => void
}

// Team 탭 내부 서브탭
type TeamSubTab = 'members' | 'attendance' | 'album' | 'rules'
type ProfileSubTab = 'record' | 'info'

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

  const [activeTab, setActiveTab] = useState<MainTab>("schedule")
  const [teamSubTab, setTeamSubTab] = useState<TeamSubTab>("members")
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("record")
  const [isManagerMode, setIsManagerMode] = useState(user?.role === 'ADMIN')

  // Team 서브탭 아이템
  const teamSubTabs = [
    { value: "members" as TeamSubTab, label: "멤버", icon: Users },
    { value: "attendance" as TeamSubTab, label: "출석부", icon: ClipboardList },
    { value: "album" as TeamSubTab, label: "앨범", icon: ImageIcon },
    { value: "rules" as TeamSubTab, label: "회칙", icon: ScrollText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header - Glassmorphism Design */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9 border-2 border-slate-100 shadow-sm">
                <AvatarImage src={defaultTeamInfo.emblem || "/placeholder.svg"} alt="Team Logo" />
                <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">FC</AvatarFallback>
              </Avatar>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                {activeTab === 'home' ? 'FC BRO' : (tabLabels[activeTab] || activeTab.toUpperCase())}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Layout Order: Announcements -> Profile -> Name */}
              <div className="flex items-center gap-1">
                <Announcements isManagerMode={isManagerMode} currentUser={user} />
              </div>
              
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/60">
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full blur-[2px] opacity-70"></div>
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm relative transition-transform duration-200 group-hover:scale-105">
                    <AvatarImage src={user?.profileImage || "/placeholder.svg"} alt="User Profile" />
                    <AvatarFallback className="bg-slate-50 text-slate-400 text-xs font-bold">
                      {(user?.realName || user?.nickname)?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {user?.jerseyNumber && (
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {user.jerseyNumber}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start min-w-0 pr-1">
                  <span className="text-[13px] font-black text-slate-800 leading-tight truncate max-w-[80px]">
                    {user?.realName || user?.nickname}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {user?.role === 'ADMIN' ? "ADMIN" : "PLAYER"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-28">
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
            {teamSubTab === 'attendance' && (
              <AttendanceStatsView />
            )}
            {teamSubTab === 'album' && (
              <AlbumView />
            )}
            {teamSubTab === 'rules' && (
              <TeamRules />
            )}
          </div>
        )}

        {/* Ranking */}
        {activeTab === 'ranking' && (
          <TeamDashboard currentUser={user} />
        )}

        {/* Formation */}
        {activeTab === 'formation' && (
          <FormationPage currentUser={user} />
        )}

        {/* My */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* My 서브탭 네비게이션 */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { value: 'record' as ProfileSubTab, label: 'Record', icon: BarChart3 },
                { value: 'info' as ProfileSubTab, label: 'Info', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = profileSubTab === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setProfileSubTab(tab.value)}
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

            {/* My 서브탭 콘텐츠 */}
            {profileSubTab === 'record' && (
              <PersonalRecord currentUser={user} />
            )}
            {profileSubTab === 'info' && (
              <UserProfile userInfo={user} onUserUpdate={handleUserUpdate} onLogout={onLogout} />
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isManagerMode={isManagerMode} />
    </div>
  )
}
