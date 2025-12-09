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
    let whereClause: any = {
      // 기본 정보가 입력된 사용자만 조회
      realName: { not: null },
      phoneNumber: { not: null },
      preferredPosition: { not: null }
    }

    // 일반 사용자거나 총무가 비활성화 사용자를 포함하지 않는 경우
    if (!isAdmin || !includeInactive) {
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
          return { ...baseSkills, "수비": 7, "패스": 7, "체력": 8, "멘탈": 7 }
        case "MC":
          return { ...baseSkills, "패스": 8, "체력": 7, "멘탈": 7, "드리블": 6 }
        case "AMC":
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

    // 현재 연도의 시작일과 종료일
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    // 올해 전체 일정 수 조회
    let totalSchedulesThisYear = 0
    try {
      totalSchedulesThisYear = await prisma.schedule.count({
        where: {
          matchDate: {
            gte: yearStart,
            lte: yearEnd
          }
        }
      })
    } catch (scheduleCountError) {
      console.error('일정 수 조회 실패:', scheduleCountError)
      // 일정 수 조회 실패해도 계속 진행
    }

    console.log(`팀원 ${teamMembers.length}명 데이터 처리 시작`)

    // 클라이언트에 전송할 데이터 구성
    const membersWithTempData = await Promise.all(teamMembers.map(async (member, index) => {
      try {
        const tempSkills = generateTempSkills(member.preferredPosition || "MC")
        const overallRating = calculateOverallRating(tempSkills)

        // 해당 사용자의 올해 참석 투표 조회 (최적화: 필요한 필드만 조회)
        let attendedSchedules: any[] = []
        let attendedCount = 0
        let lastAttendedDate: string | null = null
        
        try {
          // 참석 정보를 한 번에 조회 (최신순으로 정렬)
          const attendanceData = await prisma.scheduleAttendance.findMany({
            where: {
              userId: member.id,
              status: 'ATTENDING',
              schedule: {
                matchDate: {
                  gte: yearStart,
                  lte: yearEnd
                }
              }
            },
            select: {
              schedule: {
                select: {
                  matchDate: true
                }
              }
            },
            take: 1, // 가장 최근 것만 가져오기 (lastAttendedDate용)
            orderBy: {
              createdAt: 'desc' // 생성일 기준으로 정렬
            }
          })

          // 전체 참석 수는 별도로 카운트
          attendedCount = await prisma.scheduleAttendance.count({
            where: {
              userId: member.id,
              status: 'ATTENDING',
              schedule: {
                matchDate: {
                  gte: yearStart,
                  lte: yearEnd
                }
              }
            }
          })

          // 가장 최근 참석한 경기 날짜
          if (attendanceData.length > 0 && attendanceData[0].schedule?.matchDate) {
            lastAttendedDate = attendanceData[0].schedule.matchDate.toLocaleDateString('ko-KR')
          }
        } catch (attendanceError: any) {
          console.error(`사용자 ${member.id}의 참석 정보 조회 실패:`, attendanceError?.message)
          // 참석 정보 조회 실패해도 계속 진행
        }

        const attendanceRate = totalSchedulesThisYear > 0 
          ? Math.round((attendedCount / totalSchedulesThisYear) * 100) 
          : 0

        return {
          id: member.id,
          name: member.realName || member.nickname || '이름 없음',
          nickname: member.nickname,
          mainPosition: member.preferredPosition || 'MC',
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
          mainPosition: member.preferredPosition || 'MC',
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
          skills: generateTempSkills(member.preferredPosition || "MC"),
          overallRating: 5.0
        }
      }
    }))

    console.log(`팀원 데이터 처리 완료: ${membersWithTempData.length}명`)

    return NextResponse.json({
      success: true,
      members: membersWithTempData,
      count: membersWithTempData.length
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
