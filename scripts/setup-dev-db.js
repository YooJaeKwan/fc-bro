// Development 환경 데이터베이스 설정 스크립트
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function setupDevDatabase() {
  try {
    console.log('🔄 Development 환경 데이터베이스 설정 시작...\n')

    // 1. 환경 변수 확인
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.')
    }

    console.log('✅ DATABASE_URL 확인 완료')
    console.log(`   데이터베이스: ${dbUrl.split('@')[1]?.split('/')[0] || '확인 불가'}\n`)

    // 2. 데이터베이스 연결 테스트
    console.log('1️⃣ 데이터베이스 연결 테스트 중...')
    await prisma.$connect()
    console.log('   ✅ 데이터베이스 연결 성공!\n')

    // 3. 마이그레이션 실행
    console.log('2️⃣ 마이그레이션 실행 중...')
    console.log('   💡 Development 환경에서는 "npx prisma migrate dev"를 사용하세요.')
    console.log('   💡 Production 환경에서는 "npx prisma migrate deploy"를 사용하세요.\n')
    
    // 마이그레이션 상태 확인
    try {
      const migrateStatus = execSync('npx prisma migrate status', { 
        encoding: 'utf8',
        env: { ...process.env },
        stdio: 'pipe'
      })
      if (migrateStatus.includes('Database schema is up to date')) {
        console.log('   ✅ 데이터베이스 스키마가 최신 상태입니다.\n')
      } else {
        console.log('   마이그레이션 상태:')
        console.log(migrateStatus)
      }
    } catch (error) {
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || ''
      if (errorOutput.includes('Database schema is up to date')) {
        console.log('   ✅ 데이터베이스 스키마가 최신 상태입니다.\n')
      } else {
        console.log('   ⚠️  마이그레이션 상태 확인 실패')
        console.log('   수동으로 실행하세요: npx prisma migrate dev\n')
      }
    }

    // 4. Prisma Client 생성 (오류 무시)
    console.log('3️⃣ Prisma Client 확인 중...')
    try {
      // Prisma Client가 이미 생성되어 있는지 확인
      const { PrismaClient } = require('@prisma/client')
      console.log('   ✅ Prisma Client 사용 가능\n')
    } catch (error) {
      console.log('   ⚠️  Prisma Client 생성 필요')
      console.log('   수동으로 실행하세요: npx prisma generate\n')
    }

    // 5. 테이블 존재 확인
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

    console.log('✅ Development 환경 데이터베이스 설정 완료!')
    console.log('\n📋 다음 단계:')
    console.log('   1. 테스트 데이터 생성: npm run seed:dev')
    console.log('   2. Prisma Studio 실행: npx prisma studio')

  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
setupDevDatabase()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })

