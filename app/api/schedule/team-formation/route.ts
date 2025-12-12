import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { formTeams, AttendeeForFormation, getPositionCategory } from '@/lib/team-formation'
import { LEVEL_SYSTEM, getLevelLabel } from '@/lib/level-system'

// 자동 팀편성 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, userId } = body

    if (!scheduleId || !userId) {
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
        { error: '팀편성은 총무 권한만 가능합니다.' },
        { status: 403 }
      )
    }

    // 일정 확인
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: '존재하지 않는 일정입니다.' },
        { status: 404 }
      )
    }

    // 참석자 목록 조회 (참석 상태만)
    const attendances = await prisma.scheduleAttendance.findMany({
      where: {
        scheduleId,
        status: 'ATTENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            realName: true,
            nickname: true,
            preferredPosition: true,
            subPositions: true,
            level: true
          }
        }
      }
    })

    // 참석자 데이터 준비
    const attendees: AttendeeForFormation[] = attendances.map(attendance => {
      if (attendance.isGuest) {
        // 게스트
        return {
          userId: attendance.guestId || attendance.userId || '',
          name: attendance.guestName || '게스트',
          position: attendance.guestPosition || null,
          subPositions: [],
          level: null,
          isGuest: true,
          guestLevel: attendance.guestLevel,
          status: 'attending' as const
        }
      } else {
        // 일반 사용자
        return {
          userId: attendance.userId || '',
          name: attendance.user?.realName || attendance.user?.nickname || '이름 없음',
          position: attendance.user?.preferredPosition || null,
          subPositions: attendance.user?.subPositions || [],
          level: attendance.user?.level || null,
          isGuest: false,
          status: 'attending' as const
        }
      }
    })

    // 팀편성 실행
    const formationResult = formTeams(attendees)

    // 레벨 라벨 가져오기 함수 (디테일하게 표시)
    const getLevelLabelForFormation = (level: number | null | undefined, isGuest: boolean, guestLevel?: number | null): string => {
      if (isGuest) {
        // 게스트는 레벨 숫자 그대로 사용 (1=미숙, 2=보통, 3=잘함)
        if (!guestLevel) return '미숙'
        if (guestLevel === 1) return '미숙'
        if (guestLevel === 2) return '보통'
        if (guestLevel === 3) return '잘함'
        return '보통'
      }
      
      // 일반 사용자는 getLevelLabel 사용 (예: "아마추어 1", "세미프로 1" 등)
      return getLevelLabel(level)
    }

    // 팀편성 결과를 JSON으로 저장
    const teamFormation = {
      yellowTeam: formationResult.yellowTeam.map(p => {
        const attendee = attendees.find(a => a.userId === p.userId)
        return {
          userId: p.userId,
          name: p.name,
          position: p.position,
          subPositions: p.subPositions,
          isGuest: p.isGuest,
          positionCategory: getPositionCategory(p.position),
          levelCategory: getLevelLabelForFormation(attendee?.level, p.isGuest, attendee?.guestLevel)
        }
      }),
      blueTeam: formationResult.blueTeam.map(p => {
        const attendee = attendees.find(a => a.userId === p.userId)
        return {
          userId: p.userId,
          name: p.name,
          position: p.position,
          subPositions: p.subPositions,
          isGuest: p.isGuest,
          positionCategory: getPositionCategory(p.position),
          levelCategory: getLevelLabelForFormation(attendee?.level, p.isGuest, attendee?.guestLevel)
        }
      }),
      stats: {
        yellow: formationResult.yellowTeamStats,
        blue: formationResult.blueTeamStats
      }
    }

    // 일정에 팀편성 결과 저장
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: teamFormation as Prisma.JsonValue,
        formationDate: new Date()
      }
    })

    console.log('팀편성 완료:', {
      scheduleId,
      yellowCount: formationResult.yellowTeam.length,
      blueCount: formationResult.blueTeam.length
    })

    return NextResponse.json({
      success: true,
      message: '팀편성이 완료되었습니다.',
      formation: teamFormation,
      stats: {
        yellow: formationResult.yellowTeamStats,
        blue: formationResult.blueTeamStats
      }
    })

  } catch (error) {
    console.error('팀편성 처리 중 오류:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : '팀편성 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

// 팀편성 결과 조회
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
        teamFormation: true,
        formationDate: true
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
      formation: schedule.teamFormation,
      formationDate: schedule.formationDate?.toISOString() || null
    })

  } catch (error) {
    console.error('팀편성 조회 중 오류:', error)
    
    return NextResponse.json(
      { error: '팀편성 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 팀편성 결과 삭제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, userId } = body

    if (!scheduleId || !userId) {
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
        { error: '팀편성 삭제는 총무 권한만 가능합니다.' },
        { status: 403 }
      )
    }

    // 팀편성 결과 삭제
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: null,
        formationDate: null
      }
    })

    return NextResponse.json({
      success: true,
      message: '팀편성 결과가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('팀편성 삭제 중 오류:', error)
    
    return NextResponse.json(
      { error: '팀편성 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

