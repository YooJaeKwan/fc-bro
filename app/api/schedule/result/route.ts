
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { scheduleId, ourScore, opponentScore, matchSummary, mvpUserId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: "일정 ID가 필요합니다." },
        { status: 400 }
      )
    }

    // 일정 정보 확인 (미래 일정인지 체크)
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { matchDate: true }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다." }, { status: 404 })
    }

    const now = new Date()
    // matchDate에 2시간을 더한 시간이 현재보다 미래라면 아직 입력 불가
    const matchEndTime = new Date(schedule.matchDate)
    matchEndTime.setHours(matchEndTime.getHours() + 2)

    if (matchEndTime > now) {
      return NextResponse.json({ error: "경기 시작 후 2시간이 지나야 결과를 입력할 수 있습니다." }, { status: 400 })
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ourScore: ourScore !== undefined && ourScore !== null ? Number(ourScore) : 0,
        opponentScore: opponentScore !== undefined && opponentScore !== null ? Number(opponentScore) : 0,
        matchSummary: matchSummary || null,
        mvpUserId: mvpUserId || null,
        status: "COMPLETED", // 결과 입력 시 완료 상태로 변경
      },
    })

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule,
    })
  } catch (error) {
    console.error("경기 결과 입력 중 오류 발생:", error)
    return NextResponse.json(
      { error: "경기 결과 입력 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
