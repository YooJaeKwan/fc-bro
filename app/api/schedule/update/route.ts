import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('일정 수정 요청:', body)

    const {
      scheduleId,
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
      userId // 수정 권한 확인용
    } = body

    // 필수 필드 검증
    if (!scheduleId || !type || !date || !time || !gatherTime || !location || !userId) {
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

    // 일정 존재 확인
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        creator: true
      }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: '존재하지 않는 일정입니다.' },
        { status: 404 }
      )
    }

    // 수정 권한 확인 (총무만 수정 가능)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '일정을 수정할 권한이 없습니다. 총무만 일정을 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 한국시간을 명시적으로 지정하여 DateTime 생성
    const kstDateTime = new Date(`${date}T${time}:00.000+09:00`)
    
    if (kstDateTime < new Date()) {
      return NextResponse.json(
        { error: '과거 날짜로는 일정을 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 유형에 따른 제목 자동 생성
    let autoTitle = ""
    switch (type) {
      case "internal":
        autoTitle = "자체경기"
        break
      case "match":
        autoTitle = `vs ${opponentTeam}`
        break
      case "training":
        autoTitle = `연습 - ${trainingContent}`
        break
    }

    // 일정 정보 업데이트
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        title: autoTitle,
        type,
        matchDate: kstDateTime, // DateTime으로 저장
        startTime: time,
        gatherTime,
        location: location.trim(),
        quarterTime: Number(quarterTime),
        restTime: Number(restTime),
        description: description.trim() || null,
        opponentTeam: opponentTeam?.trim() || null,
        trainingContent: trainingContent?.trim() || null,
        updatedAt: new Date()
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

    console.log('일정 수정 완료:', updatedSchedule.id)

    return NextResponse.json({
      success: true,
      message: '일정이 성공적으로 수정되었습니다.',
      schedule: {
        id: updatedSchedule.id,
        title: updatedSchedule.title,
        type: updatedSchedule.type,
        date: updatedSchedule.matchDate.toISOString().split('T')[0],
        time: updatedSchedule.startTime,
        gatherTime: updatedSchedule.gatherTime,
        location: updatedSchedule.location,
        quarterTime: updatedSchedule.quarterTime,
        restTime: updatedSchedule.restTime,
        description: updatedSchedule.description,
        opponentTeam: updatedSchedule.opponentTeam,
        trainingContent: updatedSchedule.trainingContent,
        status: updatedSchedule.status,
        createdBy: {
          id: updatedSchedule.creator.id,
          name: updatedSchedule.creator.realName || updatedSchedule.creator.nickname
        },
        updatedAt: updatedSchedule.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('일정 수정 중 오류:', error)
    
    return NextResponse.json(
      { error: '일정 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
