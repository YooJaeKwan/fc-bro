const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listSchedules() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: {
        matchDate: 'asc'
      },
      select: {
        id: true,
        title: true,
        matchDate: true,
        location: true,
        type: true
      }
    })

    console.log(`총 ${schedules.length}개의 일정이 있습니다.\n`)
    
    schedules.forEach((schedule, index) => {
      const date = new Date(schedule.matchDate)
      const dateStr = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
      console.log(`${index + 1}. ${schedule.title}`)
      console.log(`   날짜: ${dateStr} (${date.toISOString().split('T')[0]})`)
      console.log(`   장소: ${schedule.location}`)
      console.log(`   유형: ${schedule.type}`)
      console.log(`   ID: ${schedule.id}\n`)
    })

  } catch (error) {
    console.error('오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

listSchedules()

