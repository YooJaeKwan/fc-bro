const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * 레벨 시스템 마이그레이션 스크립트
 * 기존 레벨 (1-13)을 새로운 레벨 (1-10)로 변환
 * 
 * 기존 -> 새로운 매핑:
 * 1 (루키) -> 1 (루키)
 * 2-4 (비기너1-3) -> 2-4 (아마추어1-3으로 변환)
 * 5-9 (아마추어1-5) -> 2-6 (아마추어1-5로 유지, 레벨 번호만 조정)
 * 10-12 (세미프로1-3) -> 7-9 (세미프로1-3으로 유지, 레벨 번호만 조정)
 * 13 (프로) -> 10 (프로)
 */
async function migrateLevelSystem() {
  try {
    console.log('레벨 시스템 마이그레이션 시작...\n')

    // 레벨 매핑 함수
    const mapOldLevelToNew = (oldLevel) => {
      if (oldLevel === 1) return 1  // 루키 -> 루키
      if (oldLevel >= 2 && oldLevel <= 4) {
        // 비기너1-3 -> 아마추어1-3 (레벨 번호 그대로 유지, 카테고리만 변경)
        return oldLevel
      }
      if (oldLevel >= 5 && oldLevel <= 9) {
        // 아마추어1-5 -> 아마추어1-5 (레벨 번호 그대로 유지)
        return oldLevel
      }
      if (oldLevel >= 10 && oldLevel <= 12) {
        // 세미프로1-3 -> 세미프로1-3 (레벨 번호 그대로 유지)
        return oldLevel
      }
      if (oldLevel === 13) return 10  // 프로 -> 프로
      return 1  // 기본값: 루키
    }

    // 모든 사용자 조회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        realName: true,
        nickname: true,
        level: true
      }
    })

    console.log(`총 ${users.length}명의 사용자를 확인했습니다.\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const user of users) {
      if (!user.level) {
        skippedCount++
        continue
      }

      const newLevel = mapOldLevelToNew(user.level)

      if (user.level !== newLevel) {
        await prisma.user.update({
          where: { id: user.id },
          data: { level: newLevel }
        })
        console.log(`✓ ${user.realName || user.nickname || user.name || '이름 없음'} (ID: ${user.id}): 레벨 ${user.level} -> ${newLevel}`)
        updatedCount++
      } else {
        skippedCount++
      }
    }

    console.log(`\n✅ 마이그레이션 완료!`)
    console.log(`📊 업데이트: ${updatedCount}명`)
    console.log(`⏭️  변경 없음: ${skippedCount}명`)

  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateLevelSystem()

