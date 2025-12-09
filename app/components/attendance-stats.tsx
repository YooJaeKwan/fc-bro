"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { TrendingUp, TrendingDown, Users, Calendar, Award, AlertTriangle } from 'lucide-react'

// 샘플 데이터
const monthlyAttendance = [
  { month: "1월", attendance: 85 },
  { month: "2월", attendance: 78 },
  { month: "3월", attendance: 92 },
  { month: "4월", attendance: 88 },
  { month: "5월", attendance: 76 },
  { month: "6월", attendance: 82 },
  { month: "7월", attendance: 89 },
  { month: "8월", attendance: 91 }
]

const playerStats = [
  { name: "김민수", attendance: 95, matches: 20, goals: 12, assists: 5, overallRating: 7.6 },
  { name: "박준호", attendance: 92, matches: 19, goals: 3, assists: 8, overallRating: 7.7 },
  { name: "이동현", attendance: 88, matches: 18, goals: 1, assists: 2, overallRating: 7.0 },
  { name: "최우진", attendance: 90, matches: 18, goals: 0, assists: 0, overallRating: 6.1 },
  { name: "정우성", attendance: 75, matches: 15, goals: 8, assists: 3, overallRating: 7.2 },
  { name: "한지민", attendance: 73, matches: 14, goals: 2, assists: 6, overallRating: 6.8 },
  { name: "송민호", attendance: 71, matches: 14, goals: 0, assists: 1, overallRating: 6.5 },
  { name: "김태현", attendance: 69, matches: 13, goals: 1, assists: 0, overallRating: 6.3 },
  { name: "이준석", attendance: 68, matches: 13, goals: 1, assists: 4, overallRating: 6.9 },
  { name: "박성호", attendance: 65, matches: 12, goals: 4, assists: 1, overallRating: 6.4 }
]

const attendanceDistribution = [
  { name: "90% 이상", value: 4, color: "#22c55e" },
  { name: "80-89%", value: 3, color: "#3b82f6" },
  { name: "70-79%", value: 2, color: "#f59e0b" },
  { name: "70% 미만", value: 1, color: "#ef4444" }
]

interface AttendanceStatsProps {
  isManagerMode: boolean
}

export function AttendanceStats({ isManagerMode }: AttendanceStatsProps) {
  const averageAttendance = Math.round(
    playerStats.reduce((sum, player) => sum + player.attendance, 0) / playerStats.length
  )

  const highAttendancePlayers = playerStats.filter(p => p.attendance >= 90)
  const lowAttendancePlayers = playerStats.filter(p => p.attendance < 70)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold">참석률 및 통계</h2>
        <p className="text-muted-foreground">
          {isManagerMode ? "팀원들의 참석률과 경기 통계를 확인하세요" : "팀의 참석률과 경기 통계를 확인하세요"}
        </p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 참석률</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>전월 대비 +3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 일정</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8회</div>
            <p className="text-xs text-muted-foreground">자체경기 3회, A매치 2회, 연습 3회</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">우수 출석자</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highAttendancePlayers.length}명</div>
            <p className="text-xs text-muted-foreground">90% 이상 출석</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 참석률 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 참석률 추이</CardTitle>
            <CardDescription>2025년 팀 전체 참석률 변화</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 참석률 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>참석률 분포</CardTitle>
            <CardDescription>팀원별 참석률 구간 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}명`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 개별 선수 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>개별 선수 통계</CardTitle>
          <CardDescription>선수별 참석률, 경기 참여 및 기록 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerStats.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{player.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.matches}회 참여
                      {isManagerMode && ` | 종합 ${player.overallRating}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{player.attendance}%</p>
                    <Progress value={player.attendance} className="w-20 h-2" />
                  </div>
                  <Badge 
                    variant={player.attendance >= 90 ? "default" : player.attendance >= 80 ? "secondary" : player.attendance >= 70 ? "outline" : "destructive"}
                  >
                    {player.attendance >= 90 ? "우수" : player.attendance >= 80 ? "양호" : player.attendance >= 70 ? "보통" : "관리필요"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 관리 권고사항 - 총무 모드에서만 표시 */}
      {isManagerMode && lowAttendancePlayers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              관리 권고사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 mb-3">
              다음 선수들의 참석률이 70% 미만입니다. 개별 상담을 통해 참여도를 높이거나 팀 정리를 고려해보세요.
            </p>
            <div className="flex flex-wrap gap-2">
              {lowAttendancePlayers.map((player, index) => (
                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                  {player.name} ({player.attendance}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
