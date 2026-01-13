
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

            return {
                ...schedule,
                date: schedule.matchDate.toISOString().split('T')[0],
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
