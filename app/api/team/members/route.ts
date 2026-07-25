import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('팀원 목록 조회 요청')

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const requesterId = searchParams.get('requesterId')

    // 요청자의 역할 확인
    let isAdmin = false
    if (requesterId) {
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true }
      })
      isAdmin = requester?.role === 'ADMIN'
    }

    // 활성 상태 필터링 조건 설정
    let whereClause: any = {}

    // 비활성화 사용자를 포함 여부 확인
    if (!includeInactive) {
      whereClause.isActive = true
    }

    // 모든 사용자 조회 (실제로는 특정 팀의 멤버만 조회해야 하지만 현재는 전체 사용자)
    const teamMembers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        realName: true,
        phoneNumber: true,
        preferredPosition: true,
        subPositions: true,
        region: true,
        city: true,
        preferredFoot: true,
        jerseyNumber: true,
        image: true,
        level: true, // 레벨 정보 추가
        role: true,  // 역할 정보 추가
        isActive: true, // 활성 상태 추가
        injuryStatus: true,
        injuryName: true,
        injuryStartDate: true,
        expectedReturnDate: true,
        injuryDetail: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`팀원 ${teamMembers.length}명 조회 완료, 데이터 처리 시작`)

    // 임시 능력치 데이터 생성 함수
    const generateTempSkills = (position: string) => {
      const baseSkills = {
        "속도": 5,
        "패스": 5,
        "수비": 5,
        "슈팅": 5,
        "드리블": 5,
        "체력": 5,
        "멘탈": 5
      }

      // 포지션별 특성 반영
      switch (position) {
        case "GK":
          return { ...baseSkills, "수비": 8, "멘탈": 8, "속도": 3, "드리블": 3 }
        case "DC":
          return { ...baseSkills, "수비": 8, "체력": 7, "멘탈": 7, "속도": 4 }
        case "DR":
        case "DL":
          return { ...baseSkills, "수비": 7, "속도": 7, "체력": 8, "패스": 6 }
        case "DM":
        case "CDM":
          return { ...baseSkills, "수비": 7, "패스": 7, "체력": 8, "멘탈": 7 }
        case "MC":
        case "CM":
          return { ...baseSkills, "패스": 8, "체력": 7, "멘탈": 7, "드리블": 6 }
        case "AMC":
        case "CAM":
          return { ...baseSkills, "패스": 8, "드리블": 7, "슈팅": 7, "창조력": 8 }
        case "ST":
        case "CF":
          return { ...baseSkills, "슈팅": 8, "속도": 7, "드리블": 6, "멘탈": 6 }
        case "LWF":
        case "RWF":
          return { ...baseSkills, "속도": 8, "드리블": 8, "슈팅": 6, "체력": 7 }
        default:
          return baseSkills
      }
    }

    const calculateOverallRating = (skills: any) => {
      const values = Object.values(skills).filter(v => typeof v === 'number') as number[]
      if (values.length === 0) return 5.0
      return Number((values.reduce((sum: number, val: number) => sum + val, 0) / values.length).toFixed(1))
    }

    // 현재 시간과 연도 범위
    const now = new Date()
    const currentYear = now.getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31)
    yearEnd.setHours(23, 59, 59, 999)

    console.log('=== 참석률 계산 범위 (과거 경기 기준) ===')
    console.log('현재 시간:', now.toISOString())
    console.log('연도 시작:', yearStart.toISOString())

    // 올해 전체 일정 수 조회
    let totalSchedulesThisYear = 0
    try {
      totalSchedulesThisYear = await prisma.schedule.count({
        where: {
          matchDate: {
            gte: yearStart,
            lte: now // 미래 경기는 제외
          },
          status: { not: 'CANCELLED' }
        }
      })
      console.log(`올해 전체 일정 수: ${totalSchedulesThisYear}`)

      // 디버깅: 모든 일정 확인
      const allSchedules = await prisma.schedule.findMany({
        select: {
          id: true,
          matchDate: true,
          title: true
        },
        orderBy: {
          matchDate: 'desc'
        },
        take: 10
      })
      console.log('최근 일정 10개:', allSchedules.map(s => ({
        title: s.title,
        date: s.matchDate.toISOString()
      })))
    } catch (scheduleCountError) {
      console.error('일정 수 조회 실패:', scheduleCountError)
      // 일정 수 조회 실패해도 계속 진행
    }

    console.log(`팀원 ${teamMembers.length}명 데이터 처리 시작`)

    // 성능 최적화: 모든 참석 정보를 한 번에 조회
    const memberIds = teamMembers.map(m => m.id).filter((id): id is string => id !== null)
    let attendanceMap: Map<string, { count: number; lastDate: string | null }> = new Map()

    if (memberIds.length > 0) {
      try {
        // 모든 멤버의 올해 참석 정보를 한 번에 조회
        const allAttendances = await prisma.scheduleAttendance.findMany({
          where: {
            userId: { in: memberIds },
            status: { in: ['ATTENDING', 'attending', 'ATTENDED', 'attended'] },
            schedule: {
              matchDate: {
                gte: yearStart,
                lte: now // 미래 경기는 제외
              },
              status: { not: 'CANCELLED' }
            }
          },
          select: {
            userId: true,
            schedule: {
              select: {
                matchDate: true
              }
            },
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        // 사용자별로 참석 정보 그룹화
        const userAttendanceGroups = new Map<string, Array<{ matchDate: Date; createdAt: Date }>>()

        for (const attendance of allAttendances) {
          if (!attendance.schedule?.matchDate || !attendance.userId) continue

          const userId = attendance.userId
          if (!userAttendanceGroups.has(userId)) {
            userAttendanceGroups.set(userId, [])
          }
          userAttendanceGroups.get(userId)!.push({
            matchDate: attendance.schedule.matchDate,
            createdAt: attendance.createdAt
          })
        }

        // 각 사용자별 참석 수와 최근 참석 날짜 계산
        for (const [userId, attendances] of userAttendanceGroups.entries()) {
          const count = attendances.length
          // 가장 최근 참석 날짜 (matchDate 기준)
          const sortedByMatchDate = [...attendances].sort((a, b) =>
            b.matchDate.getTime() - a.matchDate.getTime()
          )
          const lastDate = sortedByMatchDate.length > 0
            ? sortedByMatchDate[0].matchDate.toLocaleDateString('ko-KR')
            : null

          attendanceMap.set(userId, { count, lastDate })
        }
      } catch (attendanceError: any) {
        console.error('참석 정보 일괄 조회 실패:', attendanceError?.message)
        // 참석 정보 조회 실패해도 계속 진행
      }
    }

    // 클라이언트에 전송할 데이터 구성 (이제 비동기 작업 없음)
    const membersWithTempData = teamMembers.map((member) => {
      try {
        const tempSkills = generateTempSkills(member.preferredPosition || "CM")
        const overallRating = calculateOverallRating(tempSkills)

        // 메모리에서 참석 정보 가져오기
        const attendanceInfo = attendanceMap.get(member.id) || { count: 0, lastDate: null }
        const attendedCount = attendanceInfo.count
        const lastAttendedDate = attendanceInfo.lastDate

        const attendanceRate = totalSchedulesThisYear > 0
          ? Math.round((attendedCount / totalSchedulesThisYear) * 100)
          : 0

        return {
          id: member.id,
          name: member.realName || member.nickname || '이름 없음',
          nickname: member.nickname,
          mainPosition: member.preferredPosition || 'CM',
          subPositions: member.subPositions || [],
          phone: member.phoneNumber || '정보 없음',
          region: member.region || '정보 없음',
          city: member.city || '정보 없음',
          preferredFoot: member.preferredFoot,
          jerseyNumber: member.jerseyNumber,
          level: member.level || 1,
          role: member.role || 'MEMBER',
          isActive: member.isActive,
          injuryStatus: member.injuryStatus || 'HEALTHY',
          injuryName: member.injuryName,
          injuryStartDate: member.injuryStartDate,
          expectedReturnDate: member.expectedReturnDate,
          injuryDetail: member.injuryDetail,
          profileImage: member.image,
          joinDate: member.createdAt.toLocaleDateString('ko-KR'),
          attendanceRate,
          attendedCount,
          totalSchedules: totalSchedulesThisYear,
          lastAttendedDate,
          skills: tempSkills,
          overallRating
        }
      } catch (memberError: any) {
        console.error(`사용자 ${member.id} 데이터 처리 실패:`, memberError)
        // 개별 멤버 처리 실패 시 기본 데이터 반환
        return {
          id: member.id,
          name: member.realName || member.nickname || '이름 없음',
          nickname: member.nickname,
          mainPosition: member.preferredPosition || 'CM',
          subPositions: member.subPositions || [],
          phone: member.phoneNumber || '정보 없음',
          region: member.region || '정보 없음',
          city: member.city || '정보 없음',
          preferredFoot: member.preferredFoot,
          jerseyNumber: member.jerseyNumber,
          level: member.level || 1,
          role: member.role || 'MEMBER',
          isActive: member.isActive,
          profileImage: member.image,
          joinDate: member.createdAt.toLocaleDateString('ko-KR'),
          attendanceRate: 0,
          attendedCount: 0,
          totalSchedules: totalSchedulesThisYear,
          lastAttendedDate: null,
          skills: generateTempSkills(member.preferredPosition || "CM"),
          overallRating: 5.0
        }
      }
    })

    console.log(`팀원 데이터 처리 완료: ${membersWithTempData.length}명`)

    return NextResponse.json({
      success: true,
      members: membersWithTempData,
      count: membersWithTempData.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })

  } catch (error: any) {
    console.error('팀원 목록 조회 중 오류:', error)
    console.error('에러 상세:', error?.message)
    console.error('에러 스택:', error?.stack)

    return NextResponse.json(
      {
        error: '팀원 목록 조회 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
