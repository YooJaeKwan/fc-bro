import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyze() {
  const userId = 'cmiy6r6p50001lb04wai90iy5'; // 채호성
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const schedules = await prisma.schedule.findMany({
    where: {
      status: 'COMPLETED',
      matchDate: { gte: yearStart }
    },
    select: {
      id: true,
      title: true,
      type: true,
      matchDate: true,
      ourScore: true,
      opponentScore: true,
      goalRecords: true,
      teamFormation: true
    }
  });

  const matchDetails: any[] = [];
  let totalCleanSheets = 0;

  for (const schedule of schedules) {
    if (schedule.type !== 'internal' || !schedule.teamFormation) continue;

    const formation: any = schedule.teamFormation;
    const yellowTeam: any[] = formation.yellowTeam || [];
    const blueTeam: any[] = formation.blueTeam || [];

    const inYellow = yellowTeam.some((p: any) => p.userId === userId);
    const inBlue = blueTeam.some((p: any) => p.userId === userId);

    if (!inYellow && !inBlue) continue;

    const myTeamLabel = inYellow ? '노랑팀' : '파랑팀';
    const opponentTeamKey = inYellow ? 'blue' : 'yellow';
    
    const goals: any[] = (schedule.goalRecords as any[]) || [];
    let matchCleanSheets = 0;
    const cleanQuarters: number[] = [];

    // Check 4 quarters
    for (let q = 1; q <= 4; q++) {
        const opponentScored = goals.some(g => {
            const isOpponent = (opponentTeamKey === 'blue' && (g.team === 'blue' || g.team === 'away')) ||
                               (opponentTeamKey === 'yellow' && (g.team === 'yellow' || g.team === 'home'));
            return isOpponent && g.quarter === q;
        });
        
        if (!opponentScored) {
            matchCleanSheets++;
            cleanQuarters.push(q);
        }
    }

    totalCleanSheets += matchCleanSheets;
    matchDetails.push({
      title: schedule.title,
      date: schedule.matchDate.toISOString().split('T')[0],
      team: myTeamLabel,
      cleanSheetsCount: matchCleanSheets,
      quarters: cleanQuarters.join(', ')
    });
  }

  console.log(JSON.stringify({ totalCleanSheets, matchDetails }, null, 2));
}

analyze()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
