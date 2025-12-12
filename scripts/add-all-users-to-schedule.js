const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addAllUsersToSchedule() {
  try {
    // 12월 20일 일정 찾기 (UTC 시간대 고려하여 12월 19일~20일 범위로 검색)
    const startDate = new Date('2025-12-19T00:00:00.000Z')
    const endDate = new Date('2025-12-21T00:00:00.000Z')

    console.log('12월 20일 일정 검색 중...')
    console.log(`검색 범위: ${startDate.toISOString()} ~ ${endDate.toISOString()}`)
    
    const schedules = await prisma.schedule.findMany({
      where: {
        matchDate: {
          gte: startDate,
          lt: endDate
        }
      }
    })

    if (schedules.length === 0) {
      console.log('12월 20일 일정을 찾을 수 없습니다.')
      return
    }

    console.log(`찾은 일정: ${schedules.length}개`)
    schedules.forEach(schedule => {
      console.log(`- ${schedule.title} (ID: ${schedule.id}, 날짜: ${schedule.matchDate.toISOString()})`)
    })

    // 모든 활성 사용자 가져오기
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        realName: true,
        nickname: true
      }
    })

    console.log(`\n활성 사용자: ${users.length}명`)

    // 각 일정에 대해 모든 사용자를 참석으로 추가
    for (const schedule of schedules) {
      console.log(`\n[${schedule.title}] 일정에 사용자 추가 중...`)
      
      let addedCount = 0
      let updatedCount = 0

      for (const user of users) {
        // 기존 참석 기록 확인
        const existing = await prisma.scheduleAttendance.findUnique({
          where: {
            scheduleId_userId: {
              scheduleId: schedule.id,
              userId: user.id
            }
          }
        })

        if (existing) {
          // 기존 기록이 있으면 참석으로 업데이트
          await prisma.scheduleAttendance.update({
            where: {
              id: existing.id
            },
            data: {
              status: 'ATTENDING'
            }
          })
          updatedCount++
        } else {
          // 새 참석 기록 생성
          await prisma.scheduleAttendance.create({
            data: {
              scheduleId: schedule.id,
              userId: user.id,
              status: 'ATTENDING'
            }
          })
          addedCount++
        }
      }

      console.log(`  ✓ 추가: ${addedCount}명, 업데이트: ${updatedCount}명`)
    }

    console.log('\n✅ 모든 사용자가 참석으로 추가되었습니다.')

  } catch (error) {
    console.error('오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addAllUsersToSchedule()

