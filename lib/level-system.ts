// 축구 실력 레벨 시스템 (10단계)
export const LEVEL_SYSTEM = {
  1: { category: '루키', level: null, label: '루키', shortLabel: '루키' },
  2: { category: '아마추어', level: 1, label: '아마추어 1', shortLabel: 'A1' },
  3: { category: '아마추어', level: 2, label: '아마추어 2', shortLabel: 'A2' },
  4: { category: '아마추어', level: 3, label: '아마추어 3', shortLabel: 'A3' },
  5: { category: '아마추어', level: 4, label: '아마추어 4', shortLabel: 'A4' },
  6: { category: '아마추어', level: 5, label: '아마추어 5', shortLabel: 'A5' },
  7: { category: '세미프로', level: 1, label: '세미프로 1', shortLabel: 'SP1' },
  8: { category: '세미프로', level: 2, label: '세미프로 2', shortLabel: 'SP2' },
  9: { category: '세미프로', level: 3, label: '세미프로 3', shortLabel: 'SP3' },
  10: { category: '프로', level: null, label: '프로', shortLabel: '프로' }
}

export const LEVEL_OPTIONS = Object.entries(LEVEL_SYSTEM).map(([value, data]) => ({
  value: parseInt(value),
  label: data.label,
  shortLabel: data.shortLabel,
  category: data.category
}))

export const LEVEL_CATEGORIES = [
  { name: '루키', color: 'bg-gray-100 text-gray-800', levels: [1] },
  { name: '아마추어', color: 'bg-blue-100 text-blue-800', levels: [2, 3, 4, 5, 6] },
  { name: '세미프로', color: 'bg-purple-100 text-purple-800', levels: [7, 8, 9] },
  { name: '프로', color: 'bg-yellow-100 text-yellow-800', levels: [10] }
]

// 레벨 숫자를 텍스트로 변환
export function getLevelLabel(level: number | null | undefined): string {
  if (!level || level < 1 || level > 10) return '루키'
  return LEVEL_SYSTEM[level as keyof typeof LEVEL_SYSTEM]?.label || '루키'
}

// 레벨 숫자를 짧은 텍스트로 변환
export function getLevelShortLabel(level: number | null | undefined): string {
  if (!level || level < 1 || level > 10) return '루키'
  return LEVEL_SYSTEM[level as keyof typeof LEVEL_SYSTEM]?.shortLabel || '루키'
}

// 레벨 카테고리 색상 가져오기
export function getLevelColor(level: number | null | undefined): string {
  if (!level || level < 1 || level > 10) return 'bg-gray-100 text-gray-800'
  
  const category = LEVEL_SYSTEM[level as keyof typeof LEVEL_SYSTEM]?.category
  const categoryData = LEVEL_CATEGORIES.find(cat => cat.name === category)
  return categoryData?.color || 'bg-gray-100 text-gray-800'
}

// 평균 레벨 계산 (팀 편성용)
export function calculateAverageLevel(players: Array<{ level?: number }>): number {
  if (players.length === 0) return 1
  const total = players.reduce((sum, player) => sum + (player.level || 1), 0)
  return Math.round(total / players.length * 10) / 10 // 소수점 1자리
}
