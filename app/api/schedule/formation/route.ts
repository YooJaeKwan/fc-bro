import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 팀편성 결과 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('팀편성 저장 요청:', body)

    const { scheduleId, yellowTeam, blueTeam, yellowAverage, blueAverage, levelDifference } = body

    if (!scheduleId || !yellowTeam || !blueTeam) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
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

    // 팀편성 결과 저장
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: {
          yellowTeam,
          blueTeam,
          yellowAverage,
          blueAverage,
          levelDifference,
          createdAt: new Date().toISOString()
        },
        formationDate: new Date()
      }
    })

    console.log('팀편성 저장 완료:', scheduleId)

    return NextResponse.json({
      success: true,
      message: '팀편성이 저장되었습니다.',
      formation: updatedSchedule.teamFormation
    })

  } catch (error) {
    console.error('팀편성 저장 중 오류:', error)
    
    return NextResponse.json(
      { error: '팀편성 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 팀편성 결과 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json(
        { error: '일정 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('팀편성 삭제 요청:', scheduleId)

    // 팀편성 결과 삭제
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: null,
        formationDate: null
      }
    })

    console.log('팀편성 삭제 완료:', scheduleId)

    return NextResponse.json({
      success: true,
      message: '팀편성이 초기화되었습니다.'
    })

  } catch (error) {
    console.error('팀편성 삭제 중 오류:', error)
    
    return NextResponse.json(
      { error: '팀편성 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
