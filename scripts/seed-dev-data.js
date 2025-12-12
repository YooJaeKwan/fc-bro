// Development 환경 테스트 데이터 생성 스크립트
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 테스트 사용자 데이터
const testUsers = [
  {
    email: 'admin@test.com',
    name: '관리자',
    provider: 'kakao',
    providerId: 'test_admin_001',
    kakaoId: 'test_admin_001',
    nickname: '총무',
    realName: '김총무',
    phoneNumber: '010-1234-5678',
    region: '서울',
    city: '강남구',
    birthYear: '1990',
    preferredFoot: 'right',
    jerseyNumber: 1,
    mainPosition: 'GK',
    preferredPosition: 'GK',
    subPositions: [],
    role: 'ADMIN',
    level: 8,
    isActive: true
  },
  {
    email: 'player1@test.com',
    name: '선수1',
    provider: 'kakao',
    providerId: 'test_player_001',
    kakaoId: 'test_player_001',
    nickname: '공격수',
    realName: '박공격',
    phoneNumber: '010-1111-2222',
    region: '서울',
    city: '강남구',
    birthYear: '1992',
    preferredFoot: 'right',
    jerseyNumber: 7,
    mainPosition: '공격수',
    preferredPosition: 'ST',
    subPositions: ['CF', 'SS'],
    role: 'MEMBER',
    level: 7,
    isActive: true
  },
  {
    email: 'player2@test.com',
    name: '선수2',
    provider: 'kakao',
    providerId: 'test_player_002',
    kakaoId: 'test_player_002',
    nickname: '미드필더',
    realName: '이미드',
    phoneNumber: '010-2222-3333',
    region: '서울',
    city: '서초구',
    birthYear: '1993',
    preferredFoot: 'left',
    jerseyNumber: 10,
    mainPosition: '미드필더',
    preferredPosition: 'MC',
    subPositions: ['AMC', 'DM'],
    role: 'MEMBER',
    level: 7,
    isActive: true
  },
  {
    email: 'player3@test.com',
    name: '선수3',
    provider: 'kakao',
    providerId: 'test_player_003',
    kakaoId: 'test_player_003',
    nickname: '수비수',
    realName: '최수비',
    phoneNumber: '010-3333-4444',
    region: '서울',
    city: '송파구',
    birthYear: '1991',
    preferredFoot: 'right',
    jerseyNumber: 4,
    mainPosition: '수비수',
    preferredPosition: 'DC',
    subPositions: ['DR', 'DL'],
    role: 'MEMBER',
    level: 6,
    isActive: true
  },
  {
    email: 'player4@test.com',
    name: '선수4',
    provider: 'kakao',
    providerId: 'test_player_004',
    kakaoId: 'test_player_004',
    nickname: '윙어',
    realName: '정윙어',
    phoneNumber: '010-4444-5555',
    region: '경기',
    city: '성남시',
    birthYear: '1994',
    preferredFoot: 'left',
    jerseyNumber: 11,
    mainPosition: '공격수',
    preferredPosition: 'LWF',
    subPositions: ['RWF', 'ST'],
    role: 'MEMBER',
    level: 6,
    isActive: true
  }
]

