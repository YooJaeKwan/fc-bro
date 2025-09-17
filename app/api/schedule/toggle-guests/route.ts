import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, userId, allowGuests } = body

    // 필수 필드 확인
    if (!scheduleId || !userId || allowGuests === undefined) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 권한 확인 (총무만 가능)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '게스트 허용 상태는 총무만 변경할 수 있습니다.' },
        { status: 403 }
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

    // 자체경기가 아닌 경우 게스트 허용 불가
    if (schedule.type !== 'internal') {
      return NextResponse.json(
        { error: '자체경기만 게스트를 허용할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 게스트 허용 상태 업데이트
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        allowGuests: allowGuests
      }
    })

    console.log('게스트 허용 상태 변경:', { scheduleId, allowGuests })

    return NextResponse.json({
      success: true,
      allowGuests: updatedSchedule.allowGuests,
      message: allowGuests
        ? '이제 모든 선수가 게스트를 초대할 수 있습니다.'
        : '게스트 초대가 중단되었습니다.'
    })

  } catch (error) {
    console.error('게스트 허용 상태 변경 중 오류:', error)
    return NextResponse.json(
      { error: '게스트 허용 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 일정의 게스트 허용 상태 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json(
        { error: '일정 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: {
        id: true,
        allowGuests: true,
        type: true
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: '존재하지 않는 일정입니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      allowGuests: schedule.allowGuests,
      canHaveGuests: schedule.type === 'internal'
    })

  } catch (error) {
    console.error('게스트 허용 상태 조회 중 오류:', error)
    return NextResponse.json(
      { error: '게스트 허용 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}