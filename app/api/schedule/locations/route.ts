import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('이전 사용 장소 목록 조회 요청')

    // 데이터베이스에서 이전에 사용했던 장소들을 조회 (중복 제거, 사용 빈도 순)
    const usedLocations = await prisma.schedule.groupBy({
      by: ['location'],
      _count: {
        location: true
      },
      orderBy: {
        _count: {
          location: 'desc'
        }
      },
      take: 20 // 최대 20개까지
    })

    // 기본 인기 장소 목록
    const popularLocations = [
      "수암꿈나무 체육공원",
    ]

    // 사용했던 장소들과 기본 장소들을 합쳐서 중복 제거
    const allLocations = []
    const locationSet = new Set()

    // 1. 실제 사용했던 장소들 (빈도 순)
    usedLocations.forEach(item => {
      if (!locationSet.has(item.location)) {
        allLocations.push({
          name: item.location,
          count: item._count.location,
          type: 'used'
        })
        locationSet.add(item.location)
      }
    })

    // 2. 기본 인기 장소들 (아직 사용하지 않은 것들만)
    popularLocations.forEach(location => {
      if (!locationSet.has(location)) {
        allLocations.push({
          name: location,
          count: 0,
          type: 'popular'
        })
        locationSet.add(location)
      }
    })

    console.log(`장소 목록 조회 완료: 총 ${allLocations.length}개`)

    return NextResponse.json({
      success: true,
      locations: allLocations
    })

  } catch (error) {
    console.error('장소 목록 조회 중 오류:', error)
    
    return NextResponse.json(
      { error: '장소 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
