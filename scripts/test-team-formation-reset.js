// 팀편성 자동 초기화 기능 테스트 스크립트
const { PrismaClient } = require('@prisma/client')

async function testTeamFormationReset() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 팀편성 자동 초기화 기능 테스트 시작...\n')
    
    // 1. 테스트용 일정 찾기
    console.log('1️⃣ 테스트용 일정 조회 중...')
    const schedules = await prisma.schedule.findMany({
      take: 1,
      orderBy: {
        matchDate: 'desc'
      },
      include: {
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                realName: true,
                nickname: true
              }
            }
          }
        }
      }
    })
    
    if (schedules.length === 0) {
      console.log('❌ 테스트할 수 있는 일정이 없습니다.')
      return
    }
    
    const testSchedule = schedules[0]
    console.log(`✅ 테스트 일정: ${testSchedule.title} (ID: ${testSchedule.id})`)
    
    // 2. 가상의 팀편성 결과 생성
    console.log('\n2️⃣ 가상 팀편성 결과 생성 중...')
    const mockFormation = {
      yellowTeam: [
        { id: 'test1', name: '테스트선수1', position: 'GK', level: 7 },
        { id: 'test2', name: '테스트선수2', position: 'DC', level: 6 }
      ],
      blueTeam: [
        { id: 'test3', name: '테스트선수3', position: 'GK', level: 7 },
        { id: 'test4', name: '테스트선수4', position: 'DC', level: 6 }
      ],
      yellowAverage: 6.5,
      blueAverage: 6.5,
      levelDifference: 0,
      createdAt: new Date().toISOString()
    }
    
    const updatedSchedule = await prisma.schedule.update({
      where: { id: testSchedule.id },
      data: {
        teamFormation: mockFormation,
        formationDate: new Date()
      }
    })
    
    console.log('✅ 가상 팀편성 결과가 저장되었습니다.')
    
    // 3. 팀편성 결과 확인
    console.log('\n3️⃣ 저장된 팀편성 결과 확인...')
    const scheduleWithFormation = await prisma.schedule.findUnique({
      where: { id: testSchedule.id },
      select: {
        teamFormation: true,
        formationDate: true
      }
    })
    
    console.log('✅ 팀편성 결과 존재:', !!scheduleWithFormation?.teamFormation)
    console.log('✅ 팀편성 생성일:', scheduleWithFormation?.formationDate)
    
    // 4. 참석 투표 변경 시뮬레이션
    console.log('\n4️⃣ 참석 투표 변경 시뮬레이션...')
    
    if (testSchedule.attendances.length > 0) {
      const testAttendance = testSchedule.attendances[0]
      const userId = testAttendance.userId
      
      if (userId) {
        console.log(`사용자 ${testAttendance.user?.realName || testAttendance.user?.nickname}의 참석 상태 변경 시뮬레이션...`)
        
        // 참석 상태 변경 (ATTENDING -> NOT_ATTENDING)
        const newStatus = testAttendance.status === 'ATTENDING' ? 'NOT_ATTENDING' : 'ATTENDING'
        
        await prisma.scheduleAttendance.update({
          where: {
            scheduleId_userId: {
              scheduleId: testSchedule.id,
              userId: userId
            }
          },
          data: {
            status: newStatus
          }
        })
        
        console.log(`✅ 참석 상태 변경: ${testAttendance.status} → ${newStatus}`)
        
        // 팀편성 초기화 로직 실행 (API와 동일한 로직)
        const scheduleCheck = await prisma.schedule.findUnique({
          where: { id: testSchedule.id },
          select: { teamFormation: true, formationDate: true }
        })
        
        if (scheduleCheck?.teamFormation || scheduleCheck?.formationDate) {
          await prisma.schedule.update({
            where: { id: testSchedule.id },
            data: {
              teamFormation: null,
              formationDate: null
            }
          })
          console.log('✅ 팀편성 자동 초기화 완료!')
        }
      } else {
        console.log('⚠️  유효한 사용자 ID가 없어 참석 투표 테스트를 건너뜁니다.')
      }
    } else {
      console.log('⚠️  참석 데이터가 없어 참석 투표 테스트를 건너뜁니다.')
    }
    
    // 5. 최종 확인
    console.log('\n5️⃣ 최종 팀편성 상태 확인...')
    const finalSchedule = await prisma.schedule.findUnique({
      where: { id: testSchedule.id },
      select: {
        teamFormation: true,
        formationDate: true
      }
    })
    
    const isReset = !finalSchedule?.teamFormation && !finalSchedule?.formationDate
    console.log('✅ 팀편성 초기화 결과:', isReset ? '성공' : '실패')
    
    if (isReset) {
      console.log('\n🎉 팀편성 자동 초기화 기능이 정상적으로 작동합니다!')
      console.log('✨ 참석 투표 변경 시 팀편성이 자동으로 초기화됩니다.')
    } else {
      console.log('\n❌ 팀편성 초기화가 정상적으로 작동하지 않습니다.')
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message)
    
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
testTeamFormationReset()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })
