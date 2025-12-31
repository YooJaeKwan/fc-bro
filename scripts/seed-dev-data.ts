
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Start seeding...')

    // 1. Clean up existing data (optional, be careful in prod)
    // await prisma.scheduleAttendance.deleteMany()
    // await prisma.schedule.deleteMany()
    // await prisma.user.deleteMany()

    // 2. Create Users
    const usersData = [
        {
            name: '관리자',
            email: 'admin@fcbro.com',
            provider: 'credentials',
            providerId: 'admin_01',
            kakaoId: 'kakao_admin',
            nickname: '총무킴',
            realName: '김총무',
            role: Role.ADMIN,
            mainPosition: 'MF',
            preferredPosition: 'CAM',
            subPositions: ['CM', 'CDM'],
            level: 8,
            jerseyNumber: 10,
            phoneNumber: '010-1234-5678', // 관리자 폰번호
            region: '서울',
            city: '강남구',
            birthYear: '1995',
            preferredFoot: 'RIGHT'
        },
        {
            name: '골키퍼',
            email: 'gk@fcbro.com',
            provider: 'credentials',
            providerId: 'gk_01',
            kakaoId: 'kakao_gk',
            nickname: '거미손',
            realName: '이운재',
            role: Role.MEMBER,
            mainPosition: 'GK',
            preferredPosition: 'GK',
            subPositions: [],
            level: 9,
            jerseyNumber: 1,
            birthYear: '1990',
            phoneNumber: '010-1111-2222'
        },
        {
            name: '스트라이커',
            email: 'st@fcbro.com',
            provider: 'credentials',
            providerId: 'st_01',
            kakaoId: 'kakao_st',
            nickname: '소니',
            realName: '손흥민',
            role: Role.MEMBER,
            mainPosition: 'FW',
            preferredPosition: 'ST',
            subPositions: ['LWF', 'RWF'],
            level: 10,
            jerseyNumber: 7,
            birthYear: '1992',
            phoneNumber: '010-7777-7777'
        },
        {
            name: '수비수1',
            email: 'df1@fcbro.com',
            provider: 'credentials',
            providerId: 'df_01',
            kakaoId: 'kakao_df1',
            nickname: '통곡의벽',
            realName: '김민재',
            role: Role.MEMBER,
            mainPosition: 'DF',
            preferredPosition: 'CB',
            subPositions: ['CDM'],
            level: 10,
            jerseyNumber: 4,
            birthYear: '1996',
            phoneNumber: '010-4444-4444'
        },
        {
            name: '미드필더1',
            email: 'mf1@fcbro.com',
            provider: 'credentials',
            providerId: 'mf_01',
            kakaoId: 'kakao_mf1',
            nickname: '해버지',
            realName: '박지성',
            role: Role.MEMBER,
            mainPosition: 'MF',
            preferredPosition: 'CM',
            subPositions: ['RM', 'LM'],
            level: 9,
            jerseyNumber: 13,
            birthYear: '1981',
            phoneNumber: '010-1313-1313'
        },
        {
            name: '윙어1',
            email: 'wf1@fcbro.com',
            provider: 'credentials',
            providerId: 'wf_01',
            kakaoId: 'kakao_wf1',
            nickname: '황소',
            realName: '황희찬',
            role: Role.MEMBER,
            mainPosition: 'FW',
            preferredPosition: 'RWF',
            subPositions: ['ST'],
            level: 8,
            jerseyNumber: 11,
            birthYear: '1996',
            phoneNumber: '010-1111-9999'
        },
        {
            name: '풀백1',
            email: 'fb1@fcbro.com',
            provider: 'credentials',
            providerId: 'fb_01',
            kakaoId: 'kakao_fb1',
            nickname: '철룡',
            realName: '이영표',
            role: Role.MEMBER,
            mainPosition: 'DF',
            preferredPosition: 'LB',
            subPositions: ['LWB'],
            level: 8,
            jerseyNumber: 12,
            birthYear: '1977',
            phoneNumber: '010-1212-1212'
        },
        {
            name: '신입회원',
            email: 'new@fcbro.com',
            provider: 'credentials',
            providerId: 'new_01',
            kakaoId: 'kakao_new',
            nickname: '축구새싹',
            realName: '박신입',
            role: Role.MEMBER,
            mainPosition: 'MF',
            preferredPosition: 'RM',
            subPositions: [],
            level: 3,
            jerseyNumber: 99,
            birthYear: '2000',
            phoneNumber: '010-9999-9999'
        }
    ]

    // Generate more users to reach 40
    const currentCount = usersData.length
    const targetCount = 40
    const positions = ['FW', 'MF', 'DF', 'GK']
    const detailedPositions = ['ST', 'CF', 'LWF', 'RWF', 'CAM', 'CM', 'CDM', 'LM', 'RM', 'CB', 'LB', 'RB', 'GK']

    for (let i = 0; i < targetCount - currentCount; i++) {
        const num = i + 1 + currentCount
        const mainPos = positions[Math.floor(Math.random() * positions.length)]
        const detailPos = detailedPositions[Math.floor(Math.random() * detailedPositions.length)]

        usersData.push({
            name: `회원${num}`,
            email: `member${num}@fcbro.com`,
            provider: 'credentials',
            providerId: `member_${num}`,
            kakaoId: `kakao_member_${num}`,
            nickname: `선수${num}`,
            realName: `테스트회원${num}`,
            role: Role.MEMBER,
            mainPosition: mainPos,
            preferredPosition: detailPos,
            subPositions: [],
            level: Math.floor(Math.random() * 5) + 3, // 3~7 level
            jerseyNumber: num * 2,
            birthYear: String(1980 + Math.floor(Math.random() * 20)), // 1980-1999
            phoneNumber: `010-0000-${String(num).padStart(4, '0')}`
        })
    }

    const createdUsers = []
    for (const userData of usersData) {
        // Upsert to avoid errors if running multiple times
        const user = await prisma.user.upsert({
            where: { kakaoId: userData.kakaoId },
            update: {},
            create: userData,
        })
        createdUsers.push(user)
        console.log(`User created: ${user.realName} (${user.role})`)
    }

    const adminUser = createdUsers.find(u => u.role === Role.ADMIN)
    if (!adminUser) throw new Error('Admin user not found')

    // 3. Create Schedules
    const today = new Date()

    // Past Internal Match (7 days ago) - Results can be entered
    const pastInternalDate = new Date(today)
    pastInternalDate.setDate(today.getDate() - 7)
    pastInternalDate.setHours(19, 0, 0, 0)

    // Past Match (3 days ago) - Already has results
    const pastMatchDate = new Date(today)
    pastMatchDate.setDate(today.getDate() - 3)
    pastMatchDate.setHours(14, 0, 0, 0)

    // Upcoming Match (3 days later)
    const upcomingMatchDate = new Date(today)
    upcomingMatchDate.setDate(today.getDate() + 3)
    upcomingMatchDate.setHours(18, 0, 0, 0)

    // Upcoming Internal (7 days later)
    const upcomingInternalDate = new Date(today)
    upcomingInternalDate.setDate(today.getDate() + 7)
    upcomingInternalDate.setHours(20, 0, 0, 0)

    const schedulesData = [
        {
            title: '지난 자체전',
            type: 'internal',
            matchDate: pastInternalDate,
            startTime: '19:00',
            gatherTime: '18:40',
            location: '잠실 보조경기장',
            description: '즐겁게 찼던 지난 경기',
            status: 'SCHEDULED',
            createdBy: adminUser.id
        },
        {
            title: 'vs FC서울 (친선)',
            type: 'match',
            matchDate: pastMatchDate,
            startTime: '14:00',
            gatherTime: '13:00',
            location: '서울월드컵경기장',
            description: '빡센 상대였다',
            opponentTeam: 'FC서울',
            status: 'COMPLETED',
            ourScore: 2,
            opponentScore: 3,
            mvpUserId: createdUsers[2].id, // Son
            matchSummary: '잘 싸웠지만 아쉽게 패배. 다음엔 이기자!',
            createdBy: adminUser.id
        },
        {
            title: 'vs 맨체스터 유나이티드',
            type: 'match',
            matchDate: upcomingMatchDate,
            startTime: '18:00',
            gatherTime: '17:00',
            location: '올드 트래포드',
            description: '꿈의 구장 원정 경기',
            opponentTeam: 'Man Utd',
            status: 'SCHEDULED',
            createdBy: adminUser.id
        },
        {
            title: '정기 자체전',
            type: 'internal',
            matchDate: upcomingInternalDate,
            startTime: '20:00',
            gatherTime: '19:40',
            location: '반포 종합운동장',
            description: '참석 필참입니다!',
            status: 'SCHEDULED',
            createdBy: adminUser.id
        }
    ]

    // Generate schedules for December (past matches with results)
    for (let i = 1; i <= 15; i++) {
        const date = new Date(2024, 11, i * 1.4) // December 2024, spread across the month
        date.setHours(19, 0, 0, 0)

        const isMatch = Math.random() > 0.5
        const schedule: any = {
            title: isMatch ? `vs 상대팀${i}` : `정기 연습경기 ${i}`,
            type: isMatch ? 'match' : 'internal',
            matchDate: date,
            startTime: '19:00',
            gatherTime: '18:30',
            location: isMatch ? '원정 경기장' : '홈 구장',
            description: `지난 일정 데이터 ${i}`,
            status: 'COMPLETED',
            createdBy: adminUser.id
        }

        if (isMatch) {
            schedule.opponentTeam = `상대팀${i}`
            schedule.ourScore = Math.floor(Math.random() * 5)
            schedule.opponentScore = Math.floor(Math.random() * 5)
            schedule.mvpUserId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id
            schedule.matchSummary = '경기 결과 및 내용...'
        } else {
            // Internal match result logic (Yellow vs Blue scores)
            schedule.ourScore = Math.floor(Math.random() * 5) // Yellow
            schedule.opponentScore = Math.floor(Math.random() * 5) // Blue
            schedule.mvpUserId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id
            schedule.matchSummary = `좋은 경기였습니다. ${i}번째 내부전!`

            // Add team formation for internal matches
            const attendingCount = Math.floor(Math.random() * 10) + 20 // 20-30명
            const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5).slice(0, attendingCount)

            const halfSize = Math.floor(shuffledUsers.length / 2)
            const yellowTeam = shuffledUsers.slice(0, halfSize).map((user: any) => ({
                userId: user.id,
                name: user.realName || user.nickname,
                position: user.preferredPosition || 'MC',
                displayPosition: user.preferredPosition || 'MC',
                level: user.level || 5,
                rating: Math.random() * 2 + 6
            }))

            const blueTeam = shuffledUsers.slice(halfSize).map((user: any) => ({
                userId: user.id,
                name: user.realName || user.nickname,
                position: user.preferredPosition || 'MC',
                displayPosition: user.preferredPosition || 'MC',
                level: user.level || 5,
                rating: Math.random() * 2 + 6
            }))

            schedule.teamFormation = {
                yellowTeam,
                blueTeam,
                stats: {
                    yellow: {
                        count: yellowTeam.length,
                        averageScore: (yellowTeam.reduce((sum: number, p: any) => sum + p.level, 0) / yellowTeam.length).toFixed(1)
                    },
                    blue: {
                        count: blueTeam.length,
                        averageScore: (blueTeam.reduce((sum: number, p: any) => sum + p.level, 0) / blueTeam.length).toFixed(1)
                    }
                }
            }
            schedule.formationDate = new Date(date.getTime() - 24 * 60 * 60 * 1000)
        }

        schedulesData.push(schedule)
    }

    for (const scheduleData of schedulesData) {
        const { createdBy, ...data } = scheduleData
        const schedule = await prisma.schedule.create({
            data: {
                ...data,
                creator: { connect: { id: createdBy } }
            }
        })
        console.log(`Schedule created: ${schedule.title}`)

        // 4. Add Attendances (Vote)
        // High attendance rate for testing
        for (const user of createdUsers) {
            // High probability of attending (90%) for past/future schedules to populate lists
            const rand = Math.random()
            let status = 'ATTENDING'

            // 10% chance of not attending
            if (rand > 0.9) status = 'NOT_ATTENDING'

            // For upcoming schedules, maybe a few pending? let's keep it simple: Attending or Not

            await prisma.scheduleAttendance.create({
                data: {
                    scheduleId: schedule.id,
                    userId: user.id,
                    status: status
                }
            })
        }
    }
}

console.log('✅ Seeding completed!')


main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
