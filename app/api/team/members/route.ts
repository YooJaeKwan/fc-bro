import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('팀원 목록 조회 요청')

    // 모든 사용자 조회 (실제로는 특정 팀의 멤버만 조회해야 하지만 현재는 전체 사용자)
    const teamMembers = await prisma.user.findMany({
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
        image: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`팀원 ${teamMembers.length}명 조회 완료`)

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

    // 클라이언트에 전송할 데이터 구성
    const membersWithTempData = teamMembers.map((member, index) => {
      const tempSkills = generateTempSkills(member.preferredPosition || "MC")
      const overallRating = calculateOverallRating(tempSkills)

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
        profileImage: member.image,
        joinDate: member.createdAt.toLocaleDateString('ko-KR'),
        attendanceRate: Math.floor(Math.random() * 30) + 70, // 70-100% 랜덤
        skills: tempSkills,
        overallRating
      }
    })

    return NextResponse.json({
      success: true,
      members: membersWithTempData,
      count: membersWithTempData.length
    })

  } catch (error) {
    console.error('팀원 목록 조회 중 오류:', error)
    
    return NextResponse.json(
      { error: '팀원 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
