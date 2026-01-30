import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 공지사항 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        // 2주(14일) 전 날짜 계산
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

        const announcements = await prisma.announcement.findMany({
            where: {
                isActive: true,
                createdAt: {
                    gte: twoWeeksAgo
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // 최대 5개까지만 노출
            include: userId ? {
                readBy: {
                    where: { userId }
                }
            } : undefined
        })

        // 가공: 사용자가 읽었는지 여부 추가
        const formattedAnnouncements = announcements.map((a: any) => {
            const { readBy, ...rest } = a
            return {
                ...rest,
                isRead: userId ? readBy.length > 0 : false
            }
        })

        return NextResponse.json({
            success: true,
            announcements: formattedAnnouncements,
            unreadCount: userId ? formattedAnnouncements.filter(a => !a.isRead).length : 0
        })
    } catch (error) {
        console.error('공지사항 조회 오류:', error)
        return NextResponse.json({ error: '공지사항 조회 실패' }, { status: 500 })
    }
}

// 공지사항 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { content, userId, userRole } = body

        // 권한 확인
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        if (!content) {
            return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
        }

        const announcement = await prisma.announcement.create({
            data: {
                content,
                createdBy: userId,
            },
        })

        return NextResponse.json({
            success: true,
            announcement,
        })
    } catch (error) {
        console.error('공지사항 생성 오류:', error)
        return NextResponse.json({ error: '공지사항 생성 실패' }, { status: 500 })
    }
}

// 공지사항 수정
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, content, userRole } = body

        // 권한 확인
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        if (!id || !content) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
        }

        const announcement = await prisma.announcement.update({
            where: { id },
            data: { content },
        })

        return NextResponse.json({
            success: true,
            announcement,
        })
    } catch (error) {
        console.error('공지사항 수정 오류:', error)
        return NextResponse.json({ error: '공지사항 수정 실패' }, { status: 500 })
    }
}

// 공지사항 삭제 (비활성화)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const userRole = searchParams.get('userRole')

        // 권한 확인
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        if (!id) {
            return NextResponse.json({ error: '공지사항 ID가 필요합니다.' }, { status: 400 })
        }

        await prisma.announcement.update({
            where: { id },
            data: { isActive: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('공지사항 삭제 오류:', error)
        return NextResponse.json({ error: '공지사항 삭제 실패' }, { status: 500 })
    }
}
