import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('사용자 정보 수정 요청:', body)

    const { 
      userId,
      realName, 
      phoneNumber, 
      preferredPosition,
      subPositions = [],
      region,
      city,
      preferredFoot = null,
      jerseyNumber = null
    } = body

    // 필수 필드 검증
    if (!userId || !realName || !phoneNumber || !preferredPosition || !region || !city) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' }, 
        { status: 400 }
      )
    }

    // 사용자 존재 여부 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' }, 
        { status: 404 }
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

    // 다른 사용자의 전화번호와 중복 확인 (본인 제외)
    const duplicatePhone = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        NOT: { id: userId }
      }
    })

    if (duplicatePhone) {
      return NextResponse.json(
        { error: '이미 사용 중인 전화번호입니다.' }, 
        { status: 409 }
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

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        realName: realName.trim(),
        phoneNumber,
        preferredPosition,
        subPositions,
        region,
        city,
        preferredFoot,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        updatedAt: new Date()
      }
    })

    console.log('사용자 정보 수정 완료:', updatedUser.id)

    // 응답에서 민감한 정보 제외하고 필요한 정보만 반환
    return NextResponse.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      user: {
        id: updatedUser.id,
        kakaoId: updatedUser.kakaoId,
        nickname: updatedUser.nickname,
        realName: updatedUser.realName,
        phoneNumber: updatedUser.phoneNumber,
        preferredPosition: updatedUser.preferredPosition,
        subPositions: updatedUser.subPositions,
        region: updatedUser.region,
        city: updatedUser.city,
        preferredFoot: updatedUser.preferredFoot,
        jerseyNumber: updatedUser.jerseyNumber,
        profileImage: updatedUser.image,
        registeredAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('사용자 정보 수정 중 오류:', error)
    
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
      { error: '사용자 정보 수정 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}
