import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, userId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: '일정 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 일정 존재 확인
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: '존재하지 않는 일정입니다.' },
        { status: 404 }
      )
    }

    // 사용자 권한 확인 (총무만 삭제 가능)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '일정 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 관련 데이터 삭제 (참석 정보, 팀편성 결과)
    await prisma.$transaction(async (tx) => {
      // 참석 정보 삭제
      await tx.scheduleAttendance.deleteMany({
        where: { scheduleId }
      })

      // 일정 삭제
      await tx.schedule.delete({
        where: { id: scheduleId }
      })
    })

    console.log(`일정 삭제 완료: ${scheduleId}`)

    return NextResponse.json({
      success: true,
      message: '일정이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('일정 삭제 중 오류:', error)
    
    return NextResponse.json(
      { error: '일정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
