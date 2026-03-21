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

    // 2. 다음 일정 (가장 가까운 미래 일정 1개)
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
        attendances: {
          select: {
            userId: true,
            status: true,
            isGuest: true
          }
        }
      }
    })

    // 3. 최근 경기
    const recentMatchesRequest = prisma.schedule.findMany({
      where: {
        matchDate: {
          lt: tomorrow
        },
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

    // 4. 올해 통계 계산용
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)

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
            status: { in: ['ATTENDING', 'NO_SHOW'] }
          }
        }
      }
    })

    // 5. 뱃지 정보
    const badgesRequest = prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    })

    // 6. 사용자 정보
    const userRequest = prisma.user.findUnique({
      where: { id: userId }
    })

    // 병렬 실행
    const [activeUserCount, upcomingSchedules, recentMatches, allYearSchedules, userBadges, userInfo] = await Promise.all([
      activeUserCountRequest,
      upcomingSchedulesRequest,
      recentMatchesRequest,
      yearSchedulesRequest,
      badgesRequest,
      userRequest
    ])

    const userJoinDate = userInfo?.createdAt ? new Date(userInfo.createdAt) : yearStart

    // 가입일 이후의 완료된 경기만 필터링
    const yearSchedules = allYearSchedules.filter((s: any) => {
      if (s.status !== 'COMPLETED') return false
      return new Date(s.matchDate) >= userJoinDate
    })

    // 다음 일정 찾기
    const nextSchedule = upcomingSchedules.find((schedule: any) => {
      const matchDateTime = new Date(schedule.matchDate.getTime())
      const [hours, minutes] = (schedule.startTime || '23:59').split(':').map(Number)
      matchDateTime.setUTCHours(hours - 9, minutes, 0, 0)
      return matchDateTime > now
    }) || null

    // --- 통계 계산 ---
    let attendedCount = 0
    let wins = 0, draws = 0, losses = 0
    let goals = 0, assists = 0, cleanSheets = 0, noShowCount = 0
    const defensivePositions = ['DC', 'DR', 'DL', 'DRL', 'DRLC', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'GK']
    const isDefender = defensivePositions.includes(userInfo?.preferredPosition?.toUpperCase() || '')

    yearSchedules.forEach((schedule: any) => {
      const myAttendance = schedule.attendances.find((a: any) => a.userId === userId)
      const isAttended = myAttendance?.status === 'ATTENDING'
      const isNoShow = myAttendance?.status === 'NO_SHOW'
      
      if (isAttended) attendedCount++
      if (isNoShow) noShowCount++

      if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
        schedule.goalRecords.forEach((goal: any) => {
          if (goal.scorerId === userId) goals++
          if (goal.assistId === userId) assists++
        })
      }

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

          if (isDefender) {
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
              const goalsArr = schedule.goalRecords as any[]
              const blueGoals = goalsArr.filter(g => (g.team === 'blue' || g.team === 'away')).length
              if (blueGoals === 0 && schedule.opponentScore === 0) {
                 // Full Clean Sheet
                 cleanSheets += 4 
              } else if (schedule.opponentScore === blueGoals) {
                 for (let q = 1; q <= 4; q++) {
                   if (!goalsArr.some(g => (g.team === 'blue' || g.team === 'away') && g.quarter === q)) cleanSheets++
                 }
              }
            }
          }
        } else if (isOnBlue) {
          if (schedule.opponentScore > schedule.ourScore) wins++
          else if (schedule.opponentScore === schedule.ourScore) draws++
          else losses++

          if (isDefender) {
            if (schedule.goalRecords && Array.isArray(schedule.goalRecords)) {
              const goalsArr = schedule.goalRecords as any[]
              const yellowGoals = goalsArr.filter(g => (g.team === 'yellow' || g.team === 'home')).length
              if (yellowGoals === 0 && schedule.ourScore === 0) {
                 cleanSheets += 4
              } else if (schedule.ourScore === yellowGoals) {
                 for (let q = 1; q <= 4; q++) {
                   if (!goalsArr.some(g => (g.team === 'yellow' || g.team === 'home') && g.quarter === q)) cleanSheets++
                 }
              }
            }
          }
        }
      }
    })

    const totalYearSchedules = yearSchedules.length
    const attendanceRate = totalYearSchedules > 0 ? (attendedCount / totalYearSchedules) * 100 : 0

    // --- 뱃지 자동 부여 로직 ---
    const milestoneBadges = []
    
    // 1. 기본/출석 관련
    if (userId) milestoneBadges.push('ROOKIE_MEMBER')
    if (attendedCount >= 1) milestoneBadges.push('FIRST_MATCH')
    if (attendedCount >= 5) milestoneBadges.push('ATTENDANCE_5')
    if (attendedCount >= 10) milestoneBadges.push('ATTENDANCE_10')
    if (attendedCount >= 20) milestoneBadges.push('ATTENDANCE_20')
    
    // 2. 승무패 관련
    if (wins >= 1) milestoneBadges.push('FIRST_WIN')
    if (draws >= 1) milestoneBadges.push('FIRST_DRAW')
    if (losses >= 1) milestoneBadges.push('FIRST_LOSS')
    if (wins >= 10) milestoneBadges.push('WIN_10')
    if (wins >= 20) milestoneBadges.push('WIN_20')
    
    // 3. 실적 관련
    if (goals >= 5) milestoneBadges.push('GOAL_5')
    if (goals >= 10) milestoneBadges.push('GOAL_10')
    if (assists >= 5) milestoneBadges.push('ASSIST_5')
    if (assists >= 10) milestoneBadges.push('ASSIST_10')
    if (cleanSheets >= 5) milestoneBadges.push('CLEAN_SHEET_5')
    if (cleanSheets >= 10) milestoneBadges.push('CLEAN_SHEET_10')

    // 뱃지 지급 처리
    const newlyAwardedBadges = []
    if (milestoneBadges.length > 0) {
      const existingBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true }
      })
      
      const existingCodes = new Set(existingBadges.map(ub => ub.badge.code))
      const newBadgeCodes = milestoneBadges.filter(code => !existingCodes.has(code))
      
      if (newBadgeCodes.length > 0) {
        const badgesToAssign = await prisma.badge.findMany({
          where: { code: { in: newBadgeCodes } }
        })
        
        for (const b of badgesToAssign) {
          const newBadge = await prisma.userBadge.create({
            data: {
              userId,
              badgeId: b.id
            },
            include: { badge: true }
          }).catch(() => null)
          if (newBadge) newlyAwardedBadges.push(newBadge.badge)
        }
      }
    }

    // 최신 뱃지 목록 다시 가져오기
    const updatedUserBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    })

    // 미확인(unacknowledged) 뱃지 목록 (방금 지급된 것 포함)
    const unacknowledgedBadges = updatedUserBadges
      .filter(ub => !ub.acknowledged)
      .map(ub => ub.badge)

    // 다음 일정 가공
    let formattedNextSchedule = null
    if (nextSchedule) {
      const attendances = nextSchedule.attendances || []
      const attendingCount = attendances.filter((a: any) => a.status === 'ATTENDING').length
      const notAttendingCount = attendances.filter((a: any) => a.status === 'NOT_ATTENDING').length
      const votedUserCount = attendances.filter((a: any) => !a.isGuest && (a.status === 'ATTENDING' || a.status === 'NOT_ATTENDING')).length
      const pendingCount = Math.max(0, activeUserCount - votedUserCount)
      const myAttendance = attendances.find((a: any) => a.userId === userId)

      formattedNextSchedule = {
        ...nextSchedule,
        date: new Date(nextSchedule.matchDate.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: nextSchedule.startTime,
        myAttendance: myAttendance?.status || 'PENDING',
        attendanceStats: {
          attending: attendingCount,
          notAttending: notAttendingCount,
          pending: pendingCount,
          total: attendingCount + notAttendingCount + pendingCount
        }
      }
    }

    // 최근 경기 가공
    const formattedRecentMatches = recentMatches
      .filter((match: any) => {
        const matchDateTime = new Date(match.matchDate.getTime())
        const [hours, minutes] = (match.startTime || '00:00').split(':').map(Number)
        matchDateTime.setUTCHours(hours - 9, minutes, 0, 0)
        return matchDateTime <= now
      })
      .slice(0, 3)
      .map((match: any) => {
        let matchResult = undefined
        if (match.type === 'internal' && match.teamFormation &&
          match.ourScore !== null && match.opponentScore !== null) {
          const formation: any = match.teamFormation
          const yellowTeam = formation.yellowTeam || []
          const blueTeam = formation.blueTeam || []
          const isOnYellow = yellowTeam.some((p: any) => p.userId === userId)
          const isOnBlue = blueTeam.some((p: any) => p.userId === userId)

          if (isOnYellow) {
            if (match.ourScore > match.opponentScore) matchResult = 'win'
            else if (match.ourScore === match.opponentScore) matchResult = 'draw'
            else matchResult = 'loss'
          } else if (isOnBlue) {
            if (match.opponentScore > match.ourScore) matchResult = 'win'
            else if (match.opponentScore === match.ourScore) matchResult = 'draw'
            else matchResult = 'loss'
          }
        }

        return {
          id: match.id,
          date: match.matchDate.toISOString().split('T')[0],
          location: match.location,
          type: match.type,
          result: matchResult
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        user: userInfo,
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
            goals, assists, cleanSheets, noShowCount
          }
        },
        recentMatches: formattedRecentMatches,
        badges: updatedUserBadges,
        newBadges: unacknowledgedBadges
      }
    })

  } catch (error) {
    console.error('대시보드 데이터 조회 실패:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
