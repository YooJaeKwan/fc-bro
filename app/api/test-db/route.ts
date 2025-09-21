import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 1. 데이터베이스 연결 테스트
    await prisma.$connect()
    
    // 2. 테이블별 레코드 수 확인
    const userCount = await prisma.user.count()
    const teamCount = await prisma.team.count()
    const scheduleCount = await prisma.schedule.count()
    
    // 3. 샘플 사용자 데이터 가져오기
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      connected: true,
      userCount,
      teamCount,
      scheduleCount,
      sampleUsers,
      message: 'NeonDB 연결 성공!'
    })
    
  } catch (error: any) {
    console.error('Database connection error:', error)
    
    let errorMessage = '알 수 없는 데이터베이스 오류'
    
    // Prisma 에러 코드별 메시지
    if (error.code === 'P1001') {
      errorMessage = '데이터베이스 서버에 연결할 수 없습니다. DATABASE_URL을 확인해주세요.'
    } else if (error.code === 'P1017') {
      errorMessage = '데이터베이스 서버가 닫혔습니다. NeonDB 프로젝트 상태를 확인해주세요.'
    } else if (error.message?.includes('Environment variable not found')) {
      errorMessage = 'DATABASE_URL 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
    } else if (error.message?.includes('getaddrinfo')) {
      errorMessage = 'DNS 해결 실패. 네트워크 연결 또는 호스트 주소를 확인해주세요.'
    } else if (error.message?.includes('connection terminated')) {
      errorMessage = '연결이 종료되었습니다. NeonDB 프로젝트가 일시 중지되었을 수 있습니다.'
    } else if (error.message?.includes('authentication failed')) {
      errorMessage = '인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({
      connected: false,
      error: errorMessage,
      code: error.code || 'UNKNOWN',
      details: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 })
    
  } finally {
    await prisma.$disconnect()
  }
}

