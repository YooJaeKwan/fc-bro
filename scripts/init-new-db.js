// 새로운 데이터베이스 초기화 스크립트 (테이블이 없는 상태)
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function initNewDatabase() {
  try {
    console.log('🔄 새로운 데이터베이스 초기화 시작...\n')

    // 1. 환경 변수 확인
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.')
    }

    console.log('✅ DATABASE_URL 확인 완료')
    const dbInfo = dbUrl.split('@')[1]?.split('/')[0] || '확인 불가'
    console.log(`   데이터베이스: ${dbInfo}\n`)

    // 2. 데이터베이스 연결 테스트
    console.log('1️⃣ 데이터베이스 연결 테스트 중...')
    await prisma.$connect()
    console.log('   ✅ 데이터베이스 연결 성공!\n')

    // 3. Prisma Client 생성
    console.log('2️⃣ Prisma Client 생성 중...')
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
      console.log('   ✅ Prisma Client 생성 완료!\n')
    } catch (error) {
      console.log('   ⚠️  Prisma Client 생성 오류 (재시도 중...)')
      // 재시도
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
      console.log('   ✅ Prisma Client 생성 완료!\n')
    }

    // 4. 스키마 직접 적용 (테이블 생성)
    console.log('3️⃣ 데이터베이스 스키마 적용 중 (테이블 생성)...')
    console.log('   이 과정은 몇 분 걸릴 수 있습니다...\n')
    
    try {
      // 새로운 데이터베이스의 경우 db push가 더 간단함
      execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
      console.log('\n   ✅ 스키마 적용 완료! 모든 테이블이 생성되었습니다.\n')
    } catch (error) {
      console.log('\n   ⚠️  db push 실패, 마이그레이션으로 시도 중...')
      try {
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          env: { ...process.env }
        })
        console.log('\n   ✅ 마이그레이션 완료! 모든 테이블이 생성되었습니다.\n')
      } catch (error2) {
        console.log('\n   ❌ 스키마 적용 실패')
        throw error2
      }
    }

    // 5. 테이블 확인
    console.log('4️⃣ 테이블 확인 중...')
    const userCount = await prisma.user.count()
    const scheduleCount = await prisma.schedule.count()
    const attendanceCount = await prisma.scheduleAttendance.count()
    const statCount = await prisma.schedulePlayerStat.count()

    console.log('   ✅ 테이블 확인 완료:')
    console.log(`      - User: ${userCount}개 레코드`)
    console.log(`      - Schedule: ${scheduleCount}개 레코드`)
    console.log(`      - ScheduleAttendance: ${attendanceCount}개 레코드`)
    console.log(`      - SchedulePlayerStat: ${statCount}개 레코드\n`)

    console.log('✅ 데이터베이스 초기화 완료!')
    console.log('\n📋 다음 단계:')
    console.log('   테스트 데이터 생성: npm run seed:dev -- --force')
    console.log('   또는: node scripts/seed-dev-data.js --force')
    console.log('   Prisma Studio 실행: npx prisma studio')

  } catch (error) {
    console.error('\n❌ 초기화 중 오류 발생:', error.message)
    console.error('\n📋 문제 해결:')
    console.error('   1. DATABASE_URL이 올바른지 확인')
    console.error('   2. 데이터베이스 서버가 실행 중인지 확인')
    console.error('   3. 네트워크 연결 확인')
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
initNewDatabase()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })

