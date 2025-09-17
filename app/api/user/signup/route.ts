import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('회원가입 요청 받음:', body)

    const { 
      kakaoId, 
      nickname, 
      profileImage, 
      realName, 
      phoneNumber, 
      birthYear,
      preferredPosition,
      subPositions = [],
      region,
      city,
      preferredFoot = null,
      jerseyNumber = null
    } = body

    // 필수 필드 검증
    if (!kakaoId || !realName || !phoneNumber || !birthYear || !preferredPosition || !region || !city) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' }, 
        { status: 400 }
      )
    }

    // 부포지션 검증
    if (!Array.isArray(subPositions)) {
      return NextResponse.json(
        { error: '부포지션 데이터 형식이 올바르지 않습니다.' }, 
        { status: 400 }
      )
    }

    if (subPositions.length > 2) {
      return NextResponse.json(
        { error: '부포지션은 최대 2개까지 선택 가능합니다.' }, 
        { status: 400 }
      )
    }

    // 부포지션에 희망포지션이 포함되어있는지 확인
    if (subPositions.includes(preferredPosition)) {
      return NextResponse.json(
        { error: '부포지션에는 희망포지션과 다른 포지션을 선택해주세요.' }, 
        { status: 400 }
      )
    }

    // 전화번호 형식 검증
    const phoneRegex = /^010\d{8}$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다.' }, 
        { status: 400 }
      )
    }

    // 출생연도 검증
    const currentYear = new Date().getFullYear()
    const birthYearNum = parseInt(birthYear)
    
    if (!/^\d{4}$/.test(birthYear)) {
      return NextResponse.json(
        { error: '출생연도는 4자리 숫자로 입력해주세요.' }, 
        { status: 400 }
      )
    }
    
    if (birthYearNum < 1900 || birthYearNum > currentYear - 5) {
      return NextResponse.json(
        { error: `출생연도는 1900년부터 ${currentYear - 5}년 사이로 입력해주세요.` }, 
        { status: 400 }
      )
    }

    // 기존 사용자 확인 (카카오 ID로)
    const existingUser = await prisma.user.findUnique({
      where: { kakaoId: kakaoId.toString() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 가입된 사용자입니다.' }, 
        { status: 409 }
      )
    }

    // 전화번호 중복 확인
    const existingPhone = await prisma.user.findFirst({
      where: { phoneNumber }
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: '이미 사용 중인 전화번호입니다.' }, 
        { status: 409 }
      )
    }

    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        kakaoId: kakaoId.toString(),
        provider: 'kakao',
        providerId: kakaoId.toString(),
        nickname: nickname || '카카오 사용자',
        image: profileImage,
        realName: realName.trim(),
        phoneNumber,
        birthYear,
        preferredPosition,
        subPositions,
        region,
        city,
        preferredFoot,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        role: 'MEMBER', // 기본적으로 MEMBER role 부여
        level: 1, // 기본 레벨 1
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('새 사용자 생성 완료:', newUser.id)

    // 응답에서 민감한 정보 제외
    const { id, createdAt, updatedAt, ...safeUserData } = newUser
    
    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id,
        kakaoId: newUser.kakaoId,
        nickname: newUser.nickname,
        realName: newUser.realName,
        birthYear: newUser.birthYear,
        preferredPosition: newUser.preferredPosition,
        subPositions: newUser.subPositions,
        region: newUser.region,
        city: newUser.city,
        preferredFoot: newUser.preferredFoot,
        jerseyNumber: newUser.jerseyNumber,
        role: newUser.role,
        level: newUser.level,
        profileImage: newUser.image,
        registeredAt: createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('회원가입 처리 중 오류:', error)
    
    // Prisma 관련 오류 처리
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: '중복된 정보가 있습니다. 다시 확인해주세요.' }, 
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}