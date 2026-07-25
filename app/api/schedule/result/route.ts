
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

interface GoalRecord {
  scorerId: string
  scorerName: string
  assistId?: string
  assistName?: string
  team: 'yellow' | 'blue' | 'home' | 'away'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { scheduleId, ourScore, opponentScore, matchSummary, mvpUserId, matchPhotoUrl, goals, noShowUserIds } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: "일정 ID가 필요합니다." },
        { status: 400 }
      )
    }

    // 일정 정보 확인
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { matchDate: true, startTime: true }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 })
    }

    // 경기 시작 시간 체크 (한국 시간 기준)
    const now = new Date()
    
    // DB에 저장된 날짜(matchDate)에서 날짜 문자열(YYYY-MM-DD) 추출
    // Asia/Seoul 시간대 기준의 날짜를 가져와서 합침
    const dateStr = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Seoul', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(schedule.matchDate)
    
    const startTimeStr = schedule.startTime || "19:00"
    const matchTimeKst = new Date(`${dateStr}T${startTimeStr}:00.000+09:00`)

    if (matchTimeKst > now) {
      return NextResponse.json({ error: "경기 시작 이후에만 결과를 입력할 수 있습니다." }, { status: 400 })
    }

    // 유효한 골 기록만 필터링
    const validGoals = goals && Array.isArray(goals) ? goals.filter((g: GoalRecord) => g.scorerId) : []

    // 트랜잭션으로 경기 결과와 골 기록 저장
    const result = await prisma.$transaction(async (tx) => {
      // 1. 경기 결과 저장 (골 기록은 JSON으로 저장)
      const updatedSchedule = await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          ourScore: ourScore !== undefined && ourScore !== null ? Number(ourScore) : 0,
          opponentScore: opponentScore !== undefined && opponentScore !== null ? Number(opponentScore) : 0,
          matchSummary: matchSummary || null,
          mvpUserId: mvpUserId || null,
          matchPhotoUrl: matchPhotoUrl || null,
          goalRecords: validGoals.length > 0 ? validGoals : Prisma.DbNull,
          status: "COMPLETED",
        },
      })

      // 2. 노쇼 처리 (ScheduleAttendance 업데이트 - 팀원 및 게스트 모두 대응)
      const noShowUserList = (noShowUserIds && Array.isArray(noShowUserIds)) ? noShowUserIds : []
      const noShowMemberIds = noShowUserList.filter((id: string) => id && !id.startsWith('guest_'))
      const noShowGuestIds = noShowUserList.filter((id: string) => id && id.startsWith('guest_'))

      // 기존 NO_SHOW 상태였다가 해제된 인원은 ATTENDING으로 복구
      await tx.scheduleAttendance.updateMany({
        where: {
          scheduleId,
          status: { in: ['NO_SHOW', 'no_show'] },
          userId: { notIn: noShowMemberIds }
        },
        data: { status: 'ATTENDING' }
      })

      await tx.scheduleAttendance.updateMany({
        where: {
          scheduleId,
          status: { in: ['NO_SHOW', 'no_show'] },
          guestId: { notIn: noShowGuestIds }
        },
        data: { status: 'ATTENDING' }
      })

      // 지정된 인원 NO_SHOW 처리
      if (noShowMemberIds.length > 0) {
        await tx.scheduleAttendance.updateMany({
          where: {
            scheduleId,
            userId: { in: noShowMemberIds }
          },
          data: { status: 'NO_SHOW' }
        })
      }

      if (noShowGuestIds.length > 0) {
        await tx.scheduleAttendance.updateMany({
          where: {
            scheduleId,
            guestId: { in: noShowGuestIds }
          },
          data: { status: 'NO_SHOW' }
        })
      }

      // 3. SchedulePlayerStat에 개인 골/도움 기록 반영
      // 먼저 기존 기록 삭제 (결과 수정 시 중복 방지)
      await tx.schedulePlayerStat.deleteMany({
        where: { scheduleId }
      })

      // 골/도움 집계
      const playerStatsMap: Record<string, { goals: number; assists: number }> = {}
      
      for (const goal of validGoals) {
        // 득점자 (자책골 및 게스트 제외)
        if (goal.scorerId && goal.scorerId !== 'own_goal' && !goal.scorerId.startsWith('guest_')) {
          if (!playerStatsMap[goal.scorerId]) {
            playerStatsMap[goal.scorerId] = { goals: 0, assists: 0 }
          }
          playerStatsMap[goal.scorerId].goals += 1
        }
        // 어시스트 (없음 및 게스트 제외)
        if (goal.assistId && goal.assistId !== 'none' && goal.assistId !== '' && !goal.assistId.startsWith('guest_')) {
          if (!playerStatsMap[goal.assistId]) {
            playerStatsMap[goal.assistId] = { goals: 0, assists: 0 }
          }
          playerStatsMap[goal.assistId].assists += 1
        }
      }

      // SchedulePlayerStat 레코드 생성
      const statEntries = Object.entries(playerStatsMap)
      if (statEntries.length > 0) {
        await tx.schedulePlayerStat.createMany({
          data: statEntries.map(([usrId, stat]) => ({
            scheduleId,
            userId: usrId,
            goals: stat.goals,
            assists: stat.assists,
          }))
        })
      }

      return updatedSchedule
    })

    return NextResponse.json({
      success: true,
      schedule: result,
    })
  } catch (error) {
    console.error("경기 결과 입력 중 오류 발생:", error)
    return NextResponse.json(
      { error: "경기 결과 입력 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 경기 결과 조회 (골/도움/MVP 포함)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: "일정 ID가 필요합니다." }, { status: 400 })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: {
        title: true,
        matchDate: true,
        startTime: true,
        type: true,
        status: true,
        ourScore: true,
        opponentScore: true,
        mvpUserId: true,
        matchSummary: true,
        matchPhotoUrl: true,
        goalRecords: true,
        teamFormation: true,
        playerStats: {
          select: {
            userId: true,
            goals: true,
            assists: true,
            user: {
              select: {
                realName: true,
                nickname: true,
              }
            }
          }
        },
        attendances: {
          select: {
            userId: true,
            guestId: true,
            status: true,
            guestName: true,
            user: {
              select: {
                realName: true,
                nickname: true,
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      schedule: {
        ...schedule,
        date: schedule.matchDate.toISOString().split('T')[0],
        time: schedule.startTime,
        attendees: schedule.attendances // 필드명 동기화
      },
    })
  } catch (error) {
    console.error("경기 결과 조회 중 오류 발생:", error)
    return NextResponse.json(
      { error: "경기 결과 조회 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