async function seedDevData() {
  try {
    console.log('🔄 Development 테스트 데이터 생성 시작...\n')

    // 1. 기존 데이터 확인
    const existingUsers = await prisma.user.count()
    const existingSchedules = await prisma.schedule.count()

    if (existingUsers > 0 || existingSchedules > 0) {
      console.log('⚠️  기존 데이터가 있습니다.')
      console.log(`   - 사용자: ${existingUsers}명`)
      console.log(`   - 일정: ${existingSchedules}개`)
      console.log('   기존 데이터를 삭제하고 새로 생성하시겠습니까? (y/n)')
      console.log('   자동으로 진행하려면 --force 플래그를 사용하세요.\n')
      
      const force = process.argv.includes('--force')
      if (!force) {
        console.log('❌ 중단되었습니다. --force 플래그를 사용하여 강제 실행하세요.')
        return
      }
    }

    // 2. 트랜잭션으로 데이터 생성
    await prisma.$transaction(async (tx) => {
      // 2-1. 기존 데이터 삭제 (선택사항)
      if (process.argv.includes('--force')) {
        console.log('🗑️  기존 데이터 삭제 중...')
        await tx.schedulePlayerStat.deleteMany({})
        await tx.scheduleAttendance.deleteMany({})
        await tx.schedule.deleteMany({})
        await tx.user.deleteMany({})
        console.log('   ✅ 기존 데이터 삭제 완료\n')
      }

      // 2-2. 테스트 사용자 생성
      console.log('1️⃣ 테스트 사용자 생성 중...')
      const createdUsers = []
      for (const userData of testUsers) {
        const user = await tx.user.create({
          data: userData
        })
        createdUsers.push(user)
        console.log(`   ✅ ${user.realName || user.nickname} 생성 완료`)
      }
      console.log(`   ✅ 총 ${createdUsers.length}명의 사용자 생성 완료\n`)

      // 2-3. 테스트 일정 생성
      console.log('2️⃣ 테스트 일정 생성 중...')
      const adminUser = createdUsers.find(u => u.role === 'ADMIN')
      
      if (!adminUser) {
        throw new Error('관리자 사용자를 찾을 수 없습니다.')
      }

      // 오늘부터 7일 후까지의 일정 생성
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const schedules = [
        {
          title: '정기 자체경기\n19:00',
          type: 'internal',
          matchDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3일 후
          startTime: '19:00',
          gatherTime: '18:40',
          location: '강남 풋살장',
          quarterTime: 25,
          restTime: 5,
          description: '정기 자체경기입니다. 많은 참석 부탁드립니다.',
          status: 'SCHEDULED',
          allowGuests: true,
          createdBy: adminUser.id
        },
        {
          title: 'A매치\n20:00',
          type: 'match',
          matchDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          startTime: '20:00',
          gatherTime: '19:40',
          location: '올림픽공원 풋살장',
          quarterTime: 25,
          restTime: 5,
          description: 'A매치입니다.',
          opponentTeam: 'FC 서울',
          status: 'SCHEDULED',
          allowGuests: false,
          createdBy: adminUser.id
        },
        {
          title: '연습\n18:00',
          type: 'training',
          matchDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10일 후
          startTime: '18:00',
          gatherTime: '17:40',
          location: '서초 풋살장',
          quarterTime: 20,
          restTime: 5,
          description: '기술 연습 및 전술 연습',
          trainingContent: '패스 연습, 세트피스 연습',
          status: 'SCHEDULED',
          allowGuests: false,
          createdBy: adminUser.id
        }
      ]

      const createdSchedules = []
      for (const scheduleData of schedules) {
        const schedule = await tx.schedule.create({
          data: scheduleData
        })
        createdSchedules.push(schedule)
        console.log(`   ✅ ${schedule.title.split('\n')[0]} 생성 완료`)
      }
      console.log(`   ✅ 총 ${createdSchedules.length}개의 일정 생성 완료\n`)

      // 2-4. 테스트 참석 데이터 생성
      console.log('3️⃣ 테스트 참석 데이터 생성 중...')
      const firstSchedule = createdSchedules[0]
      const memberUsers = createdUsers.filter(u => u.role === 'MEMBER')

      for (let i = 0; i < Math.min(memberUsers.length, 4); i++) {
        const user = memberUsers[i]
        const status = i < 3 ? 'ATTENDING' : 'PENDING' // 3명은 참석, 1명은 미정
        
        await tx.scheduleAttendance.create({
          data: {
            scheduleId: firstSchedule.id,
            userId: user.id,
            status: status
          }
        })
        console.log(`   ✅ ${user.realName || user.nickname}: ${status === 'ATTENDING' ? '참석' : '미정'}`)
      }
      console.log(`   ✅ 참석 데이터 생성 완료\n`)
    })

    console.log('✅ Development 테스트 데이터 생성 완료!')
    console.log('\n📋 생성된 데이터:')
    console.log(`   - 사용자: ${testUsers.length}명 (관리자 1명, 선수 4명)`)
    console.log(`   - 일정: 3개 (자체경기, A매치, 연습)`)
    console.log(`   - 참석 기록: 4개`)
    console.log('\n🔑 테스트 계정:')
    console.log('   관리자: admin@test.com (카카오 ID: test_admin_001)')
    console.log('   선수1: player1@test.com (카카오 ID: test_player_001)')
    console.log('   선수2: player2@test.com (카카오 ID: test_player_002)')

  } catch (error) {
    console.error('❌ 데이터 생성 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
seedDevData()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })

