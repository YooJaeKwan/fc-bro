"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shuffle, Users, Target, Star, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'

// 참석자 기반 선수 데이터 (대/중분류 포지션 적용)
const attendingPlayers = [
  { id: 1, name: "김민수", mainPosition: "공격수", subPositions: ["CF", "LW", "RW"], overallRating: 7.6, attending: true },
  { id: 2, name: "박준호", mainPosition: "미드필더", subPositions: ["CM", "CAM", "CDM"], overallRating: 7.7, attending: true },
  { id: 3, name: "이동현", mainPosition: "수비수", subPositions: ["CB", "RB", "LB"], overallRating: 7.0, attending: true },
  { id: 4, name: "최우진", mainPosition: "골키퍼", subPositions: ["GK"], overallRating: 6.1, attending: true },
  { id: 5, name: "정우성", mainPosition: "공격수", subPositions: ["CF", "RW"], overallRating: 7.2, attending: true },
  { id: 6, name: "한지민", mainPosition: "미드필더", subPositions: ["CM", "LM"], overallRating: 6.8, attending: true },
  { id: 7, name: "송민호", mainPosition: "수비수", subPositions: ["CB", "LB"], overallRating: 6.5, attending: true },
  { id: 8, name: "김태현", mainPosition: "수비수", subPositions: ["CB", "RB"], overallRating: 6.3, attending: true },
  { id: 9, name: "이준석", mainPosition: "미드필더", subPositions: ["CDM", "CM"], overallRating: 6.9, attending: true },
  { id: 10, name: "박성호", mainPosition: "공격수", subPositions: ["ST", "LW"], overallRating: 6.4, attending: true },
  { id: 11, name: "윤상철", mainPosition: "수비수", subPositions: ["RB", "CB"], overallRating: 6.0, attending: true },
  { id: 12, name: "조현우", mainPosition: "골키퍼", subPositions: ["GK"], overallRating: 5.8, attending: true }
]

interface TeamFormationProps {
  setTeamA: (team: any[]) => void;
  setTeamB: (team: any[]) => void;
  setBench: (bench: any[]) => void;
  setIsFormationComplete: (isComplete: boolean) => void;
  teamA: any[];
  teamB: any[];
  bench: any[];
  isFormationComplete: boolean;
}

