
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
          goalRecords: goals && Array.isArray(goals) ? goals.filter((g: GoalRecord) => g.scorerId) : Prisma.DbNull,
          status: "COMPLETED",
        },
      })

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
