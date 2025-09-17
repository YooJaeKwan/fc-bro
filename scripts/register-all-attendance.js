const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function registerAllAttendance() {
  try {
    console.log('📋 현재 일정과 사용자 정보를 확인하는 중...')

    // 모든 사용자 조회
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        realName: true,
        nickname: true,
        preferredPosition: true
      }
    })

    console.log(`👥 총 ${allUsers.length}명의 사용자를 발견했습니다.`)

    // 모든 일정 조회 (예정된 일정만)
    const schedules = await prisma.schedule.findMany({
      where: {
        status: 'SCHEDULED'
      },
      select: {
        id: true,
        title: true,
        matchDate: true,
        startTime: true,
        location: true
      },
      orderBy: {
        matchDate: 'asc'
      }
    })

    console.log(`📅 총 ${schedules.length}개의 예정된 일정을 발견했습니다.`)

    if (schedules.length === 0) {
      console.log('❌ 예정된 일정이 없습니다. 먼저 일정을 생성해주세요.')
      return
    }

    if (allUsers.length === 0) {
      console.log('❌ 등록된 사용자가 없습니다.')
      return
    }

    let totalRegistrations = 0

    // 각 일정에 모든 사용자 참석 등록
    for (const schedule of schedules) {
      console.log(`\n🎯 일정: ${schedule.title || `${schedule.location} ${schedule.startTime}`}`)
      
      for (const user of allUsers) {
        try {
          // 기존 참석 정보 확인
          const existingAttendance = await prisma.scheduleAttendance.findUnique({
            where: {
              scheduleId_userId: {
                scheduleId: schedule.id,
                userId: user.id
              }
            }
          })

          if (existingAttendance) {
            // 기존 참석 정보가 있으면 참석으로 업데이트
            await prisma.scheduleAttendance.update({
              where: {
                id: existingAttendance.id
              },
              data: {
                status: 'ATTENDING',
                updatedAt: new Date()
              }
            })
            console.log(`  ✅ ${user.realName || user.nickname} - 참석으로 업데이트`)
          } else {
            // 새로운 참석 정보 생성
            await prisma.scheduleAttendance.create({
              data: {
                scheduleId: schedule.id,
                userId: user.id,
                status: 'ATTENDING'
              }
            })
            console.log(`  ➕ ${user.realName || user.nickname} - 참석으로 등록`)
          }
          
          totalRegistrations++
        } catch (error) {
          console.error(`  ❌ ${user.realName || user.nickname} 등록 실패:`, error.message)
        }
      }
    }

    console.log(`\n🎉 참석 등록 완료!`)
    console.log(`📊 총 ${totalRegistrations}건의 참석 정보가 등록/업데이트되었습니다.`)
    console.log(`👥 ${allUsers.length}명의 선수가 ${schedules.length}개 일정에 참석으로 등록되었습니다.`)

    // 결과 요약
    console.log('\n📋 등록된 일정 목록:')
    for (const schedule of schedules) {
      const attendanceCount = await prisma.scheduleAttendance.count({
        where: {
          scheduleId: schedule.id,
          status: 'ATTENDING'
        }
      })
      
      console.log(`  📅 ${schedule.title || `${schedule.location} ${schedule.startTime}`}: ${attendanceCount}명 참석`)
    }

  } catch (error) {
    console.error('❌ 참석 등록 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

registerAllAttendance()
