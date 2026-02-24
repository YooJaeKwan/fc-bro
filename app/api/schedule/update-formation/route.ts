import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPlayerLevelScore, getGuestLevelScore } from '@/lib/team-formation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, userId, teamFormation } = body

    if (!scheduleId || !userId || !teamFormation) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '팀편성 수정은 총무만 가능합니다.' },
        { status: 403 }
      )
    }

    const yellowTeam = teamFormation.yellowTeam || []
    const blueTeam = teamFormation.blueTeam || []
    const greenTeam = teamFormation.greenTeam || []

    const calculateStats = (team: any[]) => {
      const count = team.length
      if (count === 0) return { count: 0, averageScore: 0 }

      const sum = team.reduce((acc: number, p: any) => {
        const score = p.isGuest ? getGuestLevelScore(p.guestLevel) : getPlayerLevelScore(p.level)
        return acc + score
      }, 0)

      return {
        count,
        averageScore: Number((sum / count).toFixed(2))
      }
    }

    const newStats = {
      yellow: calculateStats(yellowTeam),
      blue: calculateStats(blueTeam),
      green: calculateStats(greenTeam)
    }

    const updatedFormation = {
      ...teamFormation,
      stats: newStats
    }

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        teamFormation: updatedFormation,
        formationDate: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      teamFormation: updatedFormation
    })

  } catch (error) {
    console.error('팀편성 업데이트 오류:', error)
    return NextResponse.json(
      { error: '팀편성 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
