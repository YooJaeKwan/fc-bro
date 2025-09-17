import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetUserId, adminUserId } = body

    if (!targetUserId || !adminUserId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' }, 
        { status: 400 }
      )
    }

    // 관리자 권한 확인
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '총무 권한이 필요합니다.' }, 
        { status: 403 }
      )
    }

    // 대상 사용자 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' }, 
        { status: 404 }
      )
    }

    // 자기 자신은 비활성화할 수 없음
    if (targetUserId === adminUserId) {
      return NextResponse.json(
        { error: '자기 자신은 비활성화할 수 없습니다.' }, 
        { status: 400 }
      )
    }

    // 사용자 비활성화
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log(`사용자 비활성화: ${updatedUser.realName} (${updatedUser.id})`)

    return NextResponse.json({
      success: true,
      message: '사용자가 비활성화되었습니다.',
      user: {
        id: updatedUser.id,
        realName: updatedUser.realName,
        isActive: updatedUser.isActive
      }
    })

  } catch (error) {
    console.error('사용자 비활성화 중 오류:', error)
    return NextResponse.json(
      { error: '사용자 비활성화 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}

// 재활성화 기능
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetUserId, adminUserId } = body

    if (!targetUserId || !adminUserId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' }, 
        { status: 400 }
      )
    }

    // 관리자 권한 확인
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '총무 권한이 필요합니다.' }, 
        { status: 403 }
      )
    }

    // 사용자 재활성화
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    })

    console.log(`사용자 재활성화: ${updatedUser.realName} (${updatedUser.id})`)

    return NextResponse.json({
      success: true,
      message: '사용자가 재활성화되었습니다.',
      user: {
        id: updatedUser.id,
        realName: updatedUser.realName,
        isActive: updatedUser.isActive
      }
    })

  } catch (error) {
    console.error('사용자 재활성화 중 오류:', error)
    return NextResponse.json(
      { error: '사용자 재활성화 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}
