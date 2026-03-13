"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Info, CalendarDays, Users, Trophy } from "lucide-react"

export interface FormationPageProps {
  currentUser: any
}

const parseScheduleDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function FormationPage({ currentUser }: FormationPageProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<"yellow" | "blue">("yellow")
  const [selectedTactics, setSelectedTactics] = useState<string>("4-4-2")
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  // 포메이션 상태 관리
  // key: slot id (e.g. "ST1"), value: player object
  const [assignedPlayers, setAssignedPlayers] = useState<Record<string, any>>({})
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Fetch schedules
  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/schedule/list')
      if (res.ok) {
        const data = await res.json()
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        // Find recent or upcoming schedules that have team formations
        const scheduleArray = data.schedules || data || [] // fallback array check 
        const withFormations = scheduleArray.filter((s: any) => s.teamFormation != null)

        // Sort by date (newest first)
        withFormations.sort((a: any, b: any) => {
          return parseScheduleDate(b.date).getTime() - parseScheduleDate(a.date).getTime()
        })

        setSchedules(withFormations)
        if (withFormations.length > 0) {
          setSelectedScheduleId(withFormations[0].id)
        }
      }
    } catch (error) {
      console.error('일정 목록 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId)

  const formationsData = {
    "4-4-2": {
      name: "밸런스의 정석: 4-4-2",
      description: "가장 고전적이면서도 기본이 되는 포메이션입니다.",
      features: "두 줄 수비(수비 4명, 미드필더 4명)를 통해 공간을 촘촘하게 막기 좋습니다.",
      pros: "공수의 균형이 매우 뛰어나며, 측면 윙어와 풀백의 협동 플레이가 강조됩니다.",
      cons: "중앙 미드필더가 2명뿐이라, 상대가 중앙에 숫자를 많이 두는 포메이션(예: 4-3-3)을 만날 때 중원 싸움에서 밀릴 수 있습니다.",
      positions: [
        { id: "ST1", top: 15, left: 35, label: "ST" },
        { id: "ST2", top: 15, left: 65, label: "ST" },
        { id: "LM", top: 40, left: 15, label: "LM" },
        { id: "CM1", top: 40, left: 35, label: "CM" },
        { id: "CM2", top: 40, left: 65, label: "CM" },
        { id: "RM", top: 40, left: 85, label: "RM" },
        { id: "LB", top: 70, left: 15, label: "LB" },
        { id: "CB1", top: 70, left: 35, label: "CB" },
        { id: "CB2", top: 70, left: 65, label: "CB" },
        { id: "RB", top: 70, left: 85, label: "RB" },
        { id: "GK", top: 90, left: 50, label: "GK" }
      ]
    },
    "4-3-3": {
      name: "현대 축구의 대세: 4-3-3",
      description: "공격적인 성향이 강하며, 현재 많은 빅클럽(리버풀, 맨시티 등)이 선호하는 포메이션입니다.",
      features: "미드필더 3명이 삼각형 구도를 형성해 패스 게임을 주도합니다.",
      pros: "전방에 3명의 공격수를 두어 화력이 강력하며, 강한 전방 압박을 구사하기에 최적입니다.",
      cons: "양쪽 윙백이 공격에 가담했을 때 뒷공간이 노출되기 쉽습니다.",
      positions: [
        { id: "LW", top: 15, left: 20, label: "LW" },
        { id: "ST", top: 10, left: 50, label: "ST" },
        { id: "RW", top: 15, left: 80, label: "RW" },
        { id: "LCM", top: 35, left: 30, label: "CM" },
        { id: "RCM", top: 35, left: 70, label: "CM" },
        { id: "CDM", top: 50, left: 50, label: "CDM" },
        { id: "LB", top: 70, left: 15, label: "LB" },
        { id: "CB1", top: 70, left: 35, label: "CB" },
        { id: "CB2", top: 70, left: 65, label: "CB" },
        { id: "RB", top: 70, left: 85, label: "RB" },
        { id: "GK", top: 90, left: 50, label: "GK" }
      ]
    },
    "4-2-3-1": {
      name: "공격형 미드필더 중심: 4-2-3-1",
      description: "현대 축구에서 가장 흔하게 볼 수 있는 형태 중 하나입니다.",
      features: "2명의 수비형 미드필더(볼란치)가 수비진을 보호하고, 1명의 공격형 미드필더가 경기를 조율합니다.",
      pros: "공수 밸런스가 매우 안정적이며, 2선 공격수들의 창의성을 극대화할 수 있습니다.",
      cons: "원톱(1명) 공격수가 고립될 경우 공격 전개가 답답해질 수 있습니다.",
      positions: [
        { id: "ST", top: 10, left: 50, label: "ST" },
        { id: "LAM", top: 25, left: 20, label: "LAM" },
        { id: "CAM", top: 25, left: 50, label: "CAM" },
        { id: "RAM", top: 25, left: 80, label: "RAM" },
        { id: "LDM", top: 45, left: 35, label: "LDM" },
        { id: "RDM", top: 45, left: 65, label: "RDM" },
        { id: "LB", top: 70, left: 15, label: "LB" },
        { id: "CB1", top: 70, left: 35, label: "CB" },
        { id: "CB2", top: 70, left: 65, label: "CB" },
        { id: "RB", top: 70, left: 85, label: "RB" },
        { id: "GK", top: 90, left: 50, label: "GK" }
      ]
    },
    "3-5-2": {
      name: "수비 안정과 역습: 3-5-2",
      description: "중앙 수비수를 3명 두는 형태로, 최근 다시 유행하고 있습니다.",
      features: "양쪽 측면의 '윙백'이 공격과 수비를 모두 담당하며 엄청난 활동량을 보여줘야 합니다.",
      pros: "수비 시에는 5명이 되어 매우 단단하며, 공격 시에는 중원 숫자를 늘려 점유율을 가져오기 좋습니다.",
      cons: "윙백의 체력과 기량에 따라 팀 전체의 경기력이 크게 좌우됩니다.",
      positions: [
        { id: "ST1", top: 15, left: 35, label: "ST" },
        { id: "ST2", top: 15, left: 65, label: "ST" },
        { id: "LWB", top: 40, left: 10, label: "LWB" },
        { id: "LCM", top: 40, left: 30, label: "CM" },
        { id: "CM", top: 40, left: 50, label: "CM" },
        { id: "RCM", top: 40, left: 70, label: "CM" },
        { id: "RWB", top: 40, left: 90, label: "RWB" },
        { id: "LCB", top: 70, left: 25, label: "CB" },
        { id: "CB", top: 70, left: 50, label: "CB" },
        { id: "RCB", top: 70, left: 75, label: "CB" },
        { id: "GK", top: 90, left: 50, label: "GK" }
      ]
    }
  }

  const currentTacticInfo = formationsData[selectedTactics as keyof typeof formationsData]

  // 일정/팀/전술이 바뀔 때 초기화
  useEffect(() => {
    setAssignedPlayers({})
    setSelectedSlot(null)
  }, [selectedScheduleId, selectedTeam, selectedTactics])

  // 현재 선택된 일정과 팀의 로스터 결합
  const currentRoster = (() => {
    if (!selectedSchedule || !selectedSchedule.teamFormation) return []
    try {
      // JSON 파싱 방어 코드
      const tf = typeof selectedSchedule.teamFormation === 'string'
        ? JSON.parse(selectedSchedule.teamFormation)
        : selectedSchedule.teamFormation
      return tf[`${selectedTeam}Team`] || []
    } catch {
      return []
    }
  })()

  // 할당되지 않은 플레이어
  const unassignedPlayers = currentRoster.filter((p: any) => {
    return !Object.values(assignedPlayers).some(assigned => assigned?.userId === p.userId)
  })

  // 슬롯 클릭 핸들러
  const handleSlotClick = (slotId: string) => {
    if (selectedSlot === slotId) {
      setSelectedSlot(null) // 토글
    } else {
      setSelectedSlot(slotId)
    }
  }

  // 플레이어 할당 핸들러
  const handleAssignPlayer = (player: any) => {
    if (!selectedSlot) return

    setAssignedPlayers(prev => ({
      ...prev,
      [selectedSlot]: player
    }))
    setSelectedSlot(null)
  }

  // 플레이어 할당 해제 핸들러
  const handleUnassignPlayer = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 슬롯 클릭 방지
    setAssignedPlayers(prev => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">일정 목록을 불러오는 중...</div>
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        {/* <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5 text-emerald-100" />
            <h2 className="text-lg font-bold">포메이션</h2>
          </div>
        </div> */}

        <CardContent className="p-4 space-y-4">
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              팀편성이 완료된 일정이 없습니다.
            </div>
          ) : (
            <>
              {/* 설정 영역 */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="일정을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title} ({s.date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Select value={selectedTeam} onValueChange={(v: "yellow" | "blue") => setSelectedTeam(v)}>
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yellow">노랑팀</SelectItem>
                        <SelectItem value="blue">파랑팀</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Select value={selectedTactics} onValueChange={setSelectedTactics}>
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(formationsData).map((tactic) => (
                          <SelectItem key={tactic} value={tactic}>{tactic}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 축구장 UI Placeholder */}
              <div className="relative w-full aspect-[2/3] bg-emerald-600 rounded-xl overflow-hidden border-4 border-emerald-700 shadow-inner mt-4">
                {/* 축구장 라인들 */}
                {/* 하프라인 */}
                <div className="absolute top-1/2 left-0 right-0 h-0 border-t-2 border-white/60"></div>
                {/* 센터서클 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/60"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60"></div>
                {/* 페널티 에어리어 (아래) */}
                <div className="absolute bottom-0 left-[20%] right-[20%] h-[15%] border-t-2 border-l-2 border-r-2 border-white/60"></div>
                {/* 골 에어리어 (아래) */}
                <div className="absolute bottom-0 left-[35%] right-[35%] h-[6%] border-t-2 border-l-2 border-r-2 border-white/60"></div>
                {/* 페널티 아크 (아래) */}
                <div className="absolute bottom-[15%] left-[35%] right-[35%] h-8 rounded-t-full border-t-2 border-l-2 border-r-2 border-white/60 -z-10 bg-emerald-600"></div>

                {/* 포지션 슬롯 생성 */}
                {currentTacticInfo.positions.map((pos) => {
                  const assigned = assignedPlayers[pos.id]
                  const isSelected = selectedSlot === pos.id

                  return (
                    <div
                      key={pos.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                      style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                      onClick={() => handleSlotClick(pos.id)}
                    >
                      <div className={`
                        relative rounded-full backdrop-blur-sm shadow-md flex items-center justify-center font-bold transition-all
                        ${assigned ? 'w-10 h-10 border-2 border-emerald-300 bg-white' : 'w-8 h-8 border-2 border-white/80 bg-white/20 hover:bg-white/40'}
                        ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-50 scale-110' : 'hover:scale-105'}
                      `}>
                        {assigned ? (
                          <>
                            <span className="text-[11px] text-slate-800 leading-tight">
                              {assigned.name.substring(0, 3)}
                            </span>
                            <button
                              className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow border border-white opacity-80 hover:opacity-100"
                              onClick={(e) => handleUnassignPlayer(pos.id, e)}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <span className="text-white/90 text-[10px]">+</span>
                        )}
                      </div>
                      <span className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm transition-colors ${isSelected ? 'bg-yellow-400 text-slate-900' : 'bg-slate-900/60 text-white'}`}>
                        {pos.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* 하단 미배치 선수 명단 */}
              <div className="mt-4 pt-4 border-t border-slate-100 relative">
                <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> 대기 명단
                  <span className="bg-slate-200 text-slate-600 px-1.5 rounded-full text-[10px] ml-auto">
                    {unassignedPlayers.length}명 대기 / {currentRoster.length}명 총원
                  </span>
                </h3>

                {selectedSlot ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs flex flex-col animate-in slide-in-from-bottom-2">
                    <p className="font-bold text-yellow-800 mb-2 flex items-center gap-1">
                      <span className="bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded text-[10px]">
                        {currentTacticInfo.positions.find(p => p.id === selectedSlot)?.label}
                      </span>
                      포지션에 배치할 선수를 선택하세요
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unassignedPlayers.length > 0 ? (
                        unassignedPlayers.map((player: any) => (
                          <button
                            key={player.userId}
                            onClick={() => handleAssignPlayer(player)}
                            className="bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 font-medium px-2 py-1.5 rounded-md text-[11px] transition-colors shadow-sm flex items-center gap-1"
                          >
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                              {player.positionCategory ? player.positionCategory[0] : (player.position?.[0] || '-')}
                            </span>
                            {player.name}
                          </button>
                        ))
                      ) : (
                        <span className="text-slate-400 py-1">배치할 선수가 없습니다.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {unassignedPlayers.length > 0 ? (
                        unassignedPlayers.map((player: any) => (
                          <div
                            key={player.userId}
                            className="bg-white border border-slate-200 text-slate-500 font-medium px-2 py-1.5 rounded-md text-[11px] shadow-sm opacity-70 flex items-center gap-1"
                          >
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                              {player.positionCategory ? player.positionCategory[0] : (player.position?.[0] || '-')}
                            </span>
                            {player.name}
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center text-slate-400 py-2 font-medium">
                          🎉 모든 선수가 배치되었습니다!
                        </div>
                      )}
                    </div>
                    {unassignedPlayers.length > 0 && (
                      <p className="text-slate-400 mt-2 text-center text-[10px]">
                        위의 잔디 구장에서 <span className="font-bold text-slate-600 bg-slate-200 px-1 rounded mx-0.5">+</span> 슬롯을 눌러 선수를 배치하세요.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 포메이션 설명 팝업 */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="max-w-[90vw] w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-black">{selectedTactics}</span>
              {currentTacticInfo.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm leading-relaxed">
            <p className="text-slate-600 font-medium">
              {currentTacticInfo.description}
            </p>
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                  특징
                </h4>
                <p className="text-slate-600 text-[13px] ml-2.5">{currentTacticInfo.features}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  장점
                </h4>
                <p className="text-slate-600 text-[13px] ml-2.5">{currentTacticInfo.pros}</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                  단점
                </h4>
                <p className="text-slate-600 text-[13px] ml-2.5">{currentTacticInfo.cons}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsInfoOpen(false)} size="sm">확인했습니다</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
