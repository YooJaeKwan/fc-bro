
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

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ourScore: ourScore !== undefined && ourScore !== "" ? Number(ourScore) : null,
        opponentScore: opponentScore !== undefined && opponentScore !== "" ? Number(opponentScore) : null,
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
