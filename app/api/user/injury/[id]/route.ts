import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { id } = params
        const {
            userId,           // To verify ownership
            requesterId,      // For permission check
            injuryName,
            startDate,
            endDate,
            description
        } = body

        if (!id || !userId || !requesterId) {
            return NextResponse.json(
                { error: '부상 ID, 사용자 ID, 요청자 ID가 필요합니다.' },
                { status: 400 }
            )
        }

        // 권한 확인 (본인 또는 총무)
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { role: true }
        })

        const isAdmin = requester?.role === 'ADMIN'
        const isSelf = userId === requesterId

        if (!isAdmin && !isSelf) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        // 부상 기록 존재 여부 및 소유권 확인
        const existingInjury = await prisma.injury.findUnique({
            where: { id }
        })

        if (!existingInjury) {
            return NextResponse.json(
                { error: '부상 기록을 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (existingInjury.userId !== userId) {
            return NextResponse.json(
                { error: '해당 부상 기록에 대한 권한이 없습니다.' },
                { status: 403 }
            )
        }

        // 부상 기록 업데이트
        const updatedInjury = await prisma.injury.update({
            where: { id },
            data: {
                injuryName,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                description,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: '부상 이력이 성공적으로 수정되었습니다.',
            injury: updatedInjury
        })

    } catch (error) {
        console.error('부상 이력 수정 중 오류:', error)
        return NextResponse.json(
            { error: '부상 이력 수정 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { id } = params
        const { userId, requesterId } = body

        if (!id || !userId || !requesterId) {
            return NextResponse.json(
                { error: '부상 ID, 사용자 ID, 요청자 ID가 필요합니다.' },
                { status: 400 }
            )
        }

        // 권한 확인 (본인 또는 총무)
        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { role: true }
        })

        const isAdmin = requester?.role === 'ADMIN'
        const isSelf = userId === requesterId

        if (!isAdmin && !isSelf) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        // 부상 기록 존재 여부 및 소유권 확인
        const existingInjury = await prisma.injury.findUnique({
            where: { id }
        })

        if (!existingInjury) {
            return NextResponse.json(
                { error: '부상 기록을 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (existingInjury.userId !== userId) {
            return NextResponse.json(
                { error: '해당 부상 기록에 대한 권한이 없습니다.' },
                { status: 403 }
            )
        }

        // 부상 기록 삭제
        await prisma.injury.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: '부상 이력이 성공적으로 삭제되었습니다.'
        })

    } catch (error) {
        console.error('부상 이력 삭제 중 오류:', error)
        return NextResponse.json(
            { error: '부상 이력 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
