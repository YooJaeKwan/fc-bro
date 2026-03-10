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
    const kstOffset = 9 * 60 * 60 * 1000

    // KST 기준 오늘 00:00를 UTC로 변환하여 DB 쿼리에 사용
    const today = new Date(now.getTime() + kstOffset)
    today.setUTCHours(0, 0, 0, 0)
    today.setTime(today.getTime() - kstOffset)

    // KST 기준 내일 00:00
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. 활성 회원 수 조회 (미응답 계산용)
    const activeUserCountRequest = prisma.user.count({
      where: { isActive: true }
    })

    // 2. 다음 일정 (가장 가까운 미래 일정 1개) - 시작 시간 기준으로 필터링
    // 오늘 이후 경기를 모두 가져와서 시작 시간이 지나지 않은 경기 중 가장 가까운 것 선택
    const upcomingSchedulesRequest = prisma.schedule.findMany({
      where: {
        matchDate: {
          gte: today
        }
      },
      orderBy: {
        matchDate: 'asc'
      },
      include: {
        // 모든 참석자 정보 조회 (게스트 포함)
        attendances: {
          select: {
            userId: true,
            status: true,
            isGuest: true
          }
        }
      }
    })

    // 3. 최근 경기 (과거 일정 3개 + 오늘 시작한 경기 포함)
    const recentMatchesRequest = prisma.schedule.findMany({
      where: {
        matchDate: {
          lt: tomorrow
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
      take: 10,
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
        status: true,
        matchDate: true,
        ourScore: true,
        opponentScore: true,
        goalRecords: true,
        mvpUserId: true,
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

    // 5. 사용자 정보 (가입일, 포지션)
    const userRequest = prisma.user.findUnique({
      where: { id: userId },
      select: { preferredPosition: true, createdAt: true }
    })

    // 병렬 실행
    const [activeUserCount, upcomingSchedules, recentMatches, allYearSchedules, userBadges, user] = await Promise.all([
      activeUserCountRequest,
      upcomingSchedulesRequest,
      recentMatchesRequest,
      yearSchedulesRequest,
      badgesRequest,
      userRequest
    ])

    const userJoinDate = user?.createdAt ? new Date(user.createdAt) : yearStart

    // 가입일 이후의 완료된 경기만 필터링
    const yearSchedules = allYearSchedules.filter((s: any) => {
      // 상태가 COMPLETED여야 함
      if (s.status !== 'COMPLETED') return false
      // 가입일 이후여야 함
      return new Date(s.matchDate) >= userJoinDate
    })

    // 시작 시간 기준으로 아직 시작하지 않은 경기 필터링
    const nextSchedule = upcomingSchedules.find((schedule: any) => {
      const matchDateTime = new Date(schedule.matchDate.getTime())
      const [hours, minutes] = (schedule.startTime || '23:59').split(':').map(Number)
      matchDateTime.setUTCHours(hours - 9, minutes, 0, 0)
      return matchDateTime > now
    }) || null

    // --- 데이터 가공 ---

    // 1. 통계 계산
    let attendedCount = 0
    let wins = 0, draws = 0, losses = 0

    // 4. 개인 상세 통계 (골, 도움, 클린시트)
    let goals = 0, assists = 0, cleanSheets = 0
    const defensivePositions = ['DC', 'DR', 'DL', 'DRL', 'DRLC', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'GK']
    const isDefender = defensivePositions.includes(user?.preferredPosition?.toUpperCase() || '')

    yearSchedules.forEach((schedule: any) => {
      const isAttended = schedule.attendances.length > 0
      if (isAttended) attendedCount++

      // 골/도움 계산
      if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
        schedule.goalRecords.forEach((goal: any) => {
          if (goal.scorerId === userId) goals++
          if (goal.assistId === userId) assists++
        })
      }

      // 전적 계산 및 클린시트 계산 (내전인 경우만)
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

          // 쿼터별 클린시트 계산
          if (isDefender) {
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
              const goals = schedule.goalRecords as any[]
              for (let q = 1; q <= 4; q++) {
                const blueScoredInQ = goals.some(g => (g.team === 'blue' || g.team === 'away') && g.quarter === q)
                if (!blueScoredInQ) cleanSheets++
              }
            } else if (schedule.opponentScore === 0) {
              cleanSheets += 4
            }
          }
        } else if (isOnBlue) {
          if (schedule.opponentScore > schedule.ourScore) wins++
          else if (schedule.opponentScore === schedule.ourScore) draws++
          else losses++

          // 쿼터별 클린시트 계산
          if (isDefender) {
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
              const goals = schedule.goalRecords as any[]
              for (let q = 1; q <= 4; q++) {
                const yellowScoredInQ = goals.some(g => (g.team === 'yellow' || g.team === 'home') && g.quarter === q)
                if (!yellowScoredInQ) cleanSheets++
              }
            } else if (schedule.ourScore === 0) {
              cleanSheets += 4
            }
          }
        }
      }
    })

    const totalYearSchedules = yearSchedules.length
    const attendanceRate = totalYearSchedules > 0 ? (attendedCount / totalYearSchedules) * 100 : 0

    // 2. 다음 일정 가공
    let formattedNextSchedule = null
    if (nextSchedule) {
      // 실시간 통계 계산
      const attendances = nextSchedule.attendances || []

      const attendingCount = attendances.filter((a: any) => a.status === 'ATTENDING').length
      const notAttendingCount = attendances.filter((a: any) => a.status === 'NOT_ATTENDING').length

      // 미응답 계산: 전체 활성 유저 - (투표한 유저 수)
      // 게스트는 미응답 카운트에 포함되지 않음
      const votedUserCount = attendances.filter((a: any) => !a.isGuest && (a.status === 'ATTENDING' || a.status === 'NOT_ATTENDING')).length
      const pendingCount = Math.max(0, activeUserCount - votedUserCount)

      // 현재 사용자의 참석 상태 찾기
      const myAttendance = attendances.find((a: any) => a.userId === userId)

      formattedNextSchedule = {
        ...nextSchedule,
        // KST 기준 날짜 변환 (UTC+9)
        date: new Date(nextSchedule.matchDate.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: nextSchedule.startTime,
        // 현재 사용자의 참석 상태
        myAttendance: myAttendance?.status || 'PENDING',
        // 실시간 계산된 통계 사용
        attendanceStats: {
          attending: attendingCount,
          notAttending: notAttendingCount,
          pending: pendingCount,
          total: attendingCount + notAttendingCount + pendingCount
        }
      }
    }

    // 3. 최근 경기 가공
    const formattedRecentMatches = recentMatches
      .filter((match: any) => {
        const matchDateTime = new Date(match.matchDate.getTime())
        const [hours, minutes] = (match.startTime || '00:00').split(':').map(Number)
        matchDateTime.setUTCHours(hours - 9, minutes, 0, 0)

        return matchDateTime <= now
      })
      .slice(0, 3)
      .map((match: any) => {
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
          },
          personal: {
            goals, assists, cleanSheets
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
