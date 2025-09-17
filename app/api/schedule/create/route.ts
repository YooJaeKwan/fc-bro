import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('일정 등록 요청:', body)

    const {
      title,
      type,
      date,
      time,
      gatherTime,
      location,
      quarterTime = 25,
      restTime = 5,
      description = "",
      opponentTeam = null,
      trainingContent = null,
      createdBy
    } = body

    // 필수 필드 검증 (title 제거)
    if (!type || !date || !time || !gatherTime || !location || !createdBy) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 유형별 추가 필드 검증
    if (type === "match" && !opponentTeam) {
      return NextResponse.json(
        { error: 'A매치의 경우 상대팀명이 필요합니다.' },
        { status: 400 }
      )
    }

    if (type === "training" && !trainingContent) {
      return NextResponse.json(
        { error: '연습의 경우 연습 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 유효한 일정 유형인지 확인
    const validTypes = ['internal', 'match', 'training']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 일정 유형입니다.' },
        { status: 400 }
      )
    }

    // 과거 날짜 검증 (한국시간 기준)
    const [year, month, day] = date.split('-')
    const [hour, minute] = time.split(':')
    const inputDateTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))

    if (inputDateTime < new Date()) {
      return NextResponse.json(
        { error: '과거 날짜로는 일정을 등록할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 생성자 사용자 존재 확인
    const creator = await prisma.user.findUnique({
      where: { id: createdBy }
    })

    if (!creator) {
      return NextResponse.json(
        { error: '유효하지 않은 사용자입니다.' },
        { status: 404 }
      )
    }

    // 장소 + 시간으로 제목 자동 생성
    const autoTitle = `${location}\n${time}`

    // 새 일정 생성
    const newSchedule = await prisma.schedule.create({
      data: {
        title: autoTitle,
        type,
        matchDate: inputDateTime, // DateTime으로 저장
        startTime: time,
        gatherTime,
        location: location.trim(),
        quarterTime: Number(quarterTime),
        restTime: Number(restTime),
        description: description.trim() || null,
        opponentTeam: opponentTeam?.trim() || null,
        trainingContent: trainingContent?.trim() || null,
        createdBy,
        status: "SCHEDULED"
      },
      include: {
        creator: {
          select: {
            id: true,
            realName: true,
            nickname: true
          }
        }
      }
    })

    console.log('새 일정 생성 완료:', newSchedule.id)

    return NextResponse.json({
      success: true,
      message: '일정이 성공적으로 등록되었습니다.',
      schedule: {
        id: newSchedule.id,
        title: newSchedule.title,
        type: newSchedule.type,
        date: newSchedule.matchDate.toISOString().split('T')[0],
        time: newSchedule.startTime,
        gatherTime: newSchedule.gatherTime,
        location: newSchedule.location,
        quarterTime: newSchedule.quarterTime,
        restTime: newSchedule.restTime,
        description: newSchedule.description,
        opponentTeam: newSchedule.opponentTeam,
        trainingContent: newSchedule.trainingContent,
        status: newSchedule.status,
        createdBy: {
          id: newSchedule.creator.id,
          name: newSchedule.creator.realName || newSchedule.creator.nickname
        },
        createdAt: newSchedule.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('일정 등록 중 오류:', error)
    
    return NextResponse.json(
      { error: '일정 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
