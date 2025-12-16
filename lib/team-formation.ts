import { LEVEL_SYSTEM, getLevelLabel } from './level-system'

// 포지션 대분류 매핑
export const positionMapping: Record<string, string> = {
  "GK": "골키퍼",
  "DC": "수비수",
  "CB": "수비수", // Center Back (DC와 동일)
  "DR": "수비수",
  "RB": "수비수", // Right Back (DR과 동일)
  "DL": "수비수",
  "LB": "수비수", // Left Back (DL과 동일)
  "LRB": "수비수", // Left/Right Back (양쪽 풀백)
  "LRCB": "수비수", // Left/Right/Center Back (멀티 수비수)
  "CDM": "미드필더",
  "DM": "미드필더",
  "CM": "미드필더",
  "MC": "미드필더",
  "CAM": "미드필더",
  "AMC": "미드필더",
  "ST": "공격수",
  "CF": "공격수",
  "SS": "공격수",
  "LWF": "공격수",
  "RWF": "공격수"
}

// 포지션 카테고리 가져오기
export function getPositionCategory(position: string | null | undefined): string {
  if (!position) return '미정'
  return positionMapping[position.toUpperCase()] || '미정'
}

// 레벨 점수 계산 (선수용)
export function getPlayerLevelScore(level: number | null | undefined): number {
  if (!level || level < 1 || level > 10) return 1
  return level // 레벨이 곧 점수 (1~10)
}

// 레벨 점수 계산 (게스트용)
export function getGuestLevelScore(guestLevel: string | null | undefined): number {
  if (!guestLevel) return 3
  switch (guestLevel) {
    case '미숙': return 3
    case '보통': return 4
    case '잘함': return 5
    default: return 3
  }
}

// 레벨 카테고리 가져오기 (팀편성 표시용)
export function getLevelCategory(level: number | null | undefined): string {
  if (!level || level < 1 || level > 10) return '루키'
  return LEVEL_SYSTEM[level as keyof typeof LEVEL_SYSTEM]?.category || '루키'
}

// 레벨 라벨 가져오기 (팀편성 표시용)
export function getLevelLabelForFormation(level: number | null | undefined): string {
  if (!level || level < 1 || level > 10) return '루키'
  return getLevelLabel(level)
}

// Fisher-Yates 셔플 알고리즘
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 포지션 카테고리별 차이 계산 (점수가 낮을수록 좋음)
function calculatePositionCategoryDiff(yellowTeam: any[], blueTeam: any[]): number {
  const yellowCategories: { [key: string]: number } = {}
  const blueCategories: { [key: string]: number } = {}

  yellowTeam.forEach(player => {
    const category = player.positionCategory || getPositionCategory(player.position) || '미정'
    if (category !== '미정' && category !== '게스트') {
      yellowCategories[category] = (yellowCategories[category] || 0) + 1
    }
  })

  blueTeam.forEach(player => {
    const category = player.positionCategory || getPositionCategory(player.position) || '미정'
    if (category !== '미정' && category !== '게스트') {
      blueCategories[category] = (blueCategories[category] || 0) + 1
    }
  })

  // 포지션 카테고리별 차이 합계
  const allCategories = new Set([...Object.keys(yellowCategories), ...Object.keys(blueCategories)])
  let totalDiff = 0
  allCategories.forEach(category => {
    const diff = Math.abs((yellowCategories[category] || 0) - (blueCategories[category] || 0))
    totalDiff += diff
  })

  return totalDiff
}

// 포지션 카테고리별 최대 차이 계산
function calculateMaxPositionCategoryDiff(yellowTeam: any[], blueTeam: any[]): number {
  const yellowCategories: { [key: string]: number } = {}
  const blueCategories: { [key: string]: number } = {}

  yellowTeam.forEach(player => {
    const category = player.positionCategory || getPositionCategory(player.position) || '미정'
    if (category !== '미정' && category !== '게스트') {
      yellowCategories[category] = (yellowCategories[category] || 0) + 1
    }
  })

  blueTeam.forEach(player => {
    const category = player.positionCategory || getPositionCategory(player.position) || '미정'
    if (category !== '미정' && category !== '게스트') {
      blueCategories[category] = (blueCategories[category] || 0) + 1
    }
  })

  // 포지션 카테고리별 최대 차이 계산
  const allCategories = new Set([...Object.keys(yellowCategories), ...Object.keys(blueCategories)])
  let maxDiff = 0
  allCategories.forEach(category => {
    const diff = Math.abs((yellowCategories[category] || 0) - (blueCategories[category] || 0))
    maxDiff = Math.max(maxDiff, diff)
  })

  return maxDiff
}

