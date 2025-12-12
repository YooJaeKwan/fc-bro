import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export async function GET() {
  try {
    console.log('대시보드 통계 데이터 조회 요청')

    // 1. 팀원 통계
    const totalMembers = await prisma.user.count()
    
    // 2. 다가오는 일정 조회 (가장 빠른 일정 1개)
    const upcomingSchedule = await prisma.schedule.findFirst({
      where: {
        matchDate: {
          gte: new Date()
        },
        status: 'SCHEDULED'
      },
      orderBy: {
        matchDate: 'asc'
      },
      include: {
        attendances: {
          include: {
            user: {
              select: {
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

    // 3. 전체 참석률 계산 (모든 일정의 평균 참석률)
    const allSchedules = await prisma.schedule.findMany({
      include: {
        attendances: true
      }
    })

    let totalAttendanceRate = 0
    if (allSchedules.length > 0) {
      const attendanceRates = allSchedules.map(schedule => {
        const totalAttendances = schedule.attendances.length
        const actualAttendances = schedule.attendances.filter(a => a.status === 'ATTENDING').length
        
        if (totalAttendances === 0) return 0
        return (actualAttendances / totalAttendances) * 100
      })

      totalAttendanceRate = Math.round(
        attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length
      )
    }

    // 4. 최근 활동한 팀원 수 (지난 30일 내 일정 참석 투표한 사용자)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeMembers = await prisma.scheduleAttendance.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    })

    // 5. 개별 사용자 참석률 계산 (우수 출석왕용)
    const userAttendanceStats = await prisma.user.findMany({
      include: {
        scheduleAttendances: {
          include: {
            schedule: true
          }
        }
      }
    })

    const topAttendancePlayers = userAttendanceStats
      .map(user => {
        const totalSchedules = user.scheduleAttendances.length
        const attendedSchedules = user.scheduleAttendances.filter(a => a.status === 'ATTENDING').length
        
        const attendanceRate = totalSchedules > 0 ? Math.round((attendedSchedules / totalSchedules) * 100) : 0
        
        return {
          name: user.realName || user.nickname || '이름 없음',
          position: user.preferredPosition || 'MC',
          attendanceRate,
          totalMatches: totalSchedules,
          userId: user.id
        }
      })
      .filter(player => player.totalMatches > 0) // 참여한 일정이 있는 사용자만
      .sort((a, b) => b.attendanceRate - a.attendanceRate) // 참석률 높은 순
      .slice(0, 5) // 상위 5명

    // 6. 다가오는 일정 정보 구성
    let upcomingMatchInfo = null
    if (upcomingSchedule) {
      const matchDate = new Date(upcomingSchedule.matchDate)
      const today = new Date()
      const diffTime = matchDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const attendees = upcomingSchedule.attendances.filter(a => a.status === 'ATTENDING').length
      const totalInvited = upcomingSchedule.attendances.length

      // 참석자 세부 정보 구성
      const attendeesList = upcomingSchedule.attendances.map(attendance => {
        // 게스트인 경우
        if (attendance.isGuest) {
          return {
            userId: attendance.guestId || attendance.userId,
            name: attendance.guestName || '게스트',
            position: 'GUEST',
            subPositions: [],
            status: attendance.status.toLowerCase(),
            level: attendance.guestLevel || 7,
            isGuest: true
          }
        }
        // 일반 사용자인 경우
        return {
          userId: attendance.userId,
          name: attendance.user?.realName || attendance.user?.nickname || '이름 없음',
          position: attendance.user?.preferredPosition || 'MC',
          subPositions: attendance.user?.subPositions || [],
          status: attendance.status.toLowerCase(),
          level: attendance.user?.level || 1,
          isGuest: false
        }
      })

      upcomingMatchInfo = {
        id: upcomingSchedule.id,
        title: upcomingSchedule.title,
        date: upcomingSchedule.matchDate.toISOString().split('T')[0],
        time: upcomingSchedule.startTime,
        gatherTime: upcomingSchedule.gatherTime,
        location: upcomingSchedule.location,
        type: upcomingSchedule.type,
        daysLeft: diffDays,
        attendees: attendeesList, // 배열 형태로 변경
        total: Math.max(totalInvited, totalMembers),
        attendanceRate: totalInvited > 0 ? Math.round((attendees / totalInvited) * 100) : 0
      }
    }

    // 7. 최근 활동 데이터 생성
    const recentActivities = []

    // 최근 7일 내 새로 가입한 팀원들
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        realName: true,
        nickname: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    // 최근 가입자 활동 추가
    recentUsers.forEach(user => {
      recentActivities.push({
        type: 'user_joined',
        title: '새로운 팀원 등록',
        description: `${user.realName || user.nickname}님이 팀에 합류했습니다`,
        timestamp: user.createdAt,
        badge: '신규',
        color: 'blue'
      })
    })

    // 최근 7일 내 등록된 일정들
    const recentSchedules = await prisma.schedule.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        title: true,
        type: true,
        location: true,
        matchDate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    // 최근 일정 활동 추가
    recentSchedules.forEach(schedule => {
      const scheduleDate = format(schedule.matchDate, 'M월 d일', { locale: ko })
      recentActivities.push({
        type: 'schedule_created',
        title: `${scheduleDate} 일정 등록`,
        description: schedule.location,
        timestamp: schedule.createdAt,
        badge: schedule.type === 'internal' ? '자체경기' : schedule.type === 'match' ? 'A매치' : '연습',
        color: 'orange'
      })
    })

    // 최근 7일 내 완료된 일정들
    const completedSchedules = await prisma.schedule.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: sevenDaysAgo }
      },
      select: {
        title: true,
        type: true,
        location: true,
        matchDate: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 2
    })

    // 완료된 일정 활동 추가
    completedSchedules.forEach(schedule => {
      const scheduleDate = format(schedule.matchDate, 'M월 d일', { locale: ko })
      recentActivities.push({
        type: 'schedule_completed',
        title: `${scheduleDate} 일정 완료`,
        description: schedule.location,
        timestamp: schedule.updatedAt,
        badge: '완료',
        color: 'green'
      })
    })

    // 시간순으로 정렬하고 최대 5개까지
    const sortedActivities = recentActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    console.log('대시보드 통계 조회 완료:', {
      totalMembers,
      activeMembers: activeMembers.length,
      attendanceRate: totalAttendanceRate,
      upcomingMatch: upcomingMatchInfo?.title || '없음',
      topPlayers: topAttendancePlayers.length,
      recentActivities: sortedActivities.length
    })

    return NextResponse.json({
      success: true,
      data: {
        team: {
          name: "FC BRO",
          emblem: "/fc-bro-emblem.jpg",
          totalMembers,
          activeMembers: activeMembers.length,
          skillCategories: ["속도", "패스", "수비", "슈팅", "드리블", "체력", "멘탈"]
        },
        upcomingMatch: upcomingMatchInfo,
        recentStats: {
          attendanceRate: totalAttendanceRate,
          totalSchedules: allSchedules.length
        },
        topAttendancePlayers,
        recentActivities: sortedActivities
      }
    })

  } catch (error) {
    console.error('대시보드 통계 조회 중 오류:', error)
    
    return NextResponse.json(
      { error: '대시보드 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
