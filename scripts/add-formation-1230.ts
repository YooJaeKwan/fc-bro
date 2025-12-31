import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTeamFormation() {
    try {
        console.log('🔍 12월 30일 일정 찾는 중...')

        // 12월 30일 일정 찾기
        const targetDate = new Date('2025-12-30')

        const schedule = await prisma.schedule.findFirst({
            where: {
                matchDate: {
                    gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                    lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
                }
            },
            include: {
                attendances: {
                    where: {
                        status: 'ATTENDING'
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                realName: true,
                                nickname: true,
                                preferredPosition: true,
                                level: true
                            }
                        }
                    }
                }
            }
        })

        if (!schedule) {
            console.log('❌ 12월 30일 일정을 찾을 수 없습니다.')
            return
        }

        console.log(`✅ 일정 발견: ${schedule.title} (ID: ${schedule.id})`)
        console.log(`   참석자 수: ${schedule.attendances.length}명`)

        // 참석자를 Yellow팀과 Blue팀으로 나누기
        const attendingPlayers = schedule.attendances.map((att, idx) => {
            if (att.isGuest) {
                return {
                    userId: att.guestId || att.id,
                    name: att.guestName || '게스트',
                    position: att.guestPosition || 'MC',
                    level: att.guestLevel || 4,
                    isGuest: true
                }
            } else {
                const user = att.user
                return {
                    userId: user!.id,
                    name: user!.realName || user!.nickname || '이름 없음',
                    position: user!.preferredPosition || 'MC',
                    level: user!.level || 1,
                    isGuest: false
                }
            }
        })

        // 참석자를 두 팀으로 균등하게 분배
        const halfSize = Math.ceil(attendingPlayers.length / 2)
        const yellowTeam = attendingPlayers.slice(0, halfSize).map(p => ({
            userId: p.userId,
            name: p.name,
            position: p.position,
            displayPosition: p.position,
            level: p.level,
            isGuest: p.isGuest
        }))

        const blueTeam = attendingPlayers.slice(halfSize).map(p => ({
            userId: p.userId,
            name: p.name,
            position: p.position,
            displayPosition: p.position,
            level: p.level,
            isGuest: p.isGuest
        }))

        const teamFormation = {
            yellowTeam,
            blueTeam,
            stats: {
                yellowTeam: {
                    avgLevel: yellowTeam.reduce((sum, p) => sum + (p.level || 1), 0) / yellowTeam.length,
                    totalPlayers: yellowTeam.length
                },
                blueTeam: {
                    avgLevel: blueTeam.reduce((sum, p) => sum + (p.level || 1), 0) / blueTeam.length,
                    totalPlayers: blueTeam.length
                }
            }
        }

        // 팀편성 저장 및 확정
        await prisma.schedule.update({
            where: { id: schedule.id },
            data: {
                teamFormation: teamFormation as any,
                formationDate: new Date(),
                formationConfirmed: true
            }
        })

        console.log('\n✅ 팀편성 생성 및 확정 완료!')
        console.log(`
📊 팀편성 결과:
- Yellow팀: ${yellowTeam.length}명 (평균 레벨: ${teamFormation.stats.yellowTeam.avgLevel.toFixed(1)})
- Blue팀: ${blueTeam.length}명 (평균 레벨: ${teamFormation.stats.blueTeam.avgLevel.toFixed(1)})
- 확정 상태: ✅ 확정됨
    `)

        console.log('\n👥 팀 구성:')
        console.log('Yellow팀:', yellowTeam.map(p => p.name).join(', '))
        console.log('Blue팀:', blueTeam.map(p => p.name).join(', '))

    } catch (error) {
        console.error('❌ 에러 발생:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

addTeamFormation()
    .catch((error) => {
        console.error('❌ 실행 중 에러:', error)
        process.exit(1)
    })
