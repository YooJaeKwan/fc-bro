
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        // 1. 다음 일정 찾기
        const nextSchedule = await prisma.schedule.findFirst({
            where: {
                matchDate: {
                    gte: now
                }
            },
            orderBy: {
                matchDate: 'asc'
            }
        })

        if (!nextSchedule) {
            return NextResponse.json({ error: 'No upcoming schedule found' }, { status: 404 })
        }

        const createdUsers = []
        const positions = ['FW', 'MF', 'DF', 'GK']

        // 2. 20명 유저 생성 및 참석 처리
        for (let i = 1; i <= 20; i++) {
            const timestamp = Date.now()
            const position = positions[Math.floor(Math.random() * positions.length)]

            // 유저 생성
            // 기존 유저가 있을 수 있으므로 create 대신 upsert 사용하거나 try-catch
            // 여기서는 그냥 생성 시도하고 실패하면 continue (이미 있을 수 있음)
            try {
                const user = await prisma.user.create({
                    data: {
                        provider: 'test_seed',
                        providerId: `seed_${timestamp}_${i}`,
                        birthYear: '1990',
                        realName: `테스트선수${i}`,
                        nickname: `Test${i}`,
                        preferredPosition: position,
                        jerseyNumber: i + 50,
                        kakaoId: `test_kakao_${timestamp}_${i}`,
                    }
                })

                // 참석 처리
                await prisma.scheduleAttendance.create({
                    data: {
                        scheduleId: nextSchedule.id,
                        userId: user.id,
                        status: 'ATTENDING'
                    }
                })
                createdUsers.push(user.realName)
            } catch (e) {
                console.log('User creation skipped for index', i)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully added test attendees to schedule ${nextSchedule.title}`,
            users: createdUsers
        })

    } catch (error) {
        console.error('Seeding error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
    }
}
