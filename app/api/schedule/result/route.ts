
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
    const { scheduleId, ourScore, opponentScore, matchSummary, mvpUserId, matchPhotoUrl, goals } = body

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

    // 경기 시작 시간 체크 (경기 시작 이후에만 입력 가능)
    const now = new Date()
    const matchDate = new Date(schedule.matchDate)
    const [hours, minutes] = (schedule.startTime || "19:00").split(':')
    matchDate.setHours(Number(hours), Number(minutes), 0, 0)

    if (matchDate > now) {
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

      // 2. SchedulePlayerStat에 개인 골/도움 기록 반영
      // 먼저 기존 기록 삭제 (결과 수정 시 중복 방지)
      await tx.schedulePlayerStat.deleteMany({
        where: { scheduleId }
      })

      // 골/도움 집계
      const playerStatsMap: Record<string, { goals: number; assists: number }> = {}
      
      for (const goal of validGoals) {
        // 득점자 (자책골 제외)
        if (goal.scorerId && goal.scorerId !== 'own_goal') {
          if (!playerStatsMap[goal.scorerId]) {
            playerStatsMap[goal.scorerId] = { goals: 0, assists: 0 }
          }
          playerStatsMap[goal.scorerId].goals += 1
        }
        // 어시스트
        if (goal.assistId && goal.assistId !== 'none' && goal.assistId !== '') {
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
        ourScore: true,
        opponentScore: true,
        mvpUserId: true,
        matchSummary: true,
        matchPhotoUrl: true,
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
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      result: schedule,
    })
  } catch (error) {
    console.error("경기 결과 조회 중 오류 발생:", error)
    return NextResponse.json(
      { error: "경기 결과 조회 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
