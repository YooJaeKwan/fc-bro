'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface TeamFormationProps {
  scheduleId: string
  teamFormation: any
  formationDate: string | null
  isManagerMode: boolean
  currentUserId: string
  onFormationUpdate: () => void
  onFormationDelete: () => void
}

export function TeamFormation({
  scheduleId,
  teamFormation,
  formationDate,
  isManagerMode,
  currentUserId,
  onFormationUpdate,
  onFormationDelete
}: TeamFormationProps) {
  if (!teamFormation) return null

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

  const yellowTeam = teamFormation.yellowTeam || []
  const blueTeam = teamFormation.blueTeam || []
  const stats = teamFormation.stats || {}

  // 포지션 대분류별로 그룹화
  const groupByPositionCategory = (team: any[]) => {
    const grouped: { [key: string]: any[] } = {
      '공격수': [],
      '미드필더': [],
      '수비수': [],
      '골키퍼': [],
      '게스트': [],
      '미정': []
    }

    team.forEach(player => {
      // 게스트인 경우 "게스트" 카테고리로 분류
      if (player.isGuest) {
        grouped['게스트'].push(player)
      } else {
        const category = player.positionCategory || '미정'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(player)
      }
    })

    return grouped
  }

  const yellowGrouped = groupByPositionCategory(yellowTeam)
  const blueGrouped = groupByPositionCategory(blueTeam)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">팀편성 결과 (베타테스트)</h3>
        {isManagerMode && (
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {formationDate && (
        <p className="text-xs text-gray-500">
          편성 일시: {new Date(formationDate).toLocaleString('ko-KR')}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 노랑팀 */}
        <Card className="border-yellow-300 bg-yellow-50/30">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              노랑팀
              {stats.yellow && (
                <span className="text-sm font-normal text-gray-600">
                  ({stats.yellow.count}명, 평균 레벨: {stats.yellow.averageScore})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-3">
              {yellowTeam.length === 0 ? (
                <p className="text-sm text-gray-500">팀원이 없습니다.</p>
              ) : (
                Object.entries(yellowGrouped).map(([category, players]) => {
                  if (players.length === 0) return null
                  
                  return (
                    <div key={category} className="space-y-1">
                      <div className="text-xs font-semibold text-gray-600 border-b pb-1">
                        {category} ({players.length})
                      </div>
                      {players.map((player: any) => (
                        <div key={player.userId} className="flex items-center gap-2 py-1 rounded hover:bg-yellow-100/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">
                                {player.name}
                              </p>
                              {player.isGuest && (
                                <Badge variant="outline" className="text-xs">게스트</Badge>
                              )}
                              {player.levelCategory && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    player.levelCategory === '루키' ? 'bg-gray-100 text-gray-800' :
                                    player.levelCategory.startsWith('아마추어') ? 'bg-blue-100 text-blue-800' :
                                    player.levelCategory.startsWith('세미프로') ? 'bg-purple-100 text-purple-800' :
                                    player.levelCategory === '프로' ? 'bg-yellow-100 text-yellow-800' :
                                    player.levelCategory === '미숙' ? 'bg-gray-100 text-gray-800' :
                                    player.levelCategory === '보통' ? 'bg-blue-100 text-blue-800' :
                                    player.levelCategory === '잘함' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {player.levelCategory}
                                </Badge>
                              )}
                              {player.position && (
                                <span className="text-xs text-gray-600">
                                  {player.position}
                                  {player.subPositions && player.subPositions.length > 0 && (
                                    <span className="ml-1 text-gray-500">(+{player.subPositions.join(', ')})</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* 파랑팀 */}
        <Card className="border-blue-300 bg-blue-50/30">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              파랑팀
              {stats.blue && (
                <span className="text-sm font-normal text-gray-600">
                  ({stats.blue.count}명, 평균 레벨: {stats.blue.averageScore})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-3">
              {blueTeam.length === 0 ? (
                <p className="text-sm text-gray-500">팀원이 없습니다.</p>
              ) : (
                Object.entries(blueGrouped).map(([category, players]) => {
                  if (players.length === 0) return null
                  
                  return (
                    <div key={category} className="space-y-1">
                      <div className="text-xs font-semibold text-gray-600 border-b pb-1">
                        {category} ({players.length})
                      </div>
                      {players.map((player: any) => (
                        <div key={player.userId} className="flex items-center gap-2 py-1 rounded hover:bg-blue-100/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">
                                {player.name}
                              </p>
                              {player.isGuest && (
                                <Badge variant="outline" className="text-xs">게스트</Badge>
                              )}
                              {player.levelCategory && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    player.levelCategory === '루키' ? 'bg-gray-100 text-gray-800' :
                                    player.levelCategory.startsWith('아마추어') ? 'bg-blue-100 text-blue-800' :
                                    player.levelCategory.startsWith('세미프로') ? 'bg-purple-100 text-purple-800' :
                                    player.levelCategory === '프로' ? 'bg-yellow-100 text-yellow-800' :
                                    player.levelCategory === '미숙' ? 'bg-gray-100 text-gray-800' :
                                    player.levelCategory === '보통' ? 'bg-blue-100 text-blue-800' :
                                    player.levelCategory === '잘함' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {player.levelCategory}
                                </Badge>
                              )}
                              {player.position && (
                                <span className="text-xs text-gray-600">
                                  {player.position}
                                  {player.subPositions && player.subPositions.length > 0 && (
                                    <span className="ml-1 text-gray-500">(+{player.subPositions.join(', ')})</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

