import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, announcementId } = body

        if (!userId || !announcementId) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
        }

        // 이미 읽었는지 확인하고 없으면 생성 (upsert 방침)
        await prisma.announcementRead.upsert({
            where: {
                userId_announcementId: {
                    userId,
                    announcementId
                }
            },
            update: {},
            create: {
                userId,
                announcementId
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('공지사항 읽음 처리 오류:', error)
        return NextResponse.json({ error: '읽음 처리 실패' }, { status: 500 })
    }
}