export function TeamFormation({ setTeamA, setTeamB, setBench, setIsFormationComplete, teamA, teamB, bench, isFormationComplete }: TeamFormationProps) {
  // 상태는 이제 부모 컴포넌트(app/page.tsx)에서 관리하고 props로 받습니다.

  // 개선된 팀 편성 알고리즘: 1. 인원수 우선 2. 포지션 균형 3. 실력 균형
  const autoFormTeams = () => {
    const players = [...attendingPlayers]
    const totalPlayers = players.length
    const playersPerTeam = Math.floor(totalPlayers / 2)
    
    // 1단계: 포지션별로 그룹화 및 실력순 정렬
    const playersByPosition = {
      "골키퍼": players.filter(p => p.mainPosition === "골키퍼").sort((a, b) => b.overallRating - a.overallRating),
      "수비수": players.filter(p => p.mainPosition === "수비수").sort((a, b) => b.overallRating - a.overallRating),
      "미드필더": players.filter(p => p.mainPosition === "미드필더").sort((a, b) => b.overallRating - a.overallRating),
      "공격수": players.filter(p => p.mainPosition === "공격수").sort((a, b) => b.overallRating - a.overallRating)
    }

    const teamAPlayers = []
    const teamBPlayers = []
    const benchPlayers = []

    // 2단계: 각 포지션별로 균등 배분 (지그재그 방식으로 실력 균형)
    Object.keys(playersByPosition).forEach(position => {
      const positionPlayers = playersByPosition[position]
      
      for (let i = 0; i < positionPlayers.length; i++) {
        const player = positionPlayers[i]
        
        // 팀 A와 B의 현재 인원수 확인
        if (teamAPlayers.length < playersPerTeam && teamBPlayers.length < playersPerTeam) {
          // 지그재그 배정으로 실력 균형 맞추기
          if (i % 2 === 0) {
            teamAPlayers.push(player)
          } else {
            teamBPlayers.push(player)
          }
        } else if (teamAPlayers.length < playersPerTeam) {
          teamAPlayers.push(player)
        } else if (teamBPlayers.length < playersPerTeam) {
          teamBPlayers.push(player)
        } else {
          benchPlayers.push(player)
        }
      }
    })

    // 3단계: 세부 포지션 고려한 미세 조정 (현재는 간단한 로직, 필요시 복잡도 증가)
    const adjustTeamBalance = (team) => {
      // 이 부분은 현재는 단순히 팀을 반환하지만,
      // 실제로는 세부 포지션 분포를 분석하여 선수 교환 등을 통해 균형을 맞추는 로직이 들어갈 수 있습니다.
      return team
    }

    setTeamA(adjustTeamBalance(teamAPlayers))
    setTeamB(adjustTeamBalance(teamBPlayers))
    setBench(benchPlayers)
    setIsFormationComplete(false)
  }

  const resetFormation = () => {
    setTeamA([])
    setTeamB([])
    setBench([])
    setIsFormationComplete(false)
  }

  const completeFormation = () => {
    setIsFormationComplete(true)
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case "골키퍼": return "bg-yellow-100 text-yellow-800"
      case "수비수": return "bg-blue-100 text-blue-800"
      case "미드필더": return "bg-green-100 text-green-800"
      case "공격수": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const calculateTeamRating = (team: any[]) => {
    if (team.length === 0) return 0
    const total = team.reduce((sum, player) => sum + player.overallRating, 0)
    return (total / team.length).toFixed(1)
  }

  const getPositionCount = (team: any[], position: string) => {
    return team.filter(p => p.mainPosition === position).length
  }

  const getTeamBalance = () => {
    const teamACount = teamA.length
    const teamBCount = teamB.length
    const difference = Math.abs(teamACount - teamBCount)
    
    return {
      isBalanced: difference <= 1,
      difference,
      teamACount,
      teamBCount
    }
  }

  const balance = getTeamBalance()

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">팀 편성</h2>
          <p className="text-muted-foreground">참석자를 기반으로 균형잡힌 팀을 구성하세요</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={autoFormTeams} disabled={isFormationComplete}>
            <Shuffle className="h-4 w-4 mr-2" />
            자동 편성
          </Button>
          <Button variant="outline" onClick={resetFormation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
        </div>
      </div>

      {/* 편성 우선순위 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">편성 우선순위</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <span className="font-medium">동일한 인원수로 분배</span>
              <span className="text-muted-foreground">- 가장 중요</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <span className="font-medium">대분류 포지션 균형</span>
              <span className="text-muted-foreground">- 골키퍼, 수비수, 미드필더, 공격수</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <span className="font-medium">세부 포지션 고려</span>
              <span className="text-muted-foreground">- CB, LB, RB 등</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <span className="font-medium">실력 균형</span>
              <span className="text-muted-foreground">- 종합 점수 비슷하게</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 참석자 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            참석자 현황
          </CardTitle>
          <CardDescription>
            총 {attendingPlayers.length}명 참석 예정 | 평균 실력: {(attendingPlayers.reduce((sum, p) => sum + p.overallRating, 0) / attendingPlayers.length).toFixed(1)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-600">
                {attendingPlayers.filter(p => p.mainPosition === "골키퍼").length}
              </div>
              <div className="text-sm text-muted-foreground">골키퍼</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {attendingPlayers.filter(p => p.mainPosition === "수비수").length}
              </div>
              <div className="text-sm text-muted-foreground">수비수</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {attendingPlayers.filter(p => p.mainPosition === "미드필더").length}
              </div>
              <div className="text-sm text-muted-foreground">미드필더</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {attendingPlayers.filter(p => p.mainPosition === "공격수").length}
              </div>
              <div className="text-sm text-muted-foreground">공격수</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 팀 편성 결과 */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Team A */}
        <Card className={`${isFormationComplete ? "ring-2 ring-blue-200" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"> {/* 글자 크기 통일 */}
                <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span>Team A ({teamA.length}명)</span>
                {isFormationComplete && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
              </CardTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{calculateTeamRating(teamA)}</span>
              </div>
            </div>
            <CardDescription className="text-sm">
              골키퍼 {getPositionCount(teamA, "골키퍼")} | 수비수 {getPositionCount(teamA, "수비수")} | 미드필더 {getPositionCount(teamA, "미드필더")} | 공격수 {getPositionCount(teamA, "공격수")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {teamA.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{player.name}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge className={getPositionColor(player.mainPosition)} variant="secondary" size="sm">
                          {player.mainPosition}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {player.subPositions.slice(0, 2).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{player.overallRating}</span>
                  </div>
                </div>
              ))}
            </div>
            {teamA.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                자동 편성을 클릭하여 팀을 구성하세요
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team B */}
        <Card className={isFormationComplete ? "ring-2 ring-red-200" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"> {/* 글자 크기 통일 */}
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                Team B ({teamB.length}명)
                {isFormationComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{calculateTeamRating(teamB)}</span>
              </div>
            </div>
            <CardDescription>
              골키퍼 {getPositionCount(teamB, "골키퍼")} | 수비수 {getPositionCount(teamB, "수비수")} | 미드필더 {getPositionCount(teamB, "미드필더")} | 공격수 {getPositionCount(teamB, "공격수")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamB.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <div className="flex items-center gap-1">
                        <Badge className={getPositionColor(player.mainPosition)} variant="secondary">
                          {player.mainPosition}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {player.subPositions.slice(0, 2).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{player.overallRating}</span>
                  </div>
                </div>
              ))}
              {teamB.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  자동 편성을 클릭하여 팀을 구성하세요
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 편성 균형 분석 */}
      {(teamA.length > 0 || teamB.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              편성 균형 분석
            </CardTitle>
            <CardDescription>편성 결과를 우선순위별로 분석합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 인원 균형 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <h4 className="font-medium">인원 균형</h4>
                  {balance.isBalanced ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Team A</span>
                    <span className="font-medium">{balance.teamACount}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team B</span>
                    <span className="font-medium">{balance.teamBCount}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span>인원 차이</span>
                    <span className={`font-medium ${balance.difference <= 1 ? 'text-green-600' : 'text-orange-600'}`}>
                      {balance.difference}명
                    </span>
                  </div>
                </div>
              </div>

              {/* 실력 균형 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <h4 className="font-medium">실력 균형</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Team A 평균</span>
                    <span className="font-medium">{calculateTeamRating(teamA)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team B 평균</span>
                    <span className="font-medium">{calculateTeamRating(teamB)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>실력 차이</span>
                    <span className="font-medium">
                      {Math.abs(parseFloat(calculateTeamRating(teamA)) - parseFloat(calculateTeamRating(teamB))).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 포지션 균형 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <h4 className="font-medium">포지션 균형</h4>
                </div>
                <div className="text-sm space-y-1">
                  <div>Team A: 골키퍼 {getPositionCount(teamA, "골키퍼")} | 수비수 {getPositionCount(teamA, "수비수")} | 미드필더 {getPositionCount(teamA, "미드필더")} | 공격수 {getPositionCount(teamA, "공격수")}</div>
                  <div>Team B: 골키퍼 {getPositionCount(teamB, "골키퍼")} | 수비수 {getPositionCount(teamB, "수비수")} | 미드필더 {getPositionCount(teamB, "미드필더")} | 공격수 {getPositionCount(teamB, "공격수")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 벤치 */}
      {bench.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              벤치
            </CardTitle>
            <CardDescription>{bench.length}명의 선수가 대기 중입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {bench.map((player) => (
                <div key={player.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{player.name}</span>
                  <Badge className={getPositionColor(player.mainPosition)} variant="outline">
                    {player.mainPosition}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{player.overallRating}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 편성 완료 버튼 */}
      {(teamA.length > 0 || teamB.length > 0) && !isFormationComplete && (
        <div className="flex justify-center">
          <Button size="lg" className="px-8" onClick={completeFormation}>
            <CheckCircle className="h-4 w-4 mr-2" />
            편성 완료 및 저장
          </Button>
        </div>
      )}

      {isFormationComplete && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">팀 편성이 완료되었습니다!</p>
          <p className="text-sm text-green-600">경기 시작 전까지 편성을 수정할 수 있습니다.</p>
        </div>
      )}
    </div>
  )
}
