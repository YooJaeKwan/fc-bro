import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { updateScheduleAttendanceStatsWithPending } from '@/lib/attendance-stats'

// 참석 투표 등록/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('참석 투표 요청:', body)

    const { scheduleId, userId, status } = body

    // 필수 필드 검증
    if (!scheduleId || !userId || !status) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 유효한 참석 상태인지 확인
    const validStatuses = ['PENDING', 'ATTENDING', 'NOT_ATTENDING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 참석 상태입니다.' },
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

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      )
    }

    // 기존 참석 정보 확인 후 upsert
    const attendance = await prisma.scheduleAttendance.upsert({
      where: {
        scheduleId_userId: {
          scheduleId,
          userId
        }
      },
      update: {
        status,
        updatedAt: new Date()
      },
      create: {
        scheduleId,
        userId,
        status
      },
      include: {
        user: {
          select: {
            id: true,
            realName: true,
            nickname: true,
            preferredPosition: true
          }
        }
      }
    })

    console.log('참석 투표 처리 완료:', attendance.id)

    // 참석 투표 변경 시 기존 팀편성 결과 초기화
    try {
      const scheduleWithFormation = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { teamFormation: true, formationDate: true }
      })

      if (scheduleWithFormation?.teamFormation || scheduleWithFormation?.formationDate) {
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            teamFormation: Prisma.DbNull,
            formationDate: null,
            formationConfirmed: false
          }
        })
        console.log('참석 투표 변경으로 인한 팀편성 및 확정 상태 초기화 완료:', scheduleId)
      }
    } catch (error) {
      console.error('팀편성 초기화 중 오류 (무시됨):', error)
      // 팀편성 초기화 실패는 참석 투표 성공에 영향을 주지 않음
    }

    // 참석 통계 업데이트 (비정규화된 카운터) - 응답 속도를 위해 비동기로 처리
    updateScheduleAttendanceStatsWithPending(scheduleId).catch((error: Error) => {
      console.error('참석 통계 업데이트 중 오류 (무시됨):', error)
    })

    return NextResponse.json({
      success: true,
      message: '참석 투표가 등록되었습니다.',
      teamFormationReset: true, // 팀편성이 초기화되었음을 알림
      attendance: {
        scheduleId: attendance.scheduleId,
        userId: attendance.userId,
        status: attendance.status,
        user: {
          name: attendance.user?.realName || attendance.user?.nickname || '알 수 없음',
          position: attendance.user?.preferredPosition ?? null
        },
        updatedAt: attendance.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('참석 투표 처리 중 오류:', error)

    return NextResponse.json(
      { error: '참석 투표 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 일정별 참석자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const statsOnly = searchParams.get('statsOnly') === 'true'

    if (!scheduleId) {
      return NextResponse.json(
        { error: '일정 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // statsOnly=true인 경우 실시간 통계 계산하여 반환
    if (statsOnly) {
      // 1. 전체 활성 회원 수 조회
      const totalActiveUsers = await prisma.user.count({
        where: { isActive: true }
      })

      // 2. 해당 일정의 참석 데이터 집계 (상태별, 게스트 여부별)
      const attendanceStats = await prisma.scheduleAttendance.groupBy({
        by: ['status', 'isGuest'],
        where: { scheduleId },
        _count: { status: true }
      })

      // 3. 통계 계산
      let attending = 0
      let notAttending = 0
      let votedMembers = 0

      attendanceStats.forEach(stat => {
        const count = stat._count.status
        
        if (stat.status === 'ATTENDING') {
          attending += count
        } else if (stat.status === 'NOT_ATTENDING') {
          notAttending += count
        }

        // 미정(Pending) 계산을 위해 투표한 정회원 수 집계 (게스트 제외)
        if (!stat.isGuest && (stat.status === 'ATTENDING' || stat.status === 'NOT_ATTENDING')) {
          votedMembers += count
        }
      })

      // 미정 인원 = 전체 활성 회원 - 투표한 정회원
      const pending = Math.max(0, totalActiveUsers - votedMembers)

      return NextResponse.json({
        success: true,
        stats: {
          attending,
          notAttending,
          pending,
          total: attending + notAttending + pending
        }
      })
    }

    console.log('참석자 목록 조회:', scheduleId)

    // 해당 일정의 참석자 목록 조회 (게스트 포함)
    const attendances = await prisma.scheduleAttendance.findMany({
      where: { scheduleId },
      include: {
        user: {
          select: {
            id: true,
            realName: true,
            nickname: true,
            preferredPosition: true,
            subPositions: true,
            level: true,
            image: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 아직 투표하지 않은 사용자들도 포함 (모든 팀원)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        realName: true,
        nickname: true,
        preferredPosition: true,
        subPositions: true,
        level: true,
        image: true
      }
    })

    // 참석 투표 데이터와 전체 사용자 데이터 병합
    const regularAttendees = allUsers.map(user => {
      const attendance = attendances.find(att => att.userId === user.id && !att.isGuest)

      // 임시 능력치 생성 (포지션 기반)
      const generateTempRating = (position: string) => {
        const baseRating = Math.random() * 2 + 6 // 6.0-8.0
        return Number(baseRating.toFixed(1))
      }

      return {
        userId: user.id,
        name: user.realName || user.nickname || '이름 없음',
        position: user.preferredPosition || 'MC',
        subPositions: user.subPositions || [],
        status: attendance?.status.toLowerCase() || 'pending',
        rating: generateTempRating(user.preferredPosition || 'MC'),
        level: user.level || 1,
        profileImage: user.image,
        updatedAt: attendance?.updatedAt.toISOString() || null,
        isGuest: false
      }
    })

    // 게스트 참석자 추가
    const guestAttendees = attendances
      .filter(att => att.isGuest)
      .map(att => ({
        userId: att.guestId || att.userId,  // guestId를 우선 사용
        name: att.guestName || '게스트',
        invitedBy: att.invitedBy?.realName || att.invitedBy?.nickname || '알 수 없음',
        invitedByUserId: att.invitedByUserId || null,  // 초대자 ID 추가
        position: att.guestPosition || 'MC',  // 게스트 포지션
        subPositions: [],
        status: att.status.toLowerCase(),
        rating: 5.0, // 게스트 기본 능력치
        level: att.guestLevel || 7, // 기본 레벨 아마추어3
        profileImage: null,
        updatedAt: att.updatedAt.toISOString(),
        isGuest: true
      }))

    const attendeeList = [...regularAttendees, ...guestAttendees]

    console.log(`참석자 목록 조회 완료: ${attendeeList.length}명`)

    return NextResponse.json({
      success: true,
      attendees: attendeeList,
      stats: {
        total: attendeeList.length,
        attending: attendeeList.filter(a => a.status === 'attending').length,
        notAttending: attendeeList.filter(a => a.status === 'not_attending').length,
        pending: attendeeList.filter(a => a.status === 'pending').length
      }
    })

  } catch (error) {
    console.error('참석자 목록 조회 중 오류:', error)

    return NextResponse.json(
      { error: '참석자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 참석 투표 삭제 (총무만 가능)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, targetUserId, guestId, adminUserId } = body

    // 필수 필드 검증
    if (!scheduleId || !adminUserId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 일반 사용자 삭제인지 게스트 삭제인지 확인
    if (!targetUserId && !guestId) {
      return NextResponse.json(
        { error: '삭제할 사용자 ID 또는 게스트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 권한 확인 (총무 또는 게스트 초대자)
    const requestUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true }
    })

    const isAdmin = requestUser?.role === 'ADMIN'

    // 게스트 삭제 시 초대자인지 확인
    let isGuestInviter = false
    if (guestId) {
      const guestAttendance = await prisma.scheduleAttendance.findFirst({
        where: {
          scheduleId,
          guestId,
          isGuest: true
        },
        select: { invitedByUserId: true }
      })

      if (guestAttendance?.invitedByUserId === adminUserId) {
        isGuestInviter = true
      }
    }

    // 일반 사용자 삭제는 총무만 가능, 게스트 삭제는 총무 또는 초대자 가능
    if (!isAdmin && !isGuestInviter) {
      return NextResponse.json(
        { error: '권한이 없습니다. 총무이거나 게스트 초대자여야 합니다.' },
        { status: 403 }
      )
    }

    // 일반 사용자 삭제 시 총무 권한 필수
    if (targetUserId && !isAdmin) {
      return NextResponse.json(
        { error: '총무 권한이 필요합니다.' },
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

    // 참석 기록 삭제
    if (guestId) {
      // 게스트 삭제
      await prisma.scheduleAttendance.delete({
        where: {
          scheduleId_guestId: {
            scheduleId,
            guestId
          }
        }
      })
      console.log('게스트 참석 투표 삭제:', { scheduleId, guestId })
    } else if (targetUserId) {
      // 일반 사용자 삭제
      await prisma.scheduleAttendance.delete({
        where: {
          scheduleId_userId: {
            scheduleId,
            userId: targetUserId
          }
        }
      })
      console.log('일반 사용자 참석 투표 삭제:', { scheduleId, targetUserId })
    }

    // 참석 투표 삭제 시 기존 팀편성 결과 초기화
    try {
      const scheduleWithFormation = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { teamFormation: true, formationDate: true }
      })

      if (scheduleWithFormation?.teamFormation || scheduleWithFormation?.formationDate) {
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            teamFormation: Prisma.DbNull,
            formationDate: null,
            formationConfirmed: false
          }
        })
        console.log('참석 투표 삭제로 인한 팀편성 및 확정 상태 초기화 완료:', scheduleId)
      }
    } catch (error) {
      console.error('팀편성 초기화 중 오류 (무시됨):', error)
    }

    // 참석 통계 업데이트 (비정규화된 카운터) - 응답 속도를 위해 비동기로 처리
    updateScheduleAttendanceStatsWithPending(scheduleId).catch((error: Error) => {
      console.error('참석 통계 업데이트 중 오류 (무시됨):', error)
    })

    return NextResponse.json({
      success: true,
      message: '참석 투표가 삭제되었습니다.',
      teamFormationReset: true
    })

  } catch (error: any) {
    console.error('참석 투표 삭제 중 오류:', error)

    // 레코드를 찾을 수 없는 경우
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '삭제할 참석 투표를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '참석 투표 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
