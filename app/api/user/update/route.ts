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
      jerseyNumber = null,
      level = null // 총무가 레벨 수정 시 포함
    } = body

    // 사용자 ID는 항상 필수
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' }, 
        { status: 400 }
      )
    }

    // 레벨만 업데이트하는 경우와 전체 정보 업데이트를 구분
    const isLevelOnlyUpdate = level !== null && level !== undefined && 
      !realName && !phoneNumber && !preferredPosition && !region && !city

    // 전체 정보 업데이트인 경우에만 필수 필드 검증
    if (!isLevelOnlyUpdate && (!realName || !phoneNumber || !preferredPosition || !region || !city)) {
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

    // 전화번호 형식 검증 (전체 정보 업데이트인 경우에만)
    if (!isLevelOnlyUpdate && phoneNumber) {
      const phoneRegex = /^010\d{8}$/
      if (!phoneRegex.test(phoneNumber)) {
        return NextResponse.json(
          { error: '올바른 전화번호 형식이 아닙니다.' }, 
          { status: 400 }
        )
      }
    }

    // 전체 정보 업데이트인 경우에만 검증 수행
    if (!isLevelOnlyUpdate) {
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
    }

    // 업데이트할 데이터 구성
    const updateData: any = {
      updatedAt: new Date()
    }

    // 레벨만 업데이트하는 경우
    if (isLevelOnlyUpdate) {
      // 레벨 업데이트에는 추가 데이터 불필요
      console.log('레벨만 업데이트:', level)
    } else {
      // 전체 정보 업데이트
      updateData.realName = realName.trim()
      updateData.phoneNumber = phoneNumber
      updateData.preferredPosition = preferredPosition
      updateData.subPositions = subPositions
      updateData.region = region
      updateData.city = city
      updateData.preferredFoot = preferredFoot
      updateData.jerseyNumber = jerseyNumber ? Number(jerseyNumber) : null
    }

    // 레벨이 제공된 경우에만 업데이트 (총무가 수정할 때)
    if (level !== null && level !== undefined) {
      if (typeof level === 'number' && level >= 1 && level <= 10) {
        updateData.level = level
        console.log('레벨 업데이트 데이터에 추가:', level)
      } else {
        return NextResponse.json(
          { error: '레벨은 1-10 사이의 숫자여야 합니다.' },
          { status: 400 }
        )
      }
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
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
        role: updatedUser.role,
        level: updatedUser.level,
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
