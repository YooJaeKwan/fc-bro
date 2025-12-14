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
  if (!guestLevel) return 2
  switch (guestLevel) {
    case '미숙': return 2
    case '보통': return 3
    case '잘함': return 4
    default: return 2
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
    allCategories.forEach(category => {
      const diff = Math.abs((yellowCategories[category] || 0) - (blueCategories[category] || 0))
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

  // 최적의 편성 찾기 (2000번 시도)
  let bestFormation: { yellowTeam: any[], blueTeam: any[], score: number } | null = null
  const candidates: Array<{ 
    yellowTeam: any[], 
    blueTeam: any[], 
    score: number, 
    positionDiff: number,
    avgDiff: number 
  }> = []

  for (let attempt = 0; attempt < 2000; attempt++) {
    // 모든 플레이어 다시 셔플
    const reShuffled = shuffle(shuffledFieldPlayers)
    
    // 현재 시도의 팀 구성
    const currentYellow: any[] = []
    const currentBlue: any[] = []

    // 모든 플레이어 분배 (골키퍼 포함)
    for (let i = 0; i < reShuffled.length; i++) {
      if (i < targetPerTeam + (remainder > 0 ? 1 : 0)) {
        currentYellow.push(reShuffled[i])
      } else {
        currentBlue.push(reShuffled[i])
      }
    }

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
    const yellowAvg = yellowLevels.length > 0 ? yellowLevels.reduce((a, b) => a + b, 0) / yellowLevels.length : 0
    const blueAvg = blueLevels.length > 0 ? blueLevels.reduce((a, b) => a + b, 0) / blueLevels.length : 0
    const avgDiff = Math.abs(yellowAvg - blueAvg)

    // 인원수가 같거나 1명 차이인 경우만 후보에 추가
    if (countDiff <= 1) {
      candidates.push({
        yellowTeam: currentYellow,
        blueTeam: currentBlue,
        score,
        positionDiff,
        avgDiff
      })
    }
  }

  // 후보가 없으면 기본 분배
  if (candidates.length === 0) {
    const defaultYellow: any[] = []
    const defaultBlue: any[] = []
    for (let i = 0; i < shuffledFieldPlayers.length; i++) {
      if (i % 2 === 0) {
        defaultYellow.push(shuffledFieldPlayers[i])
      } else {
        defaultBlue.push(shuffledFieldPlayers[i])
      }
    }
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

  // 최종 인원수 균형 맞추기 (강제 조정)
  const finalCountDiff = Math.abs(bestFormation.yellowTeam.length - bestFormation.blueTeam.length)
  if (finalCountDiff > 1) {
    const largerTeam = bestFormation.yellowTeam.length > bestFormation.blueTeam.length 
      ? bestFormation.yellowTeam 
      : bestFormation.blueTeam
    const smallerTeam = bestFormation.yellowTeam.length > bestFormation.blueTeam.length 
      ? bestFormation.blueTeam 
      : bestFormation.yellowTeam

    const playersToMove = Math.floor((largerTeam.length - smallerTeam.length) / 2)
    for (let i = 0; i < playersToMove; i++) {
      const playerToMove = largerTeam.pop()
      if (playerToMove) {
        smallerTeam.push(playerToMove)
      } else {
        break
      }
    }
  }

  // 전체 참가자 중 주포지션이 골키퍼인 선수 수 확인
  const mainGoalkeepers = players.filter(p => 
    getPositionCategory(p.position) === '골키퍼' || 
    p.position?.toUpperCase() === 'GK'
  )
  
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
      // 부포지션에 GK가 있는 선수를 골키퍼로 표시하기 위해 positionCategory 업데이트
      backupGK.positionCategory = '골키퍼'
    }
  }

  // 주포지션이 골키퍼인 선수가 1명 이하이고, 부포지션이 GK인 선수가 있으면 배치
  if (mainGoalkeepers.length <= 1) {
    // 각 팀에 골키퍼 배치 확인
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

