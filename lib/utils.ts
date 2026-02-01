import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDaysLeft(dateString: string): number {
  const today = new Date()
  const targetDate = new Date(dateString)

  // 시간 정보를 제거하고 날짜만 비교
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// 포지션 카테고리 순서 (공격수 -> 미드필더 -> 수비수 -> 골키퍼 -> 그외)
export const getPositionOrder = (position: string) => {
  const pos = position ? position.toUpperCase() : ''
  
  // Goalkeeper
  if (pos === 'GK') return 4
  
  // Defenders (수비수)
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'DF', 'LRB', 'LRCB'].includes(pos) || pos.includes('B')) return 3
  
  // Midfielders (미드필더)
  if (['CAM', 'CM', 'CDM', 'LM', 'RM', 'AM', 'DM', 'MF'].includes(pos) || pos.includes('M')) return 2
  
  // Attackers (공격수)
  if (['ST', 'CF', 'SS', 'LWF', 'RWF', 'LW', 'RW', 'FW'].includes(pos) || pos.includes('W') || pos.includes('F')) return 1
  
  return 5 // Unknown
}

// 팀 선수들을 포지션 순으로 정렬 (게스트는 마지막에)
export const sortByPosition = (players: any[]) => {
  return [...players].sort((a, b) => {
    // 1. 게스트 여부 확인 (게스트는 뒤로)
    // isGuest가 true이면 1 (뒤로), false이면 -1 (앞으로)
    if ((a.isGuest || false) !== (b.isGuest || false)) {
      return (a.isGuest || false) ? 1 : -1
    }

    // 2. 포지션 순서 정렬
    const posA = a.position || a.displayPosition || 'MC'
    const posB = b.position || b.displayPosition || 'MC'
    return getPositionOrder(posA) - getPositionOrder(posB)
  })
}

// 카카오톡 공유 텍스트 생성
export const generateKakaoShareText = (schedule: any, isManagerMode: boolean = false) => {
  const typeLabel = schedule.type === "internal" ? "자체경기" :
    schedule.type === "match" ? `A매치${schedule.opponentTeam ? ` vs ${schedule.opponentTeam}` : ''}` :
      schedule.type === "training" ? "연습" : schedule.type

  const [year, month, day] = schedule.date.split('-')
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day))
  const dateStr = dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })

  let text = `[경기 안내]\n`
  text += `📅 ${dateStr} ${schedule.time}\n`
  text += `🏟️ ${schedule.location || '미정'}\n`

  if (schedule.gatherTime) {
    text += `⏰ 집합: ${schedule.gatherTime} (경기 20분 전)\n`
  }

  text += `⚽ ${typeLabel}\n`

  if (schedule.description) {
    text += `📢 ${schedule.description}\n`
  }

  // 휴식시간 안내
  text += `\n[휴식시간]\n`
  text += `1Q 뒤 5분 휴식 / 2Q 뒤 10분 휴식 / 3Q 뒤 5분 휴식으로 진행.\n`
  text += `휴식시간이 짧으니 팀내 휴식인원을 빠르게 결정 후 경기할 수 있도록 부탁 드립니다.`

  // 유니폼 안내
  text += `\n\n[유니폼 관련]\n`
  text += `지인분들을 위해 회원분들은 유니폼을 2가지 모두 지참 부탁드립니다.`

  // // 팀 편성이 있고 (관리자이거나 확정된 경우) - 유니폼 안내 아래에 표시
  // if (schedule.teamFormation && (isManagerMode || schedule.formationConfirmed)) {
  //   text += `\n\n[팀 편성]\n`

  //   const yellowTeam = sortByPosition(schedule.teamFormation.yellowTeam || [])
  //   const blueTeam = sortByPosition(schedule.teamFormation.blueTeam || [])

  //   text += `🟡 Yellow Team (${yellowTeam.length}명)\n`
  //   text += yellowTeam.map((p: any) => `${p.name}`).join(', ') || '미정'
  //   text += `\n\n`

  //   text += `🔵 Blue Team (${blueTeam.length}명)\n`
  //   text += blueTeam.map((p: any) => `${p.name}`).join(', ') || '미정'
  // }

  return text
}