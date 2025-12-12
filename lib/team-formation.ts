// 팀편성 알고리즘 유틸리티

// 포지션 대분류 매핑
export function getPositionCategory(position: string | null | undefined): string {
  if (!position) return '미정'
  
  const pos = position.toUpperCase()
  
  // 공격수
  if (['ST', 'CF', 'SS', 'LWF', 'RWF'].includes(pos)) {
    return '공격수'
  }
  
  // 미드필더
  if (['CAM', 'CM', 'CDM'].includes(pos)) {
    return '미드필더'
  }
  
  // 수비수
  if (['CB', 'RB', 'LB', 'DRL', 'DRLC'].includes(pos)) {
    return '수비수'
  }
  
  // 골키퍼
  if (pos === 'GK') {
    return '골키퍼'
  }
  
  return '미정'
}

// 레벨을 점수로 변환 (루키=1점, 아마추어1=2점 ... 프로=10점)
export function levelToScore(level: number | null | undefined): number {
  if (!level || level < 1) return 1
  // 레벨을 그대로 점수로 사용하되, 10 이상은 10으로 제한
  return Math.min(level, 10)
}

// 게스트 레벨을 점수로 변환 (미숙=1, 보통=2, 잘함=3)
export function guestLevelToScore(guestLevel: number | null | undefined): number {
  if (!guestLevel) return 1
  return Math.min(Math.max(guestLevel, 1), 3)
}

// 참석자 인터페이스
export interface AttendeeForFormation {
  userId: string
  name: string
  position: string | null
  subPositions: string[]
  level: number | null
  isGuest: boolean
  guestLevel?: number | null
  category?: string // 포지션 대분류 (팀편성 알고리즘에서 계산)
  score?: number // 레벨 점수 (팀편성 알고리즘에서 계산)
  status?: 'attending' | 'not_attending' | 'pending' // API에서 사용
}

// 팀편성 결과 인터페이스
export interface TeamFormationResult {
  yellowTeam: AttendeeForFormation[]
  blueTeam: AttendeeForFormation[]
  yellowTeamStats: {
    count: number
    averageScore: number
    positionCounts: {
      공격수: number
      미드필더: number
      수비수: number
      골키퍼: number
    }
  }
  blueTeamStats: {
    count: number
    averageScore: number
    positionCounts: {
      공격수: number
      미드필더: number
      수비수: number
      골키퍼: number
    }
  }
}

// 팀 통계 계산
function calculateTeamStats(team: AttendeeForFormation[]) {
  const positionCounts = {
    공격수: 0,
    미드필더: 0,
    수비수: 0,
    골키퍼: 0,
    미정: 0
  }
  
  let totalScore = 0
  
  team.forEach(player => {
    positionCounts[player.category as keyof typeof positionCounts] = 
      (positionCounts[player.category as keyof typeof positionCounts] || 0) + 1
    totalScore += player.score
  })
  
  return {
    count: team.length,
    averageScore: team.length > 0 ? Number((totalScore / team.length).toFixed(2)) : 0,
    positionCounts: {
      공격수: positionCounts.공격수,
      미드필더: positionCounts.미드필더,
      수비수: positionCounts.수비수,
      골키퍼: positionCounts.골키퍼
    }
  }
}

