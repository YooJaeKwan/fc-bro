import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        realName: true,
        nickname: true,
        preferredPosition: true,
        subPositions: true,
        level: true
      }
    })

    // 임시 능력치 생성 함수 (레벨 정보 포함)
    const addTempRating = (attendee: any) => {
      const tempRating = Math.random() * 2 + 6 // 6.0-8.0 사이 랜덤
      const user = allUsers.find(u => u.id === attendee.userId)
      return {
        ...attendee,
        rating: Number(tempRating.toFixed(1)),
        level: user?.level || 1
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
          isGuest: false
        }
      })

      // 모든 팀원과 투표 데이터 병합 (게스트 포함)
      const allAttendees = allUsers.map(user => {
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
          isGuest: false
        }
      })

      // 게스트를 allAttendees에 추가
      const guestAttendees = attendees.filter((a: any) => a.isGuest)
      const finalAttendees = [...allAttendees, ...guestAttendees]

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
        attendees: finalAttendees.map(addTempRating),
        teamFormation: schedule.teamFormation, // 팀편성 결과 포함
        formationDate: schedule.formationDate?.toISOString() || null,
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
