import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kakaoId } = body

    console.log('사용자 조회 요청:', kakaoId)

    if (!kakaoId) {
      return NextResponse.json(
        { error: '카카오 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 카카오 ID로 기존 사용자 조회
    const existingUser = await prisma.user.findUnique({
      where: {
        kakaoId: kakaoId.toString()
      },
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        realName: true,
        phoneNumber: true,
        preferredPosition: true,
        subPositions: true,
        region: true,
        city: true,
        preferredFoot: true,
        image: true,
        createdAt: true
      }
    })

    if (existingUser) {
      console.log('기존 사용자 발견:', existingUser.id)
      
      return NextResponse.json({
        exists: true,
        user: {
          id: existingUser.id,
          kakaoId: existingUser.kakaoId,
          nickname: existingUser.nickname,
          realName: existingUser.realName,
          phoneNumber: existingUser.phoneNumber,
          preferredPosition: existingUser.preferredPosition,
          subPositions: existingUser.subPositions,
          region: existingUser.region,
          city: existingUser.city,
          preferredFoot: existingUser.preferredFoot,
          profileImage: existingUser.image,
          registeredAt: existingUser.createdAt.toISOString()
        }
      })
    } else {
      console.log('신규 사용자:', kakaoId)
      
      return NextResponse.json({
        exists: false,
        message: '신규 사용자입니다. 회원가입을 진행해주세요.'
      })
    }

  } catch (error) {
    console.error('사용자 조회 중 오류:', error)
    
    return NextResponse.json(
      { error: '사용자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
