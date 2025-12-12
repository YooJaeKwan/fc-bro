// 데이터베이스 데이터를 JSON으로 export하는 스크립트
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('🔄 데이터 export 시작...\n')

    // 1. User 데이터 export
    console.log('1️⃣ User 데이터 export 중...')
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    })
    console.log(`   ✅ ${users.length}명의 사용자 데이터 export 완료`)

    // 2. Schedule 데이터 export
    console.log('2️⃣ Schedule 데이터 export 중...')
    const schedules = await prisma.schedule.findMany({
      include: {
        creator: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        }
      },
      orderBy: { matchDate: 'asc' }
    })
    console.log(`   ✅ ${schedules.length}개의 일정 데이터 export 완료`)

    // 3. ScheduleAttendance 데이터 export
    console.log('3️⃣ ScheduleAttendance 데이터 export 중...')
    const attendances = await prisma.scheduleAttendance.findMany({
      include: {
        user: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    console.log(`   ✅ ${attendances.length}개의 참석 데이터 export 완료`)

    // 4. SchedulePlayerStat 데이터 export
    console.log('4️⃣ SchedulePlayerStat 데이터 export 중...')
    const playerStats = await prisma.schedulePlayerStat.findMany({
      include: {
        user: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    console.log(`   ✅ ${playerStats.length}개의 선수 통계 데이터 export 완료`)

    // 5. 데이터를 JSON 형태로 변환
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        users: users.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        })),
        schedules: schedules.map(schedule => ({
          ...schedule,
          matchDate: schedule.matchDate.toISOString(),
          createdAt: schedule.createdAt.toISOString(),
          updatedAt: schedule.updatedAt.toISOString(),
          creator: schedule.creator
        })),
        attendances: attendances.map(attendance => ({
          ...attendance,
          createdAt: attendance.createdAt.toISOString(),
          updatedAt: attendance.updatedAt.toISOString(),
          user: attendance.user,
          invitedBy: attendance.invitedBy
        })),
        playerStats: playerStats.map(stat => ({
          ...stat,
          createdAt: stat.createdAt.toISOString(),
          updatedAt: stat.updatedAt.toISOString(),
          user: stat.user
        }))
      },
      summary: {
        totalUsers: users.length,
        totalSchedules: schedules.length,
        totalAttendances: attendances.length,
        totalPlayerStats: playerStats.length
      }
    }

    // 6. JSON 파일로 저장
    const exportDir = path.join(process.cwd(), 'data-exports')
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `export-${timestamp}.json`
    const filepath = path.join(exportDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8')

    console.log('\n✅ 데이터 export 완료!')
    console.log(`📁 파일 위치: ${filepath}`)
    console.log(`📊 요약:`)
    console.log(`   - 사용자: ${users.length}명`)
    console.log(`   - 일정: ${schedules.length}개`)
    console.log(`   - 참석 기록: ${attendances.length}개`)
    console.log(`   - 선수 통계: ${playerStats.length}개`)

  } catch (error) {
    console.error('❌ Export 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
exportData()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })

