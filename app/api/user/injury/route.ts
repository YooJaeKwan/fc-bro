import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 부상 정보 관리 API
 * POST: 부상 기록 및 상태 업데이트
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('부상 정보 업데이트 요청:', body)

        const {
            userId,
            injuryStatus, // HEALTHY, INJURED, RECOVERING
            injuryName,
            injuryStartDate,
            expectedReturnDate,
            injuryDetail,
            requesterId // 권한 확인용 (선수 본인 또는 총무)
        } = body

        if (!userId || !requesterId) {
            return NextResponse.json(
                { error: '사용자 ID와 요청자 ID가 필요합니다.' },
                { status: 400 }
            )
        }

        // 권한 확인
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

        // 사용자 존재 확인
        const targetUser = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!targetUser) {
            return NextResponse.json(
                { error: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        // 트랜잭션으로 처리: 사용자 상태 업데이트 + 부상 이력 생성(필요시)
        const result = await prisma.$transaction(async (tx) => {
            // 1. 사용자 현재 부상 상태 업데이트
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    injuryStatus: injuryStatus || 'HEALTHY',
                    injuryName: injuryName || null,
                    injuryStartDate: injuryStartDate ? new Date(injuryStartDate) : null,
                    expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
                    injuryDetail: injuryDetail || null,
                    updatedAt: new Date()
                }
            })

            // 2. 부상 기록 추가 (부상 상태가 HEALTHY가 아닌 경우에만 이력으로 남김)
            // 또는 명시적으로 시작할 때만 남길 수도 있지만, 여기서는 상태 변경 시 기록
            if (injuryStatus && injuryStatus !== 'HEALTHY' && injuryName) {
                // 이미 진행 중인 동일한 부상이 있는지 확인 (간단하게 최근 것 확인)
                const recentInjury = await tx.injury.findFirst({
                    where: {
                        userId,
                        injuryName,
                        endDate: null
                    },
                    orderBy: { startDate: 'desc' }
                })

                if (!recentInjury) {
                    await tx.injury.create({
                        data: {
                            userId,
                            injuryName,
                            startDate: injuryStartDate ? new Date(injuryStartDate) : new Date(),
                            description: injuryDetail || null
                        }
                    })
                } else {
                    // 기존 부상 기록 내용 업데이트
                    await tx.injury.update({
                        where: { id: recentInjury.id },
                        data: {
                            description: injuryDetail || recentInjury.description,
                            updatedAt: new Date()
                        }
                    })
                }
            }

            // 3. 만약 부상 상태가 HEALTHY로 변경되었다면, 진행 중인(endDate가 null인) 부상 기록 종료
            if (injuryStatus === 'HEALTHY') {
                const activeInjuries = await tx.injury.findMany({
                    where: {
                        userId,
                        endDate: null
                    }
                })

                for (const injury of activeInjuries) {
                    await tx.injury.update({
                        where: { id: injury.id },
                        data: {
                            endDate: new Date(),
                            updatedAt: new Date()
                        }
                    })
                }
            }

            return updatedUser
        })

        return NextResponse.json({
            success: true,
            message: '부상 정보가 성공적으로 업데이트되었습니다.',
            user: result
        })

    } catch (error) {
        console.error('부상 정보 업데이트 중 오류:', error)
        return NextResponse.json(
            { error: '부상 정보 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