// 팀편성 알고리즘
export function formTeams(attendees: AttendeeForFormation[]): TeamFormationResult {
  // 참석 인원만 필터링 (status가 있으면 'attending'만, 없으면 모두 포함)
  const attendingPlayers = attendees.filter(a => !a.status || a.status === 'attending')
  
  if (attendingPlayers.length < 2) {
    throw new Error('팀편성을 위해서는 최소 2명 이상의 참석 인원이 필요합니다.')
  }
  
  // 참석자 데이터 준비
  const players: AttendeeForFormation[] = attendingPlayers.map(player => ({
    userId: player.userId,
    name: player.name,
    position: player.position,
    subPositions: player.subPositions || [],
    level: player.level,
    isGuest: player.isGuest || false,
    guestLevel: player.guestLevel,
    category: getPositionCategory(player.position),
    score: player.isGuest 
      ? guestLevelToScore(player.guestLevel) 
      : levelToScore(player.level)
  }))
  
  // 골키퍼 분리 (골키퍼는 각 팀에 1명씩 배치)
  const goalkeepers = players.filter(p => p.category === '골키퍼')
  const fieldPlayers = players.filter(p => p.category !== '골키퍼')
  
  // 골키퍼 배치는 매번 랜덤하게 (팀편성 시도마다 다르게 배치)
  // 여기서는 초기값만 설정하고, 실제 배치는 시도마다 랜덤하게 함
  const gkForYellow: AttendeeForFormation[] = []
  const gkForBlue: AttendeeForFormation[] = []
  
  // 인원수 균등 배분이 최우선 - 목표 인원수 계산
  const totalPlayers = players.length
  const targetPerTeam = Math.floor(totalPlayers / 2)
  const remainder = totalPlayers % 2
  
  // 목표: 각 팀에 targetPerTeam명씩 배치 (나머지가 있으면 한 팀에 +1)
  const targetYellow = targetPerTeam + (remainder > 0 ? 1 : 0)
  const targetBlue = targetPerTeam
  
  // 초기 팀 구성 (골키퍼 포함)
  let yellowTeam: AttendeeForFormation[] = []
  let blueTeam: AttendeeForFormation[] = []
  
  // 초기 골키퍼 배치 (랜덤)
  const initialGkShuffle = [...goalkeepers]
  for (let i = initialGkShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [initialGkShuffle[i], initialGkShuffle[j]] = [initialGkShuffle[j], initialGkShuffle[i]]
  }
  for (let i = 0; i < initialGkShuffle.length; i++) {
    if (i % 2 === 0) {
      yellowTeam.push(initialGkShuffle[i])
    } else {
      blueTeam.push(initialGkShuffle[i])
    }
  }
  
  // 초기 필드 플레이어 배치 (랜덤)
  const initialFieldShuffle = [...fieldPlayers]
  for (let i = initialFieldShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [initialFieldShuffle[i], initialFieldShuffle[j]] = [initialFieldShuffle[j], initialFieldShuffle[i]]
  }
  for (let i = 0; i < initialFieldShuffle.length; i++) {
    if (i % 2 === 0) {
      yellowTeam.push(initialFieldShuffle[i])
    } else {
      blueTeam.push(initialFieldShuffle[i])
    }
  }
  
  // 팀 균형 조정 (인원수 균등이 최우선)
  let bestFormation = { yellowTeam, blueTeam }
  let bestScore = calculateFormationScore(yellowTeam, blueTeam)
  
  // 인원수가 같을 때 평균 레벨이 비슷한 여러 후보를 저장
  const candidates: Array<{ yellowTeam: AttendeeForFormation[], blueTeam: AttendeeForFormation[], score: number }> = []
  
  // 여러 번 시도하여 최적의 조합 찾기 (인원수 균등 우선)
  for (let attempt = 0; attempt < 2000; attempt++) {
    // 골키퍼를 매번 랜덤하게 배치
    const shuffledGKs = [...goalkeepers]
    // Fisher-Yates 셔플 알고리즘 사용
    for (let i = shuffledGKs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledGKs[i], shuffledGKs[j]] = [shuffledGKs[j], shuffledGKs[i]]
    }
    
    const testGkYellow: AttendeeForFormation[] = []
    const testGkBlue: AttendeeForFormation[] = []
    
    // 골키퍼를 번갈아가며 배치
    for (let i = 0; i < shuffledGKs.length; i++) {
      if (i % 2 === 0) {
        testGkYellow.push(shuffledGKs[i])
      } else {
        testGkBlue.push(shuffledGKs[i])
      }
    }
    
    // 필드 플레이어를 완전히 랜덤하게 섞기
    const shuffled = [...fieldPlayers]
    // Fisher-Yates 셔플 알고리즘 사용
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    const testYellow = [...testGkYellow]
    const testBlue = [...testGkBlue]
    
    // 인원수 균등 배분을 위해 정확히 배치
    let yellowCount = testYellow.length
    let blueCount = testBlue.length
    
    for (let i = 0; i < shuffled.length; i++) {
      // 목표 인원수에 맞춰 배치
      if (yellowCount < targetYellow && (yellowCount < blueCount || blueCount >= targetBlue)) {
        testYellow.push(shuffled[i])
        yellowCount++
      } else if (blueCount < targetBlue) {
        testBlue.push(shuffled[i])
        blueCount++
      } else {
        // 목표 인원수에 도달했으면 나머지는 번갈아가며 배치
        if (i % 2 === 0) {
          testYellow.push(shuffled[i])
          yellowCount++
        } else {
          testBlue.push(shuffled[i])
          blueCount++
        }
      }
    }
    
    // 인원수 차이가 1 이하인 경우만 고려
    const countDiff = Math.abs(testYellow.length - testBlue.length)
    if (countDiff <= 1) {
      const testScore = calculateFormationScore(testYellow, testBlue)
      
      // 인원수가 같을 때 (countDiff === 0) 후보에 추가
      if (countDiff === 0) {
        candidates.push({ yellowTeam: testYellow, blueTeam: testBlue, score: testScore })
      }
      
      if (testScore > bestScore) {
        bestScore = testScore
        bestFormation = { yellowTeam: testYellow, blueTeam: testBlue }
      }
    }
  }
  
  // 인원수가 같은 후보가 있으면, 평균 레벨 차이가 가장 작은 것들 중에서 랜덤 선택
  if (candidates.length > 0) {
    // 평균 레벨 차이 계산
    const candidatesWithLevelDiff = candidates.map(candidate => {
      const yellowAvg = calculateTeamStats(candidate.yellowTeam).averageScore
      const blueAvg = calculateTeamStats(candidate.blueTeam).averageScore
      const levelDiff = Math.abs(yellowAvg - blueAvg)
      return { ...candidate, levelDiff }
    })
    
    // 평균 레벨 차이로 정렬 (작을수록 좋음)
    candidatesWithLevelDiff.sort((a, b) => a.levelDiff - b.levelDiff)
    
    // 상위 10% 후보 중에서 랜덤 선택 (최소 1개, 최대 10개)
    const topCount = Math.max(1, Math.min(10, Math.floor(candidatesWithLevelDiff.length * 0.1)))
    const topCandidates = candidatesWithLevelDiff.slice(0, topCount)
    const randomCandidate = topCandidates[Math.floor(Math.random() * topCandidates.length)]
    
    // 인원수가 같고 평균 레벨 차이가 작은 후보가 있으면 사용
    if (randomCandidate.levelDiff < 0.5 || candidatesWithLevelDiff.length > 0) {
      bestFormation = { yellowTeam: randomCandidate.yellowTeam, blueTeam: randomCandidate.blueTeam }
    }
  }
  
  // 최종 팀 구성
  yellowTeam = bestFormation.yellowTeam
  blueTeam = bestFormation.blueTeam
  
  // 최종 인원수 확인 및 조정 (만약 여전히 차이가 크면 강제 조정)
  const finalCountDiff = Math.abs(yellowTeam.length - blueTeam.length)
  if (finalCountDiff > 1) {
    // 인원수가 많은 팀에서 적은 팀으로 이동
    if (yellowTeam.length > blueTeam.length) {
      while (yellowTeam.length - blueTeam.length > 1) {
        const moved = yellowTeam.pop()
        if (moved) blueTeam.push(moved)
      }
    } else if (blueTeam.length > yellowTeam.length) {
      while (blueTeam.length - yellowTeam.length > 1) {
        const moved = blueTeam.pop()
        if (moved) yellowTeam.push(moved)
      }
    }
  }
  
  return {
    yellowTeam,
    blueTeam,
    yellowTeamStats: calculateTeamStats(yellowTeam),
    blueTeamStats: calculateTeamStats(blueTeam)
  }
}