// 팀 편성 점수 계산
function calculateFormationScore(
  yellowTeam: any[],
  blueTeam: any[],
  yellowLevels: number[],
  blueLevels: number[]
): number {
  // 1. 인원수 차이 (가장 중요 - 10000점)
  const countDiff = Math.abs(yellowTeam.length - blueTeam.length)
  let score = 0
  
  if (countDiff === 0) {
    score += 10000 // 완전히 동일한 인원수
  } else if (countDiff === 1) {
    score += 5000 // 1명 차이
  } else {
    score += 0 // 2명 이상 차이면 0점
  }

  // 2. 포지션 카테고리 분포 (인원수가 같을 때 중요 - 5000점 만점)
  if (countDiff <= 1) {
    const yellowCategories: { [key: string]: number } = {}
    const blueCategories: { [key: string]: number } = {}

    yellowTeam.forEach(player => {
      const category = player.positionCategory || getPositionCategory(player.position) || '미정'
      if (category !== '미정' && category !== '게스트') {
        yellowCategories[category] = (yellowCategories[category] || 0) + 1
      }
    })

    blueTeam.forEach(player => {
      const category = player.positionCategory || getPositionCategory(player.position) || '미정'
      if (category !== '미정' && category !== '게스트') {
        blueCategories[category] = (blueCategories[category] || 0) + 1
      }
    })

    // 포지션 카테고리별 차이 계산
    const allCategories = new Set([...Object.keys(yellowCategories), ...Object.keys(blueCategories)])
    let positionScore = 0
    let maxCategoryDiff = 0
    allCategories.forEach(category => {
      const diff = Math.abs((yellowCategories[category] || 0) - (blueCategories[category] || 0))
      maxCategoryDiff = Math.max(maxCategoryDiff, diff)
      // 차이가 0이면 1000점, 1이면 500점, 2이면 100점, 3 이상이면 0점
      if (diff === 0) {
        positionScore += 1000
      } else if (diff === 1) {
        positionScore += 500
      } else if (diff === 2) {
        positionScore += 100
      }
    })
    score += positionScore
    // 포지션 카테고리 차이가 2명 이상이면 큰 페널티
    if (maxCategoryDiff >= 2) {
      score -= 10000
    }
  }

  // 3. 평균 레벨 차이 (포지션 배분 후 고려 - 100점 만점)
  if (countDiff <= 1) {
    const yellowAvg = yellowLevels.length > 0 
      ? yellowLevels.reduce((a, b) => a + b, 0) / yellowLevels.length 
      : 0
    const blueAvg = blueLevels.length > 0 
      ? blueLevels.reduce((a, b) => a + b, 0) / blueLevels.length 
      : 0
    const avgDiff = Math.abs(yellowAvg - blueAvg)
    score += Math.max(0, 100 - avgDiff * 10) // 평균 차이가 작을수록 높은 점수
  }

  return score
}

