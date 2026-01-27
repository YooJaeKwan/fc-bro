import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // 1. 다음 일정 (가장 가까운 미래 일정 1개) - 비정규화된 통계 사용
    const nextScheduleRequest = prisma.schedule.findFirst({
      where: {
        matchDate: {
          gte: now
        }
      },
      orderBy: {
        matchDate: 'asc'
      },
      include: {
        // 현재 사용자의 투표 상태만 가져오기 (전체 참석 목록 불필요)
        attendances: {
          where: { userId },
          take: 1
        }
      }
    })

    // 2. 최근 경기 (과거 일정 3개)
    const recentMatchesRequest = prisma.schedule.findMany({
      where: {
        matchDate: {
          lt: now
        },
        // 결과가 있는 경기만? 아니면 참석한 경기만? -> 기존 로직은 "참석한" 경기
        attendances: {
          some: {
            userId: userId,
            status: 'ATTENDING'
          }
        }
      },
      orderBy: {
        matchDate: 'desc'
      },
      take: 3,
      include: {
        attendances: {
          where: { userId }
        }
      }
    })

    // 3. 올해 통계 계산용 (올해 모든 일정)
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1) // 1월 1일

    const yearSchedulesRequest = prisma.schedule.findMany({
      where: {
        matchDate: {
          gte: yearStart
        }
      },
      select: {
        id: true,
        type: true,
        matchDate: true,
        ourScore: true,
        opponentScore: true,
        teamFormation: true,
        attendances: {
          where: {
            userId,
            status: 'ATTENDING'
          }
        }
      }
    })

    // 4. 뱃지 정보
    const badgesRequest = prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    })

    // 병렬 실행
    const [nextSchedule, recentMatches, yearSchedules, userBadges] = await Promise.all([
      nextScheduleRequest,
      recentMatchesRequest,
      yearSchedulesRequest,
      badgesRequest
    ])

    // --- 데이터 가공 ---

    // 1. 통계 계산
    let attendedCount = 0
    let wins = 0, draws = 0, losses = 0

    yearSchedules.forEach((schedule: any) => {
      const isAttended = schedule.attendances.length > 0
      if (isAttended) attendedCount++

      // 전적 계산 (내전인 경우만 or A매치 포함? -> 기존 로직은 internal만 승패 계산)
      if (isAttended && schedule.type === 'internal' && schedule.teamFormation &&
        schedule.ourScore !== null && schedule.opponentScore !== null) {

        const formation: any = schedule.teamFormation
        const yellowTeam = formation.yellowTeam || []
        const blueTeam = formation.blueTeam || []
        const isOnYellow = yellowTeam.some((p: any) => p.userId === userId)
        const isOnBlue = blueTeam.some((p: any) => p.userId === userId)

        if (isOnYellow) {
          if (schedule.ourScore > schedule.opponentScore) wins++
          else if (schedule.ourScore === schedule.opponentScore) draws++
          else losses++
        } else if (isOnBlue) {
          if (schedule.opponentScore > schedule.ourScore) wins++
          else if (schedule.opponentScore === schedule.ourScore) draws++
          else losses++
        }
      }
    })

    const totalYearSchedules = yearSchedules.length
    const attendanceRate = totalYearSchedules > 0 ? (attendedCount / totalYearSchedules) * 100 : 0

    // 2. 다음 일정 가공
    let formattedNextSchedule = null
    if (nextSchedule) {
      // 현재 사용자의 참석 상태 찾기 (attendances 배열에는 현재 사용자 것만 있음)
      const myAttendance = nextSchedule.attendances?.[0]

      // 비정규화된 통계 필드 사용 (성능 최적화)
      const schedule = nextSchedule as any

      formattedNextSchedule = {
        ...nextSchedule,
        // KST 기준 날짜 변환 (UTC+9)
        date: new Date(nextSchedule.matchDate.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: nextSchedule.startTime,
        // 현재 사용자의 참석 상태
        myAttendance: myAttendance?.status || 'PENDING',
        // 참석 통계 (비정규화된 필드 사용)
        attendanceStats: {
          attending: schedule.attendingCount ?? 0,
          notAttending: schedule.notAttendingCount ?? 0,
          pending: schedule.pendingCount ?? 0,
          total: (schedule.attendingCount ?? 0) + (schedule.notAttendingCount ?? 0) + (schedule.pendingCount ?? 0)
        }
      }
    }

    // 3. 최근 경기 가공
    const formattedRecentMatches = recentMatches.map((match: any) => {
      let result = undefined
      // 승패 계산 로직 (위와 동일) - 함수로 분리하면 좋음
      if (match.type === 'internal' && match.teamFormation &&
        match.ourScore !== null && match.opponentScore !== null) {
        // ... (승패 로직)
        const formation: any = match.teamFormation
        const yellowTeam = formation.yellowTeam || []
        const blueTeam = formation.blueTeam || []
        const isOnYellow = yellowTeam.some((p: any) => p.userId === userId)
        const isOnBlue = blueTeam.some((p: any) => p.userId === userId)

        if (isOnYellow) {
          if (match.ourScore > match.opponentScore) result = 'win'
          else if (match.ourScore === match.opponentScore) result = 'draw'
          else result = 'loss'
        } else if (isOnBlue) {
          if (match.opponentScore > match.ourScore) result = 'win'
          else if (match.opponentScore === match.ourScore) result = 'draw'
          else result = 'loss'
        }
      }

      return {
        id: match.id,
        date: match.matchDate.toISOString().split('T')[0],
        location: match.location,
        type: match.type,
        result
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        nextSchedule: formattedNextSchedule,
        stats: {
          attendance: {
            attended: attendedCount,
            total: totalYearSchedules,
            rate: attendanceRate
          },
          matches: {
            wins, draws, losses,
            total: wins + draws + losses
          }
        },
        recentMatches: formattedRecentMatches,
        badges: userBadges
      }
    })

  } catch (error) {
    console.error('대시보드 데이터 조회 실패:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
