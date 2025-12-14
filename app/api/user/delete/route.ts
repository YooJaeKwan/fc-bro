import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetUserId, adminUserId, confirmDelete } = body

    if (!targetUserId || !adminUserId || confirmDelete !== true) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었거나 삭제 확인이 필요합니다.' }, 
        { status: 400 }
      )
    }

    // 관리자 권한 확인
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '총무 권한이 필요합니다.' }, 
        { status: 403 }
      )
    }

    // 대상 사용자 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' }, 
        { status: 404 }
      )
    }

    // 자기 자신은 삭제할 수 없음
    if (targetUserId === adminUserId) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' }, 
        { status: 400 }
      )
    }

    // 관련 데이터와 함께 사용자 삭제 (트랜잭션)
    await prisma.$transaction(async (tx) => {
      // 1. 일정 참석 기록 삭제
      await tx.scheduleAttendance.deleteMany({
        where: { userId: targetUserId }
      })

      // 2. 선수 통계 삭제
      await tx.schedulePlayerStat.deleteMany({
        where: { userId: targetUserId }
      })

      // 3. 팀 멤버십 삭제
      await tx.teamMember.deleteMany({
        where: { userId: targetUserId }
      })

      // 4. 알림 삭제
      await tx.notification.deleteMany({
        where: { userId: targetUserId }
      })

      // 5. 댓글 삭제
      await tx.comment.deleteMany({
        where: { userId: targetUserId }
      })

      // 6. 게시글 삭제
      await tx.post.deleteMany({
        where: { userId: targetUserId }
      })

      // 7. 생성한 일정 삭제 (다른 사람이 참석한 경우 문제가 될 수 있으므로 주의)
      // 일정은 삭제하지 않고 creatorId만 null로 설정
      await tx.schedule.updateMany({
        where: { creatorId: targetUserId },
        data: { creatorId: null }
      })

      // 8. 사용자 삭제
      await tx.user.delete({
        where: { id: targetUserId }
      })
    })

    console.log(`사용자 완전 삭제: ${targetUser.realName} (${targetUser.id})`)

    return NextResponse.json({
      success: true,
      message: '사용자가 완전히 삭제되었습니다.'
    })

  } catch (error) {
    console.error('사용자 삭제 중 오류:', error)
    
    // 관련 데이터가 있어서 삭제할 수 없는 경우
    if (error instanceof Error && error.message.includes('constraint')) {
      return NextResponse.json(
        { error: '관련 데이터가 있어 삭제할 수 없습니다. 먼저 비활성화를 시도해보세요.' }, 
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '사용자 삭제 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}
