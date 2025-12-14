import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formTeams, getPositionCategory, getLevelCategory, getLevelLabelForFormation } from '@/lib/team-formation'

// 팀편성 생성
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
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '팀편성은 총무만 가능합니다.' },
        { status: 403 }
      )
    }

    // 일정 조회
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        attendances: {
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
        }
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: '일정을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 참석자 필터링 (ATTENDING 상태만)
    const attendingPlayers = schedule.attendances
      .filter(att => att.status === 'ATTENDING')
      .map(att => {
        if (att.isGuest) {
          // 게스트 - 주포지션에 따라 분류되지만 게스트 카테고리로 표시
          const guestPosition = att.guestPosition || null
          return {
            userId: att.guestId || att.id,
            name: att.guestName || '게스트',
            position: guestPosition,
            subPositions: [],
            level: null,
            guestLevel: att.guestLevel || '보통',
            isGuest: true,
            invitedByUserId: att.invitedByUserId || undefined, // 초대한 사용자 ID 추가
            positionCategory: getPositionCategory(guestPosition), // 게스트도 주포지션 카테고리 저장
            levelCategory: att.guestLevel || '보통'
          }
        } else {
          // 일반 사용자 - 주포지션에 따라 분류
          const user = att.user
          if (!user) return null

          const preferredPosition = user.preferredPosition || null
          const positionCategory = getPositionCategory(preferredPosition)

          return {
            userId: user.id,
            name: user.realName || user.nickname || '이름 없음',
            position: preferredPosition,
            subPositions: user.subPositions || [],
            level: user.level || 1,
            guestLevel: null,
            isGuest: false,
            positionCategory: positionCategory, // 주포지션 카테고리 저장
            levelCategory: getLevelLabelForFormation(user.level)
          }
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    if (attendingPlayers.length < 2) {
      return NextResponse.json(
        { error: '팀편성을 하려면 최소 2명 이상의 참석자가 필요합니다.' },
        { status: 400 }
      )
    }

    // 팀 편성 실행
    const formation = formTeams(attendingPlayers)

    // 팀편성 결과 저장
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: formation as any,
        formationDate: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      formation
    })
  } catch (error) {
    console.error('팀편성 생성 오류:', error)
    return NextResponse.json(
      { error: '팀편성 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 팀편성 조회
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
        { error: '일정을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      teamFormation: schedule.teamFormation,
      formationDate: schedule.formationDate
    })
  } catch (error) {
    console.error('팀편성 조회 오류:', error)
    return NextResponse.json(
      { error: '팀편성 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 팀편성 삭제
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
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '팀편성 삭제는 총무만 가능합니다.' },
        { status: 403 }
      )
    }

    // 팀편성 결과 삭제
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: Prisma.JsonNull,
        formationDate: null
      }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('팀편성 삭제 오류:', error)
    return NextResponse.json(
      { error: '팀편성 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

