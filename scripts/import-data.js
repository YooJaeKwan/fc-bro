// JSON 파일에서 데이터베이스로 import하는 스크립트
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importData(filepath) {
  try {
    console.log('🔄 데이터 import 시작...\n')

    // 1. JSON 파일 읽기
    if (!fs.existsSync(filepath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filepath}`)
    }

    console.log(`📂 파일 읽기: ${filepath}`)
    const fileContent = fs.readFileSync(filepath, 'utf8')
    const importData = JSON.parse(fileContent)

    console.log(`📅 Export 날짜: ${importData.exportDate}`)
    console.log(`📊 데이터 요약:`)
    console.log(`   - 사용자: ${importData.summary.totalUsers}명`)
    console.log(`   - 일정: ${importData.summary.totalSchedules}개`)
    console.log(`   - 참석 기록: ${importData.summary.totalAttendances}개`)
    console.log(`   - 선수 통계: ${importData.summary.totalPlayerStats}개\n`)

    // 2. 확인 메시지
    console.log('⚠️  주의: 기존 데이터가 삭제될 수 있습니다.')
    console.log('   계속하려면 스크립트에 --confirm 플래그를 추가하세요.\n')

    // 3. 트랜잭션으로 데이터 import
    await prisma.$transaction(async (tx) => {
      // 3-1. 기존 데이터 삭제 (선택사항)
      console.log('🗑️  기존 데이터 삭제 중...')
      await tx.schedulePlayerStat.deleteMany({})
      await tx.scheduleAttendance.deleteMany({})
      await tx.schedule.deleteMany({})
      await tx.user.deleteMany({})
      console.log('   ✅ 기존 데이터 삭제 완료\n')

      // 3-2. User 데이터 import
      console.log('1️⃣ User 데이터 import 중...')
      for (const user of importData.data.users) {
        await tx.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            provider: user.provider,
            providerId: user.providerId,
            kakaoId: user.kakaoId,
            nickname: user.nickname,
            realName: user.realName,
            phoneNumber: user.phoneNumber,
            region: user.region,
            city: user.city,
            birthYear: user.birthYear,
            preferredFoot: user.preferredFoot,
            jerseyNumber: user.jerseyNumber,
            mainPosition: user.mainPosition,
            preferredPosition: user.preferredPosition,
            subPositions: user.subPositions,
            role: user.role,
            level: user.level,
            isActive: user.isActive,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        })
      }
      console.log(`   ✅ ${importData.data.users.length}명의 사용자 데이터 import 완료`)

      // 3-3. Schedule 데이터 import
      console.log('2️⃣ Schedule 데이터 import 중...')
      for (const schedule of importData.data.schedules) {
        await tx.schedule.create({
          data: {
            id: schedule.id,
            title: schedule.title,
            type: schedule.type,
            matchDate: new Date(schedule.matchDate),
            startTime: schedule.startTime,
            gatherTime: schedule.gatherTime,
            location: schedule.location,
            quarterTime: schedule.quarterTime,
            restTime: schedule.restTime,
            description: schedule.description,
            opponentTeam: schedule.opponentTeam,
            trainingContent: schedule.trainingContent,
            status: schedule.status,
            ourScore: schedule.ourScore,
            opponentScore: schedule.opponentScore,
            mvpUserId: schedule.mvpUserId,
            matchSummary: schedule.matchSummary,
            allowGuests: schedule.allowGuests,
            createdBy: schedule.createdBy,
            createdAt: new Date(schedule.createdAt),
            updatedAt: new Date(schedule.updatedAt)
          }
        })
      }
      console.log(`   ✅ ${importData.data.schedules.length}개의 일정 데이터 import 완료`)

      // 3-4. ScheduleAttendance 데이터 import
      console.log('3️⃣ ScheduleAttendance 데이터 import 중...')
      for (const attendance of importData.data.attendances) {
        await tx.scheduleAttendance.create({
          data: {
            id: attendance.id,
            scheduleId: attendance.scheduleId,
            userId: attendance.userId,
            status: attendance.status,
            isGuest: attendance.isGuest,
            guestName: attendance.guestName,
            guestLevel: attendance.guestLevel,
            guestPosition: attendance.guestPosition,
            guestId: attendance.guestId,
            invitedByUserId: attendance.invitedByUserId,
            createdAt: new Date(attendance.createdAt),
            updatedAt: new Date(attendance.updatedAt)
          }
        })
      }
      console.log(`   ✅ ${importData.data.attendances.length}개의 참석 데이터 import 완료`)

      // 3-5. SchedulePlayerStat 데이터 import
      console.log('4️⃣ SchedulePlayerStat 데이터 import 중...')
      for (const stat of importData.data.playerStats) {
        await tx.schedulePlayerStat.create({
          data: {
            id: stat.id,
            scheduleId: stat.scheduleId,
            userId: stat.userId,
            position: stat.position,
            goals: stat.goals,
            assists: stat.assists,
            yellowCard: stat.yellowCard,
            redCard: stat.redCard,
            rating: stat.rating,
            comment: stat.comment,
            createdAt: new Date(stat.createdAt),
            updatedAt: new Date(stat.updatedAt)
          }
        })
      }
      console.log(`   ✅ ${importData.data.playerStats.length}개의 선수 통계 데이터 import 완료`)
    })

    console.log('\n✅ 데이터 import 완료!')

  } catch (error) {
    console.error('❌ Import 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 명령줄 인자 처리
const args = process.argv.slice(2)
const filepath = args[0]

if (!filepath) {
  console.error('❌ 사용법: node scripts/import-data.js <파일경로>')
  console.error('   예: node scripts/import-data.js data-exports/export-2025-01-15.json')
  process.exit(1)
}

// 스크립트 실행
importData(filepath)
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })

