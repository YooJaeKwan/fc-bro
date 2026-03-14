
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const schedulesWithPhotos = await prisma.schedule.findMany({
            where: {
                matchPhotoUrl: {
                    not: null
                }
            },
            orderBy: {
                matchDate: 'desc'
            },
            include: {
                attendances: {
                    include: {
                        user: true
                    }
                }
            }
        })

        const formattedSchedules = schedulesWithPhotos.map((schedule) => {
            let mvpUser = null
            if (schedule.mvpUserId) {
                const mvpAttendance = schedule.attendances.find((a) => a.userId === schedule.mvpUserId)
                if (mvpAttendance && mvpAttendance.user) {
                    mvpUser = mvpAttendance.user
                }
            }

            // 한국시간(UTC+9)으로 변환 후 날짜 추출
            const kstDate = new Date(schedule.matchDate.getTime() + (9 * 60 * 60 * 1000))

            return {
                ...schedule,
                date: kstDate.toISOString().split('T')[0],
                startTime: schedule.startTime,
                mvpUser
            }
        })

        return NextResponse.json({ schedules: formattedSchedules })
    } catch (error) {
        console.error('앨범 데이터 조회 실패:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
