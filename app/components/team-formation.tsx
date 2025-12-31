'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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
  if (!teamFormation) return null

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

  const yellowTeam = teamFormation.yellowTeam || []
  const blueTeam = teamFormation.blueTeam || []
  const stats = teamFormation.stats || {}

  // 포지션 대분류별로 그룹화 (게스트는 별도)
  const groupByPositionCategory = (team: any[]) => {
    const grouped: { [key: string]: any[] } = {
      '공격수': [],
      '미드필더': [],
      '수비수': [],
      '골키퍼': [],
      '게스트': []
    }

    team.forEach(player => {
      // 게스트는 별도 카테고리로
      if (player.isGuest) {
        grouped['게스트'].push(player)
      } else {
        // 일반 사용자는 주포지션에 따라 분류
        // 1. positionCategory가 있고 유효한 카테고리면 사용
        // 2. 없거나 미정이면 주포지션으로 계산
        // 3. 여전히 미정이면 공격수로 기본 분류
        let category: string = player.positionCategory

        // positionCategory가 없거나 미정이면 주포지션으로 계산
        if (!category || category === '미정') {
          category = getPositionCategory(player.position)
        }

        // 여전히 미정이거나 유효하지 않은 카테고리면 공격수로 기본 분류
        if (!category || category === '미정' || !grouped.hasOwnProperty(category)) {
          category = '공격수'
        }

        // 최종 카테고리에 추가
        grouped[category].push(player)
      }
    })

    // 각 카테고리 내에서 주포지션 이름순으로 정렬
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

  // 포지션 텍스트 색상 가져오기
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">팀편성 결과</h3>
          {formationConfirmed && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              확정됨
            </Badge>
          )}
        </div>
        {isManagerMode && (
          <div className="flex gap-2">
            {!formationConfirmed && (
              <Button onClick={handleConfirm} size="sm" variant="default">
                확정
              </Button>
            )}
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
                Object.entries(yellowGrouped)
                  .filter(([category]) => category !== '미정' && yellowGrouped[category] && yellowGrouped[category].length > 0)
                  .sort(([a], [b]) => {
                    // 게스트는 마지막에
                    if (a === '게스트') return 1
                    if (b === '게스트') return -1
                    const order = ['공격수', '미드필더', '수비수', '골키퍼']
                    const aIndex = order.indexOf(a)
                    const bIndex = order.indexOf(b)
                    if (aIndex === -1 && bIndex === -1) return 0
                    if (aIndex === -1) return 1
                    if (bIndex === -1) return -1
                    return aIndex - bIndex
                  })
                  .map(([category, players]) => {
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
                Object.entries(blueGrouped)
                  .filter(([category]) => category !== '미정' && blueGrouped[category] && blueGrouped[category].length > 0)
                  .sort(([a], [b]) => {
                    // 게스트는 마지막에
                    if (a === '게스트') return 1
                    if (b === '게스트') return -1
                    const order = ['공격수', '미드필더', '수비수', '골키퍼']
                    const aIndex = order.indexOf(a)
                    const bIndex = order.indexOf(b)
                    if (aIndex === -1 && bIndex === -1) return 0
                    if (aIndex === -1) return 1
                    if (bIndex === -1) return -1
                    return aIndex - bIndex
                  })
                  .map(([category, players]) => {
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

