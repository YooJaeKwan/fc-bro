// NeonDB 연결 테스트 스크립트
const { PrismaClient } = require('@prisma/client')

async function testDatabaseConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 NeonDB 연결 테스트 시작...\n')
    
    // 1. 데이터베이스 연결 테스트
    console.log('1️⃣ 데이터베이스 연결 확인 중...')
    await prisma.$connect()
    console.log('✅ 데이터베이스 연결 성공!\n')
    
    // 2. 간단한 쿼리 테스트
    console.log('2️⃣ 테이블 존재 여부 확인 중...')
    
    // User 테이블 카운트
    const userCount = await prisma.user.count()
    console.log(`✅ User 테이블: ${userCount}개 레코드`)
    
    // Team 테이블 카운트
    const teamCount = await prisma.team.count()
    console.log(`✅ Team 테이블: ${teamCount}개 레코드`)
    
    // Schedule 테이블 카운트  
    const scheduleCount = await prisma.schedule.count()
    console.log(`✅ Schedule 테이블: ${scheduleCount}개 레코드\n`)
    
    // 3. 샘플 사용자가 있는지 확인
    console.log('3️⃣ 샘플 데이터 확인 중...')
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true
      }
    })
    
    if (sampleUsers.length > 0) {
      console.log('✅ 샘플 사용자 데이터:')
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.nickname || '이름없음'} (${user.role}) - ${user.createdAt.toLocaleDateString()}`)
      })
    } else {
      console.log('⚠️  사용자 데이터가 없습니다.')
    }
    
    console.log('\n🎉 NeonDB 연결 테스트 완료!')
    console.log('데이터베이스가 정상적으로 작동하고 있습니다.')
    
  } catch (error) {
    console.error('❌ NeonDB 연결 테스트 실패:')
    
    if (error.code === 'P1001') {
      console.error('🔴 데이터베이스 서버에 연결할 수 없습니다.')
      console.error('   - DATABASE_URL이 올바르게 설정되었는지 확인해주세요.')
      console.error('   - NeonDB 인스턴스가 활성화되어 있는지 확인해주세요.')
    } else if (error.code === 'P1017') {
      console.error('🔴 데이터베이스 서버가 닫혔습니다.')
      console.error('   - NeonDB 콘솔에서 프로젝트 상태를 확인해주세요.')
    } else if (error.message.includes('Environment variable not found')) {
      console.error('🔴 환경 변수가 설정되지 않았습니다.')
      console.error('   - .env.local 파일에 DATABASE_URL을 설정해주세요.')
    } else {
      console.error('🔴 예상치 못한 오류:', error.message)
    }
    
    console.error('\n📋 체크리스트:')
    console.error('   □ .env.local 파일이 생성되었는가?')
    console.error('   □ DATABASE_URL이 올바르게 설정되었는가?')
    console.error('   □ NeonDB 프로젝트가 활성화되어 있는가?')
    console.error('   □ 데이터베이스 마이그레이션이 완료되었는가?')
    
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
testDatabaseConnection()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })

