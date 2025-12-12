const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 포지션 매핑: 기존 → 새로운
const positionMapping = {
  'AMC': 'CAM',
  'DM': 'CDM',
  'MC': 'CM',
  'DC': 'CB',
  'DL': 'LB',
  'DR': 'RB'
}

async function updatePositions() {
  try {
    console.log('🔄 포지션 용어 변경 시작...\n')

    // 1. User 테이블의 preferredPosition 업데이트
    console.log('1️⃣ User 테이블의 preferredPosition 업데이트 중...')
    let userUpdatedCount = 0
    
    for (const [oldPos, newPos] of Object.entries(positionMapping)) {
      const result = await prisma.user.updateMany({
        where: {
          preferredPosition: oldPos
        },
        data: {
          preferredPosition: newPos
        }
      })
      userUpdatedCount += result.count
      if (result.count > 0) {
        console.log(`   ✅ ${oldPos} → ${newPos}: ${result.count}개 업데이트`)
      }
    }
    console.log(`   ✅ 총 ${userUpdatedCount}개의 User preferredPosition 업데이트 완료\n`)

    // 2. User 테이블의 subPositions 배열 업데이트
    console.log('2️⃣ User 테이블의 subPositions 배열 업데이트 중...')
    const allUsers = await prisma.user.findMany({
      where: {
        subPositions: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        subPositions: true
      }
    })

    let subPosUpdatedCount = 0
    for (const user of allUsers) {
      const updatedSubPositions = user.subPositions.map(pos => 
        positionMapping[pos] || pos
      )
      
      // 변경사항이 있는 경우에만 업데이트
      if (JSON.stringify(user.subPositions) !== JSON.stringify(updatedSubPositions)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subPositions: updatedSubPositions }
        })
        subPosUpdatedCount++
      }
    }
    console.log(`   ✅ ${subPosUpdatedCount}개의 User subPositions 업데이트 완료\n`)

    // 3. ScheduleAttendance 테이블의 guestPosition 업데이트
    console.log('3️⃣ ScheduleAttendance 테이블의 guestPosition 업데이트 중...')
    let guestPosUpdatedCount = 0
    
    for (const [oldPos, newPos] of Object.entries(positionMapping)) {
      const result = await prisma.scheduleAttendance.updateMany({
        where: {
          guestPosition: oldPos
        },
        data: {
          guestPosition: newPos
        }
      })
      guestPosUpdatedCount += result.count
      if (result.count > 0) {
        console.log(`   ✅ ${oldPos} → ${newPos}: ${result.count}개 업데이트`)
      }
    }
    console.log(`   ✅ 총 ${guestPosUpdatedCount}개의 ScheduleAttendance guestPosition 업데이트 완료\n`)

    // 4. SchedulePlayerStat 테이블의 position 업데이트
    console.log('4️⃣ SchedulePlayerStat 테이블의 position 업데이트 중...')
    let playerStatUpdatedCount = 0
    
    for (const [oldPos, newPos] of Object.entries(positionMapping)) {
      const result = await prisma.schedulePlayerStat.updateMany({
        where: {
          position: oldPos
        },
        data: {
          position: newPos
        }
      })
      playerStatUpdatedCount += result.count
      if (result.count > 0) {
        console.log(`   ✅ ${oldPos} → ${newPos}: ${result.count}개 업데이트`)
      }
    }
    console.log(`   ✅ 총 ${playerStatUpdatedCount}개의 SchedulePlayerStat position 업데이트 완료\n`)

    console.log('✅ 포지션 용어 변경 완료!')
    console.log(`\n📊 변경 요약:`)
    console.log(`   - User preferredPosition: ${userUpdatedCount}개`)
    console.log(`   - User subPositions: ${subPosUpdatedCount}개`)
    console.log(`   - ScheduleAttendance guestPosition: ${guestPosUpdatedCount}개`)
    console.log(`   - SchedulePlayerStat position: ${playerStatUpdatedCount}개`)

  } catch (error) {
    console.error('❌ 포지션 용어 변경 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
updatePositions()
  .then(() => {
    console.log('\n✅ 모든 작업이 완료되었습니다.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 작업 중 오류가 발생했습니다:', error)
    process.exit(1)
  })

