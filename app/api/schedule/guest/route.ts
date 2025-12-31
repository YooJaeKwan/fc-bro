import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 게스트 목록 조회
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

    // 해당 일정의 게스트 목록 조회
    const guests = await prisma.scheduleAttendance.findMany({
      where: {
        scheduleId,
        isGuest: true
      },
      select: {
        id: true,
        guestId: true,
        guestName: true,
        guestLevel: true,
        guestPosition: true,
        invitedByUserId: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            realName: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      guests: guests.map(guest => ({
        id: guest.guestId,
        name: guest.guestName,
        level: guest.guestLevel,
        position: guest.guestPosition,
        status: guest.status,
        invitedBy: guest.user?.realName || guest.user?.nickname || '알 수 없음',
        createdAt: guest.createdAt
      }))
    })

  } catch (error) {
    console.error('게스트 목록 조회 중 오류:', error)
    return NextResponse.json(
      { error: '게스트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, guestName, guestLevel, guestPosition, invitedByUserId, sameTeamAsInviter } = body

    // 필수 필드 확인
    if (!scheduleId || !guestName || !guestLevel || !guestPosition || !invitedByUserId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // sameTeamAsInviter 기본값 처리 (없으면 false)
    const sameTeam = sameTeamAsInviter !== undefined ? sameTeamAsInviter : false

    // 초대한 사용자 확인
    const inviter = await prisma.user.findUnique({
      where: { id: invitedByUserId }
    })

    if (!inviter) {
      return NextResponse.json(
        { error: '초대자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 게스트를 attendance에 추가 (게스트용 임시 ID 사용)
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // ScheduleAttendance 테이블에 게스트 정보 저장
    const attendance = await prisma.scheduleAttendance.create({
      data: {
        scheduleId,
        guestId,  // userId 대신 guestId 사용
        status: 'ATTENDING',
        guestName,
        guestLevel,
        guestPosition,
        invitedByUserId,
        isGuest: true,
        sameTeamAsInviter: sameTeam
      }
    })

    console.log('게스트 등록 성공:', { guestName, invitedBy: inviter.realName })

    // 게스트 초대 시 기존 팀편성 결과 초기화
    try {
      const scheduleWithFormation = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { teamFormation: true, formationDate: true }
      })

      if (scheduleWithFormation?.teamFormation || scheduleWithFormation?.formationDate) {
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            teamFormation: null,
            formationDate: null,
            formationConfirmed: false
          }
        })
        console.log('게스트 초대로 인한 팀편성 및 확정 상태 초기화 완료:', scheduleId)
      }
    } catch (error) {
      console.error('팀편성 초기화 중 오류 (무시됨):', error)
    }

    return NextResponse.json({
      success: true,
      teamFormationReset: true, // 팀편성이 초기화되었음을 알림
      guest: {
        userId: guestId,  // 프론트엔드에서 사용할 ID
        name: guestName,
        level: guestLevel,
        position: guestPosition,
        invitedBy: inviter.realName || inviter.nickname,
        isGuest: true,
        status: 'attending'
      }
    })

  } catch (error) {
    console.error('게스트 등록 중 오류:', error)
    return NextResponse.json(
      { error: '게스트 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게스트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, guestId } = body

    if (!scheduleId || !guestId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    await prisma.scheduleAttendance.delete({
      where: {
        scheduleId_guestId: {
          scheduleId,
          guestId
        }
      }
    })

    // 게스트 삭제 시 기존 팀편성 결과 초기화
    try {
      const scheduleWithFormation = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { teamFormation: true, formationDate: true }
      })

      if (scheduleWithFormation?.teamFormation || scheduleWithFormation?.formationDate) {
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            teamFormation: null,
            formationDate: null,
            formationConfirmed: false
          }
        })
        console.log('게스트 삭제로 인한 팀편성 및 확정 상태 초기화 완료:', scheduleId)
      }
    } catch (error) {
      console.error('팀편성 초기화 중 오류 (무시됨):', error)
    }

    return NextResponse.json({
      success: true,
      teamFormationReset: true
    })

  } catch (error) {
    console.error('게스트 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '게스트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}