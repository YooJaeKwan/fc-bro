'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Save, X, ArrowRightLeft, ArrowRight } from 'lucide-react'
import { getPositionCategory } from '@/lib/team-formation'

interface TeamFormationProps {
  scheduleId: string
  teamFormation: any
  formationDate: string | null
  formationConfirmed?: boolean
  isManagerMode: boolean
  currentUserId: string
  onFormationUpdate: () => void
  onFormationDelete: () => void
  onFormationConfirm: () => void
}

export function TeamFormation({
  scheduleId,
  teamFormation,
  formationDate,
  formationConfirmed = false,
  isManagerMode,
  currentUserId,
  onFormationUpdate,
  onFormationDelete,
  onFormationConfirm
}: TeamFormationProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localFormation, setLocalFormation] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setLocalFormation(teamFormation)
  }, [teamFormation])

  if (!teamFormation) return null

  const currentFormation = isEditing ? localFormation : teamFormation
  
  const yellowTeam = currentFormation?.yellowTeam || []
  const blueTeam = currentFormation?.blueTeam || []
  const greenTeam = currentFormation?.greenTeam || []
  const stats = currentFormation?.stats || {}

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false)
      setLocalFormation(teamFormation)
    } else {
      setIsEditing(true)
      setLocalFormation(JSON.parse(JSON.stringify(teamFormation)))
    }
  }

  const handleSave = async () => {
    if (!confirm('변경된 팀편성을 저장하시겠습니까?')) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/schedule/update-formation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          userId: currentUserId,
          teamFormation: localFormation
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsEditing(false)
        onFormationUpdate()
      } else {
        alert(result.error || '팀편성 저장 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('팀편성 저장 오류:', error)
      alert('팀편성 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMovePlayer = (player: any, currentTeamColor: 'yellow' | 'blue' | 'green') => {
    const newFormation = JSON.parse(JSON.stringify(localFormation))
    const hasGreenTeam = newFormation.greenTeam && newFormation.greenTeam.length > 0
    
    let playerToMove: any = null
    if (currentTeamColor === 'yellow') {
      const idx = newFormation.yellowTeam.findIndex((p: any) => p.userId === player.userId)
      if (idx !== -1) playerToMove = newFormation.yellowTeam.splice(idx, 1)[0]
    } else if (currentTeamColor === 'blue') {
      const idx = newFormation.blueTeam.findIndex((p: any) => p.userId === player.userId)
      if (idx !== -1) playerToMove = newFormation.blueTeam.splice(idx, 1)[0]
    } else if (currentTeamColor === 'green') {
      const idx = newFormation.greenTeam.findIndex((p: any) => p.userId === player.userId)
      if (idx !== -1) playerToMove = newFormation.greenTeam.splice(idx, 1)[0]
    }

    if (!playerToMove) return

    let targetTeamColor: 'yellow' | 'blue' | 'green' = 'yellow'
    
    if (hasGreenTeam) {
      if (currentTeamColor === 'yellow') targetTeamColor = 'blue'
      else if (currentTeamColor === 'blue') targetTeamColor = 'green'
      else targetTeamColor = 'yellow'
    } else {
      if (currentTeamColor === 'yellow') targetTeamColor = 'blue'
      else targetTeamColor = 'yellow'
    }

    if (targetTeamColor === 'yellow') newFormation.yellowTeam.push(playerToMove)
    else if (targetTeamColor === 'blue') newFormation.blueTeam.push(playerToMove)
    else if (targetTeamColor === 'green') newFormation.greenTeam.push(playerToMove)

    const updateStats = (teamColor: 'yellow' | 'blue' | 'green', list: any[]) => {
      if (newFormation.stats[teamColor]) {
        newFormation.stats[teamColor].count = list.length
      }
    }

    updateStats('yellow', newFormation.yellowTeam)
    updateStats('blue', newFormation.blueTeam)
    if (hasGreenTeam) updateStats('green', newFormation.greenTeam)

    setLocalFormation(newFormation)
  }

  const handleConfirm = async () => {
    if (!confirm('팀편성을 확정하시겠습니까? 확정 후에는 모든 팀원이 볼 수 있습니다.')) return

    try {
      const response = await fetch('/api/schedule/confirm-formation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          userId: currentUserId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onFormationConfirm()
      } else {
        alert(result.error || '팀편성 확정 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('팀편성 확정 오류:', error)
      alert('팀편성 확정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('팀편성 결과를 삭제하시겠습니까?')) return

    try {
      const response = await fetch('/api/schedule/team-formation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId,
          userId: currentUserId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onFormationDelete()
      } else {
        alert(result.error || '팀편성 삭제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('팀편성 삭제 오류:', error)
      alert('팀편성 삭제 중 오류가 발생했습니다.')
    }
  }

  const groupByPositionCategory = (team: any[]) => {
    const grouped: { [key: string]: any[] } = {
      '공격수': [],
      '미드필더': [],
      '수비수': [],
      '골키퍼': [],
      '게스트': []
    }

    team.forEach(player => {
      if (player.isGuest) {
        grouped['게스트'].push(player)
      } else {
        let category: string = player.positionCategory

        if (!category || category === '미정') {
          category = getPositionCategory(player.position)
        }

        if (!category || category === '미정' || !grouped.hasOwnProperty(category)) {
          category = '공격수'
        }

        grouped[category].push(player)
      }
    })

    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const posA = a.position || ''
        const posB = b.position || ''
        return posA.localeCompare(posB, 'ko')
      })
    })

    return grouped
  }

  const yellowGrouped = groupByPositionCategory(yellowTeam)
  const blueGrouped = groupByPositionCategory(blueTeam)
  const greenGrouped = groupByPositionCategory(greenTeam)

  const getPositionTextColor = (position: string | null | undefined): string => {
    if (!position) return 'text-gray-600'
    const category = getPositionCategory(position)
    switch (category) {
      case '공격수':
        return 'text-red-600'
      case '미드필더':
        return 'text-green-600'
      case '수비수':
        return 'text-blue-600'
      case '골키퍼':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }
  
  const renderTeamCard = (teamColor: 'yellow' | 'blue' | 'green', teamData: any[], groupedData: any, statsData: any) => {
    const bgColors = {
      yellow: 'bg-yellow-50/30 border-yellow-300',
      blue: 'bg-blue-50/30 border-blue-300',
      green: 'bg-green-50/30 border-green-300'
    }
    const dotColors = {
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500'
    }
    const teamName = {
      yellow: '노랑팀',
      blue: '파랑팀',
      green: '초록팀'
    }
    const hoverColors = {
        yellow: 'hover:bg-yellow-100/50',
        blue: 'hover:bg-blue-100/50',
        green: 'hover:bg-green-100/50'
    }

    return (
      <Card className={`${bgColors[teamColor]}`}>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${dotColors[teamColor]}`}></div>
            {teamName[teamColor]}
            {statsData && (
              <span className="text-sm font-normal text-gray-600">
                ({statsData.count}명{isManagerMode ? `, 평균 레벨: ${statsData.averageScore}` : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-3">
            {teamData.length === 0 ? (
              <p className="text-sm text-gray-500">팀원이 없습니다.</p>
            ) : (
              Object.entries(groupedData)
                .filter(([category]) => category !== '미정' && groupedData[category] && groupedData[category].length > 0)
                .sort(([a], [b]) => {
                  const order = ['공격수', '미드필더', '수비수', '골키퍼', '게스트']
                  const aIndex = order.indexOf(a)
                  const bIndex = order.indexOf(b)
                  if (aIndex === -1 && bIndex === -1) return 0
                  if (aIndex === -1) return 1
                  if (bIndex === -1) return -1
                  return aIndex - bIndex
                })
                .map(([category, players]: [string, any]) => {
                  if (players.length === 0) return null

                  return (
                    <div key={category} className="space-y-1">
                      <div className="text-xs font-semibold text-gray-600 border-b pb-1 text-left">
                        {category} ({players.length})
                      </div>
                      {players.map((player: any) => (
                        <div key={player.userId} className={`flex items-center gap-2 py-1 rounded ${hoverColors[teamColor]} group`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">
                                {player.name}
                                {player.isGuest && player.invitedByName && (
                                  <span className="text-gray-400 text-xs ml-1">({player.invitedByName} 지인)</span>
                                )}
                              </p>
                              {(player.displayPosition || player.position) && (
                                <>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-medium ${getPositionTextColor(player.displayPosition || player.position)} border-current`}
                                  >
                                    {player.displayPosition || player.position}
                                  </Badge>
                                  {((player.displaySubPositions && player.displaySubPositions.length > 0) || (player.subPositions && player.subPositions.length > 0)) && (
                                    <span className="text-xs font-medium">
                                      <span className="text-gray-500">(+</span>
                                      {(player.displaySubPositions || player.subPositions).map((subPos: string, idx: number) => (
                                        <span key={idx}>
                                          <span className={getPositionTextColor(subPos)}>{subPos}</span>
                                          {idx < (player.displaySubPositions || player.subPositions).length - 1 && <span className="text-gray-400">, </span>}
                                        </span>
                                      ))}
                                      <span className="text-gray-500">)</span>
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 hover:bg-white"
                              onClick={() => handleMovePlayer(player, teamColor)}
                              title="팀 이동"
                            >
                                {greenTeam.length > 0 ? (
                                    <ArrowRight className="h-3.5 w-3.5 text-gray-600" />
                                ) : (
                                    <ArrowRightLeft className="h-3.5 w-3.5 text-gray-600" />
                                )}
                              
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">팀편성 결과</h3>
          {formationConfirmed && !isEditing && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              확정됨
            </Badge>
          )}

        </div>
        {isManagerMode && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  size="sm" 
                  variant="default"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
                <Button 
                  onClick={handleEditToggle} 
                  size="sm" 
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  취소
                </Button>
              </>
            ) : (
              <>
                {!formationConfirmed && (
                  <Button onClick={handleConfirm} size="sm" variant="default">
                    확정
                  </Button>
                )}
                <Button
                  onClick={handleEditToggle}
                  size="sm"
                  variant="outline"
                  className="border-orange-200 hover:bg-orange-50 text-orange-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  수동 편집
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {formationDate && !isEditing && (
        <p className="text-xs text-gray-500">
          편성 일시: {new Date(formationDate).toLocaleString('ko-KR')}
        </p>
      )}

      <div className={`grid grid-cols-1 ${greenTeam.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        {renderTeamCard('yellow', yellowTeam, yellowGrouped, stats.yellow)}
        {renderTeamCard('blue', blueTeam, blueGrouped, stats.blue)}
        {greenTeam.length > 0 && renderTeamCard('green', greenTeam, greenGrouped, stats.green)}
      </div>
    </div>
  )
}

