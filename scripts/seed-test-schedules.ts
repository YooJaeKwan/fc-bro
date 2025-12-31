import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestSchedules() {
    try {
        console.log('🌱 테스트 데이터 생성 시작...')

        // 현재 날짜 기준
        const now = new Date('2025-12-31T02:36:04+09:00')
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // 모든 사용자 조회 (최대 30명)
        const users = await prisma.user.findMany({
            where: {
                isActive: true
            },
            take: 30,
            select: {
                id: true,
                realName: true,
                nickname: true
            }
        })

        if (users.length === 0) {
            console.log('❌ 사용자가 없습니다. 먼저 사용자를 생성해주세요.')
            return
        }

        console.log(`✅ ${users.length}명의 사용자를 찾았습니다.`)

        // 첫 번째 사용자를 생성자로 사용
        const creatorId = users[0].id

        // 어제 일정 생성
        console.log('\n📅 어제 일정 생성 중...')
        const yesterdaySchedule = await prisma.schedule.create({
            data: {
                title: '테스트 자체경기 (어제)',
                type: 'internal',
                matchDate: yesterday,
                startTime: '19:00',
                gatherTime: '18:30',
                location: '테스트 풋살장',
                description: '테스트용 어제 일정입니다.',
                createdBy: creatorId,
                allowGuests: true,
                quarterTime: 25,
                restTime: 5,
                status: 'SCHEDULED'
            }
        })
        console.log(`✅ 어제 일정 생성 완료: ${yesterdaySchedule.id}`)

        // 내일 일정 생성
        console.log('\n📅 내일 일정 생성 중...')
        const tomorrowSchedule = await prisma.schedule.create({
            data: {
                title: '테스트 자체경기 (내일)',
                type: 'internal',
                matchDate: tomorrow,
                startTime: '19:00',
                gatherTime: '18:30',
                location: '테스트 풋살장',
                description: '테스트용 내일 일정입니다.',
                createdBy: creatorId,
                allowGuests: true,
                quarterTime: 25,
                restTime: 5,
                status: 'SCHEDULED'
            }
        })
        console.log(`✅ 내일 일정 생성 완료: ${tomorrowSchedule.id}`)

        // 각 일정에 모든 사용자 참석 투표 추가
        console.log('\n👥 참석 투표 생성 중...')

        for (const user of users) {
            // 어제 일정 참석 투표
            await prisma.scheduleAttendance.create({
                data: {
                    scheduleId: yesterdaySchedule.id,
                    userId: user.id,
                    status: 'ATTENDING'
                }
            })

            // 내일 일정 참석 투표
            await prisma.scheduleAttendance.create({
                data: {
                    scheduleId: tomorrowSchedule.id,
                    userId: user.id,
                    status: 'ATTENDING'
                }
            })
        }

        console.log(`✅ ${users.length}명의 참석 투표 생성 완료 (각 일정당)`)

        console.log('\n🎉 테스트 데이터 생성 완료!')
        console.log(`
📊 생성된 데이터:
- 어제 일정: ${yesterday.toLocaleDateString('ko-KR')} ${yesterdaySchedule.startTime}
- 내일 일정: ${tomorrow.toLocaleDateString('ko-KR')} ${tomorrowSchedule.startTime}
- 참석자 수: ${users.length}명 (각 일정)
    `)

    } catch (error) {
        console.error('❌ 에러 발생:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

createTestSchedules()
    .catch((error) => {
        console.error('❌ 실행 중 에러:', error)
        process.exit(1)
    })
