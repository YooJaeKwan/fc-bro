import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({
      success: true,
      message: '참석 투표가 등록되었습니다.',
      attendance: {
        scheduleId: attendance.scheduleId,
        userId: attendance.userId,
        status: attendance.status,
        user: {
          name: attendance.user.realName || attendance.user.nickname,
          position: attendance.user.preferredPosition
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

    if (!scheduleId) {
      return NextResponse.json(
        { error: '일정 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('참석자 목록 조회:', scheduleId)

    // 해당 일정의 참석자 목록 조회
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
            image: true
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
        image: true
      }
    })

    // 참석 투표 데이터와 전체 사용자 데이터 병합
    const attendeeList = allUsers.map(user => {
      const attendance = attendances.find(att => att.userId === user.id)
      
      // 임시 능력치 생성 (포지션 기반)
      const generateTempRating = (position: string) => {
        const baseRating = Math.random() * 2 + 6 // 6.0-8.0
        return Number(baseRating.toFixed(1))
      }

      return {
        userId: user.id,
        name: user.realName || user.nickname || '이름 없음',
        position: user.preferredPosition || 'MC',
        status: attendance?.status.toLowerCase() || 'pending',
        rating: generateTempRating(user.preferredPosition || 'MC'),
        profileImage: user.image,
        updatedAt: attendance?.updatedAt.toISOString() || null
      }
    })

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