// 팀 편성 함수
export function formTeams(players: any[]): { yellowTeam: any[], blueTeam: any[], stats: any } {
  if (players.length === 0) {
    return {
      yellowTeam: [],
      blueTeam: [],
      stats: { yellow: { count: 0, averageScore: 0 }, blue: { count: 0, averageScore: 0 } }
    }
  }

  // 모든 플레이어를 필드 플레이어로 처리 (골키퍼도 일반 플레이어처럼 분배)
  const allPlayers = [...players]

  // 모든 플레이어 셔플
  const shuffledFieldPlayers = shuffle(allPlayers)

  // 목표 인원수 계산
  const totalPlayers = shuffledFieldPlayers.length
  const targetPerTeam = Math.floor(totalPlayers / 2)
  const remainder = totalPlayers % 2

  // 최적의 편성 찾기 (5000번 시도 - 포지션 균형을 위해 더 많은 시도)
  let bestFormation: { yellowTeam: any[], blueTeam: any[], score: number } | null = null
  const candidates: Array<{ 
    yellowTeam: any[], 
    blueTeam: any[], 
    score: number, 
    positionDiff: number,
    avgDiff: number 
  }> = []

  for (let attempt = 0; attempt < 5000; attempt++) {
    // 모든 플레이어 다시 셔플
    const reShuffled = shuffle(shuffledFieldPlayers)
    
    // 현재 시도의 팀 구성
    const currentYellow: any[] = []
    const currentBlue: any[] = []

    // 게스트와 초대자를 같은 팀에 배치하기 위한 맵 생성
    const inviterTeamMap: { [key: string]: 'yellow' | 'blue' } = {}
    
    // 일반 플레이어와 게스트 분리
    const regularPlayers: any[] = []
    const guests: any[] = []
    
    reShuffled.forEach(player => {
      if (player.isGuest && player.invitedByUserId) {
        guests.push(player)
      } else {
        regularPlayers.push(player)
      }
    })

    // 포지션 카테고리별로 그룹화
    const playersByCategory: { [key: string]: any[] } = {}
    regularPlayers.forEach(player => {
      const category = player.positionCategory || getPositionCategory(player.position) || '미정'
      if (!playersByCategory[category]) {
        playersByCategory[category] = []
      }
      playersByCategory[category].push(player)
    })

    // 게스트도 포지션 카테고리별로 그룹화
    const guestsByCategory: { [key: string]: any[] } = {}
    guests.forEach(guest => {
      const category = guest.positionCategory || getPositionCategory(guest.position) || '미정'
      if (!guestsByCategory[category]) {
        guestsByCategory[category] = []
      }
      guestsByCategory[category].push(guest)
    })

    // 각 포지션 카테고리별로 균형있게 분배
    const allCategories = new Set([...Object.keys(playersByCategory), ...Object.keys(guestsByCategory)])
    
    allCategories.forEach(category => {
      const categoryPlayers = shuffle(playersByCategory[category] || [])
      const categoryGuests = guestsByCategory[category] || []
      
      // 일반 플레이어 먼저 분배
      const categoryCount = categoryPlayers.length
      const yellowCount = Math.floor(categoryCount / 2)
      const blueCount = categoryCount - yellowCount

      // 노랑팀에 배치
      for (let i = 0; i < yellowCount; i++) {
        const player = categoryPlayers[i]
        currentYellow.push(player)
        inviterTeamMap[player.userId] = 'yellow'
      }

      // 파랑팀에 배치
      for (let i = yellowCount; i < categoryCount; i++) {
        const player = categoryPlayers[i]
        currentBlue.push(player)
        inviterTeamMap[player.userId] = 'blue'
      }

      // 게스트 배치 (초대자와 같은 팀 희망 여부에 따라)
      categoryGuests.forEach(guest => {
        const wantsSameTeam = guest.sameTeamAsInviter !== undefined ? guest.sameTeamAsInviter : false
        
        if (wantsSameTeam && guest.invitedByUserId && inviterTeamMap[guest.invitedByUserId]) {
          // 같은 팀 희망하고 초대자가 있는 경우 초대자 팀에 배치
          const inviterTeam = inviterTeamMap[guest.invitedByUserId]
          if (inviterTeam === 'yellow') {
            currentYellow.push(guest)
          } else {
            currentBlue.push(guest)
          }
        } else {
          // 같은 팀 희망하지 않거나 초대자가 없는 경우 포지션 균형을 고려하여 배치
          // 현재 카테고리의 각 팀 인원수 확인
          const yellowCategoryCount = currentYellow.filter(p => {
            const cat = p.positionCategory || getPositionCategory(p.position) || '미정'
            return cat === category
          }).length
          const blueCategoryCount = currentBlue.filter(p => {
            const cat = p.positionCategory || getPositionCategory(p.position) || '미정'
            return cat === category
          }).length

          if (yellowCategoryCount <= blueCategoryCount) {
            currentYellow.push(guest)
          } else {
            currentBlue.push(guest)
          }
        }
      })
    })

    // 레벨 점수 계산
    const yellowLevels = currentYellow.map(p => 
      p.isGuest ? getGuestLevelScore(p.guestLevel) : getPlayerLevelScore(p.level)
    )
    const blueLevels = currentBlue.map(p => 
      p.isGuest ? getGuestLevelScore(p.guestLevel) : getPlayerLevelScore(p.level)
    )

    // 편성 점수 계산
    const score = calculateFormationScore(currentYellow, currentBlue, yellowLevels, blueLevels)
    
    const countDiff = Math.abs(currentYellow.length - currentBlue.length)
    const positionDiff = calculatePositionCategoryDiff(currentYellow, currentBlue)
    const maxPositionDiff = calculateMaxPositionCategoryDiff(currentYellow, currentBlue)
    const yellowAvg = yellowLevels.length > 0 ? yellowLevels.reduce((a, b) => a + b, 0) / yellowLevels.length : 0
    const blueAvg = blueLevels.length > 0 ? blueLevels.reduce((a, b) => a + b, 0) / blueLevels.length : 0
    const avgDiff = Math.abs(yellowAvg - blueAvg)

    // 인원수가 같거나 1명 차이이고, 포지션 카테고리별 최대 차이가 1명 이하인 경우만 후보에 추가
    if (countDiff <= 1 && maxPositionDiff <= 1) {
      candidates.push({
        yellowTeam: currentYellow,
        blueTeam: currentBlue,
        score,
        positionDiff,
        avgDiff
      })
    }
  }

  // 후보가 없으면 포지션 균형을 고려한 기본 분배
  if (candidates.length === 0) {
    const defaultYellow: any[] = []
    const defaultBlue: any[] = []
    const inviterTeamMap: { [key: string]: 'yellow' | 'blue' } = {}
    
    // 일반 플레이어와 게스트 분리
    const regularPlayers: any[] = []
    const guests: any[] = []
    
    shuffledFieldPlayers.forEach(player => {
      if (player.isGuest && player.invitedByUserId) {
        guests.push(player)
      } else {
        regularPlayers.push(player)
      }
    })

    // 포지션 카테고리별로 그룹화
    const playersByCategory: { [key: string]: any[] } = {}
    regularPlayers.forEach(player => {
      const category = player.positionCategory || getPositionCategory(player.position) || '미정'
      if (!playersByCategory[category]) {
        playersByCategory[category] = []
      }
      playersByCategory[category].push(player)
    })

    // 게스트도 포지션 카테고리별로 그룹화
    const guestsByCategory: { [key: string]: any[] } = {}
    guests.forEach(guest => {
      const category = guest.positionCategory || getPositionCategory(guest.position) || '미정'
      if (!guestsByCategory[category]) {
        guestsByCategory[category] = []
      }
      guestsByCategory[category].push(guest)
    })

    // 각 포지션 카테고리별로 균형있게 분배
    const allCategories = new Set([...Object.keys(playersByCategory), ...Object.keys(guestsByCategory)])
    
    allCategories.forEach(category => {
      const categoryPlayers = shuffle(playersByCategory[category] || [])
      const categoryGuests = guestsByCategory[category] || []
      
      // 일반 플레이어 먼저 분배
      const categoryCount = categoryPlayers.length
      const yellowCount = Math.floor(categoryCount / 2)
      const blueCount = categoryCount - yellowCount

      // 노랑팀에 배치
      for (let i = 0; i < yellowCount; i++) {
        const player = categoryPlayers[i]
        defaultYellow.push(player)
        inviterTeamMap[player.userId] = 'yellow'
      }

      // 파랑팀에 배치
      for (let i = yellowCount; i < categoryCount; i++) {
        const player = categoryPlayers[i]
        defaultBlue.push(player)
        inviterTeamMap[player.userId] = 'blue'
      }

      // 게스트 배치 (초대자와 같은 팀 희망 여부에 따라)
      categoryGuests.forEach(guest => {
        const wantsSameTeam = guest.sameTeamAsInviter !== undefined ? guest.sameTeamAsInviter : false
        
        if (wantsSameTeam && guest.invitedByUserId && inviterTeamMap[guest.invitedByUserId]) {
          // 같은 팀 희망하고 초대자가 있는 경우 초대자 팀에 배치
          const inviterTeam = inviterTeamMap[guest.invitedByUserId]
          if (inviterTeam === 'yellow') {
            defaultYellow.push(guest)
          } else {
            defaultBlue.push(guest)
          }
        } else {
          // 같은 팀 희망하지 않거나 초대자가 없는 경우 포지션 균형을 고려하여 배치
          const yellowCategoryCount = defaultYellow.filter(p => {
            const cat = p.positionCategory || getPositionCategory(p.position) || '미정'
            return cat === category
          }).length
          const blueCategoryCount = defaultBlue.filter(p => {
            const cat = p.positionCategory || getPositionCategory(p.position) || '미정'
            return cat === category
          }).length

          if (yellowCategoryCount <= blueCategoryCount) {
            defaultYellow.push(guest)
          } else {
            defaultBlue.push(guest)
          }
        }
      })
    })

    bestFormation = {
      yellowTeam: defaultYellow,
      blueTeam: defaultBlue,
      score: 0
    }
  } else {
    // 정렬 우선순위: 1. 포지션 카테고리 차이, 2. 평균 레벨 차이, 3. 점수
    candidates.sort((a, b) => {
      // 1순위: 포지션 카테고리 차이 (작을수록 좋음)
      if (a.positionDiff !== b.positionDiff) {
        return a.positionDiff - b.positionDiff
      }
      // 2순위: 평균 레벨 차이 (작을수록 좋음)
      if (a.avgDiff !== b.avgDiff) {
        return a.avgDiff - b.avgDiff
      }
      // 3순위: 점수 (클수록 좋음)
      return b.score - a.score
    })

    // 상위 10% 중에서 랜덤 선택
    const top10Percent = Math.max(1, Math.floor(candidates.length * 0.1))
    const topCandidates = candidates.slice(0, top10Percent)
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]
    
    bestFormation = {
      yellowTeam: selected.yellowTeam,
      blueTeam: selected.blueTeam,
      score: selected.score
    }
  }

  // 최종 인원수 균형 맞추기 (강제 조정) - 포지션 균형 고려
  const finalCountDiff = Math.abs(bestFormation.yellowTeam.length - bestFormation.blueTeam.length)
  if (finalCountDiff > 1) {
    const largerTeam = bestFormation.yellowTeam.length > bestFormation.blueTeam.length 
      ? bestFormation.yellowTeam 
      : bestFormation.blueTeam
    const smallerTeam = bestFormation.yellowTeam.length > bestFormation.blueTeam.length 
      ? bestFormation.blueTeam 
      : bestFormation.yellowTeam

    const playersToMove = Math.floor((largerTeam.length - smallerTeam.length) / 2)
    
    // 각 팀의 포지션 카테고리별 인원수 계산
    const getCategoryCount = (team: any[]): { [key: string]: number } => {
      const counts: { [key: string]: number } = {}
      team.forEach(player => {
        const category = player.positionCategory || getPositionCategory(player.position) || '미정'
        counts[category] = (counts[category] || 0) + 1
      })
      return counts
    }

    const largerTeamCategories = getCategoryCount(largerTeam)
    const smallerTeamCategories = getCategoryCount(smallerTeam)

    // 이동할 선수 선택 (포지션 균형을 고려)
    for (let i = 0; i < playersToMove; i++) {
      // 각 카테고리별로 차이 계산하여 가장 차이가 큰 카테고리의 선수를 이동
      let bestCategoryToMove = ''
      let maxDiff = -1

      Object.keys(largerTeamCategories).forEach(category => {
        if (category === '미정' || category === '게스트') return
        
        const largerCount = largerTeamCategories[category] || 0
        const smallerCount = smallerTeamCategories[category] || 0
        const diff = largerCount - smallerCount

        if (diff > maxDiff && largerCount > 0) {
          maxDiff = diff
          bestCategoryToMove = category
        }
      })

      // 해당 카테고리의 선수 찾아서 이동
      let playerToMove: any = null
      if (bestCategoryToMove) {
        const index = largerTeam.findIndex(player => {
          const category = player.positionCategory || getPositionCategory(player.position) || '미정'
          return category === bestCategoryToMove
        })
        if (index !== -1) {
          playerToMove = largerTeam.splice(index, 1)[0]
        }
      }

      // 카테고리별로 찾지 못했으면 마지막 선수 이동
      if (!playerToMove) {
        playerToMove = largerTeam.pop()
      }

      if (playerToMove) {
        smallerTeam.push(playerToMove)
        // 카운트 업데이트
        const category = playerToMove.positionCategory || getPositionCategory(playerToMove.position) || '미정'
        largerTeamCategories[category] = (largerTeamCategories[category] || 0) - 1
        smallerTeamCategories[category] = (smallerTeamCategories[category] || 0) + 1
      } else {
        break
      }
    }
  }

  // 최종 포지션 균형 재확인 및 재조정 (포지션 균형이 최우선)
  const getCategoryCount = (team: any[]): { [key: string]: number } => {
    const counts: { [key: string]: number } = {}
    team.forEach(player => {
      const category = player.positionCategory || getPositionCategory(player.position) || '미정'
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }

  let maxIterations = 10 // 무한 루프 방지
  let iteration = 0
  while (iteration < maxIterations) {
    const yellowCategories = getCategoryCount(bestFormation.yellowTeam)
    const blueCategories = getCategoryCount(bestFormation.blueTeam)
    
    // 모든 카테고리 확인
    const allCategories = new Set([...Object.keys(yellowCategories), ...Object.keys(blueCategories)])
    let needsAdjustment = false
    let worstCategory = ''
    let worstDiff = 0

    allCategories.forEach(category => {
      if (category === '미정' || category === '게스트') return
      
      const yellowCount = yellowCategories[category] || 0
      const blueCount = blueCategories[category] || 0
      const diff = Math.abs(yellowCount - blueCount)

      if (diff > 1 && diff > worstDiff) {
        needsAdjustment = true
        worstCategory = category
        worstDiff = diff
      }
    })

    if (!needsAdjustment) break // 포지션 균형이 맞으면 종료

    // 가장 차이가 큰 카테고리 재조정
    const yellowCount = yellowCategories[worstCategory] || 0
    const blueCount = blueCategories[worstCategory] || 0
    
    if (yellowCount > blueCount) {
      // 노랑팀에서 파랑팀으로 이동
      const index = bestFormation.yellowTeam.findIndex(player => {
        const category = player.positionCategory || getPositionCategory(player.position) || '미정'
        return category === worstCategory
      })
      if (index !== -1) {
        const playerToMove = bestFormation.yellowTeam.splice(index, 1)[0]
        bestFormation.blueTeam.push(playerToMove)
      }
    } else {
      // 파랑팀에서 노랑팀으로 이동
      const index = bestFormation.blueTeam.findIndex(player => {
        const category = player.positionCategory || getPositionCategory(player.position) || '미정'
        return category === worstCategory
      })
      if (index !== -1) {
        const playerToMove = bestFormation.blueTeam.splice(index, 1)[0]
        bestFormation.yellowTeam.push(playerToMove)
      }
    }

    iteration++
  }

  // 전체 참가자 중 주포지션이 골키퍼인 선수 수 확인
  const mainGoalkeepers = players.filter(p => 
    getPositionCategory(p.position) === '골키퍼' || 
    p.position?.toUpperCase() === 'GK'
  )
  
  // 각 팀의 골키퍼 수 계산
  const getGoalkeeperCount = (team: any[]): number => {
    return team.filter(p => 
      getPositionCategory(p.position) === '골키퍼' || 
      p.position?.toUpperCase() === 'GK'
    ).length
  }
  
  // 골키퍼가 없는 팀에 부포지션이 GK인 선수 배치
  const assignBackupGoalkeeper = (team: any[]) => {
    // 골키퍼가 있는지 확인 (주포지션이 골키퍼인 선수)
    const hasMainGoalkeeper = team.some(p => 
      getPositionCategory(p.position) === '골키퍼' || 
      p.position?.toUpperCase() === 'GK'
    )
    
    if (hasMainGoalkeeper) return // 이미 주포지션이 골키퍼인 선수가 있으면 종료
    
    // 부포지션에 GK가 있는 선수 찾기 (주포지션이 골키퍼가 아닌 선수 중)
    const backupGK = team.find(p => {
      // 주포지션이 골키퍼가 아니어야 함
      const mainPosCategory = getPositionCategory(p.position)
      if (mainPosCategory === '골키퍼' || p.position?.toUpperCase() === 'GK') {
        return false
      }
      
      // 부포지션에 GK가 있어야 함
      if (!p.subPositions || p.subPositions.length === 0) return false
      return p.subPositions.some((subPos: string) => 
        getPositionCategory(subPos) === '골키퍼' || subPos.toUpperCase() === 'GK'
      )
    })
    
    if (backupGK) {
      // 부포지션에 GK가 있는 선수를 골키퍼로 표시하기 위해 positionCategory와 position 업데이트
      backupGK.positionCategory = '골키퍼'
      // 표시용 포지션도 GK로 변경 (원래 주포지션은 유지하되, 표시는 GK로)
      backupGK.displayPosition = 'GK'
      // 부포지션 표시용: GK를 제거하고 원래 주포지션을 부포지션에 추가
      if (backupGK.subPositions && backupGK.subPositions.length > 0) {
        const filteredSubPositions = backupGK.subPositions.filter((pos: string) => 
          pos.toUpperCase() !== 'GK'
        )
        // 원래 주포지션이 부포지션에 없으면 추가
        if (backupGK.position && !filteredSubPositions.includes(backupGK.position)) {
          filteredSubPositions.push(backupGK.position)
        }
        backupGK.displaySubPositions = filteredSubPositions
      } else if (backupGK.position) {
        // 부포지션이 없으면 원래 주포지션을 부포지션으로 표시
        backupGK.displaySubPositions = [backupGK.position]
      }
    }
  }

  // 주포지션이 골키퍼인 선수가 홀수일 경우, 골키퍼가 적은 팀에 부포지션이 GK인 선수 배치
  if (mainGoalkeepers.length > 0 && mainGoalkeepers.length % 2 === 1) {
    // 각 팀의 골키퍼 수 확인
    const yellowGKCount = getGoalkeeperCount(bestFormation.yellowTeam)
    const blueGKCount = getGoalkeeperCount(bestFormation.blueTeam)
    
    // 골키퍼가 적은 팀에 부포지션이 GK인 선수 배치
    if (yellowGKCount < blueGKCount) {
      // 노랑팀에 골키퍼가 적으면 노랑팀에 배치
      assignBackupGoalkeeper(bestFormation.yellowTeam)
    } else if (blueGKCount < yellowGKCount) {
      // 파랑팀에 골키퍼가 적으면 파랑팀에 배치
      assignBackupGoalkeeper(bestFormation.blueTeam)
    } else {
      // 골키퍼 수가 같으면 양쪽 팀 모두 확인 (골키퍼가 없는 팀에 배치)
      assignBackupGoalkeeper(bestFormation.yellowTeam)
      assignBackupGoalkeeper(bestFormation.blueTeam)
    }
  } else if (mainGoalkeepers.length <= 1) {
    // 주포지션이 골키퍼인 선수가 1명 이하이고, 부포지션이 GK인 선수가 있으면 배치
    assignBackupGoalkeeper(bestFormation.yellowTeam)
    assignBackupGoalkeeper(bestFormation.blueTeam)
  }

  // 통계 계산
  const yellowLevels = bestFormation.yellowTeam.map(p => 
    p.isGuest ? getGuestLevelScore(p.guestLevel) : getPlayerLevelScore(p.level)
  )
  const blueLevels = bestFormation.blueTeam.map(p => 
    p.isGuest ? getGuestLevelScore(p.guestLevel) : getPlayerLevelScore(p.level)
  )

  const yellowAvg = yellowLevels.length > 0 
    ? Number((yellowLevels.reduce((a, b) => a + b, 0) / yellowLevels.length).toFixed(2))
    : 0
  const blueAvg = blueLevels.length > 0 
    ? Number((blueLevels.reduce((a, b) => a + b, 0) / blueLevels.length).toFixed(2))
    : 0

  return {
    yellowTeam: bestFormation.yellowTeam,
    blueTeam: bestFormation.blueTeam,
    stats: {
      yellow: {
        count: bestFormation.yellowTeam.length,
        averageScore: yellowAvg
      },
      blue: {
        count: bestFormation.blueTeam.length,
        averageScore: blueAvg
      }
    }
  }
}