// 팀편성 점수 계산 (높을수록 좋음)
function calculateFormationScore(
  yellowTeam: AttendeeForFormation[],
  blueTeam: AttendeeForFormation[]
): number {
  // 1. 인원수 균형 (가장 중요) - 1000점 만점 (최우선)
  const countDiff = Math.abs(yellowTeam.length - blueTeam.length)
  // 인원수 차이가 0이면 1000점, 1이면 500점, 2 이상이면 0점
  const countScore = countDiff === 0 ? 1000 : (countDiff === 1 ? 500 : 0)
  
  // 2. 포지션 대분류 균형 - 50점 만점
  const yellowPositions = calculateTeamStats(yellowTeam).positionCounts
  const bluePositions = calculateTeamStats(blueTeam).positionCounts
  
  const positionDiffs = [
    Math.abs(yellowPositions.공격수 - bluePositions.공격수),
    Math.abs(yellowPositions.미드필더 - bluePositions.미드필더),
    Math.abs(yellowPositions.수비수 - bluePositions.수비수),
    Math.abs(yellowPositions.골키퍼 - bluePositions.골키퍼)
  ]
  
  const totalPositionDiff = positionDiffs.reduce((sum, diff) => sum + diff, 0)
  const positionScore = Math.max(0, 50 - totalPositionDiff * 10)
  
  // 3. 레벨 점수 평균 균형 - 인원수가 같을 때 더 높은 가중치
  const yellowAvg = calculateTeamStats(yellowTeam).averageScore
  const blueAvg = calculateTeamStats(blueTeam).averageScore
  const avgDiff = Math.abs(yellowAvg - blueAvg)
  
  // 인원수가 같을 때는 레벨 평균 차이에 더 높은 가중치 부여
  if (countDiff === 0) {
    // 평균 차이가 0.1 이하면 100점, 0.2 이하면 90점, ... 1.0 이상이면 0점
    const avgScore = Math.max(0, 100 - avgDiff * 100)
    return countScore + positionScore + avgScore
  } else {
    // 인원수가 다를 때는 기존 가중치 유지
    const avgScore = Math.max(0, 50 - avgDiff * 10)
    return countScore + positionScore + avgScore
  }
}

