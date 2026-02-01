import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // API 캐싱 방지

export async function GET() {
  try {
    console.log('일정 목록 조회 요청')

    // 모든 일정 조회 (최신순)
    const schedules = await prisma.schedule.findMany({
      include: {
        creator: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        },
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                realName: true,
                nickname: true,
                image: true,
                preferredPosition: true,
                subPositions: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        matchDate: 'asc'
      }
    })

    console.log(`일정 ${schedules.length}개 조회 완료`)

    // 모든 팀원 정보를 미리 가져오기 (비동기 작업을 map 밖에서 처리)
    // 활성 회원만 조회하여 Pending 목록 생성에 사용
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        realName: true,
        nickname: true,
        image: true,
        preferredPosition: true,
        subPositions: true,
        level: true
      }
    })

    // 임시 능력치 생성 함수 (레벨 정보 포함)
    const addTempRating = (attendee: any) => {
      const tempRating = Math.random() * 2 + 6 // 6.0-8.0 사이 랜덤
      // 게스트인 경우 이미 level이 포함되어 있음
      if (attendee.isGuest) {
        return {
          ...attendee,
          rating: Number(tempRating.toFixed(1))
        }
      }
      // 일반 사용자의 경우
      const user = allUsers.find(u => u.id === attendee.userId)
      return {
        ...attendee,
        rating: Number(tempRating.toFixed(1)),
        level: attendee.level || user?.level || 1
      }
    }

    // 클라이언트에 전송할 데이터 구성
    const formattedSchedules = schedules.map(schedule => {
      // 참석자 정보 구성 (실제 투표한 사용자만)
      const attendees = schedule.attendances.map(attendance => {
        // 게스트인 경우
        if (attendance.isGuest) {
          return {
            name: attendance.guestName || '게스트',
            status: attendance.status.toLowerCase(),
            position: attendance.guestPosition || 'MC',
            subPositions: [],
            userId: attendance.guestId || attendance.userId,
            level: attendance.guestLevel || 7,  // 게스트 레벨 추가
            profileImage: null, // 게스트는 프로필 이미지 없음
            isGuest: true
          }
        }
        // 일반 사용자인 경우
        return {
          name: attendance.user?.realName || attendance.user?.nickname || '이름 없음',
          status: attendance.status.toLowerCase(),
          position: attendance.user?.preferredPosition || 'MC',
          subPositions: attendance.user?.subPositions || [],
          userId: attendance.user?.id || attendance.userId,
          profileImage: attendance.user?.image || null,
          isGuest: false
        }
      })

      // 1. 활성 회원 (투표함 또는 미정)
      const activeUserAttendees = allUsers.map(user => {
        const existingAttendance = attendees.find(a => a.userId === user.id && !a.isGuest)
        if (existingAttendance) {
          return existingAttendance
        }

        return {
          name: user.realName || user.nickname || '이름 없음',
          status: 'pending',
          position: user.preferredPosition || 'MC',
          subPositions: user.subPositions || [],
          userId: user.id,
          profileImage: user.image || null,
          isGuest: false
        }
      })

      // 2. 비활성 회원 중 투표한 사람 (투표함)
      const inactiveUserAttendees = attendees.filter(a =>
        !a.isGuest && !allUsers.some(u => u.id === a.userId)
      )

      // 3. 게스트 (투표함)
      const guestAttendees = attendees.filter((a: any) => a.isGuest)

      const finalAttendees = [...activeUserAttendees, ...inactiveUserAttendees, ...guestAttendees]

      // 실시간 통계 계산
      const attendanceStats = {
        attending: 0,
        notAttending: 0,
        pending: 0
      }

      finalAttendees.forEach(a => {
        if (a.status === 'attending') attendanceStats.attending++
        else if (a.status === 'not_attending') attendanceStats.notAttending++
        else if (a.status === 'pending') attendanceStats.pending++
      })

      return {
        id: schedule.id,
        title: schedule.title,
        type: schedule.type,
        date: (() => {
          // 한국시간으로 저장된 DateTime을 한국시간 기준 날짜 문자열로 변환
          const kstDate = new Date(schedule.matchDate.getTime() + (9 * 60 * 60 * 1000))
          return kstDate.toISOString().split('T')[0]
        })(),
        time: schedule.startTime,
        gatherTime: schedule.gatherTime,
        location: schedule.location,
        quarterTime: schedule.quarterTime,
        restTime: schedule.restTime,
        description: schedule.description,
        opponentTeam: schedule.opponentTeam,
        trainingContent: schedule.trainingContent,
        status: schedule.status.toLowerCase(), // SCHEDULED -> scheduled
        // 경기 결과 필드 추가
        ourScore: schedule.ourScore,
        opponentScore: schedule.opponentScore,
        mvpUserId: schedule.mvpUserId,
        matchSummary: schedule.matchSummary,
        attendees: finalAttendees.map(addTempRating),
        attendanceStats, // 실시간 계산된 통계 추가
        attendances: schedule.attendances, // MVP 조회를 위한 참석 정보
        teamFormation: schedule.teamFormation, // 팀편성 결과 포함
        formationDate: schedule.formationDate?.toISOString() || null,
        formationConfirmed: schedule.formationConfirmed || false, // 팀편성 확정 상태
        goalRecords: schedule.goalRecords, // 골 기록
        allowGuests: schedule.allowGuests || false, // 게스트 허용 상태
        createdBy: {
          id: schedule.creator.id,
          name: schedule.creator.realName || schedule.creator.nickname
        },
        createdAt: schedule.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      schedules: formattedSchedules,
      count: formattedSchedules.length
    })

  } catch (error) {
    console.error('일정 목록 조회 중 오류:', error)

    return NextResponse.json(
      { error: '일정 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
