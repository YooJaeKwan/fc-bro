const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const currentYear = 2026;
  const yearStart = new Date(currentYear, 0, 1);
  const yearSchedules = await prisma.schedule.findMany({
    where: { matchDate: { gte: yearStart } },
    include: { attendances: true }
  });

  const userStats = {};
  
  yearSchedules.forEach(schedule => {
    if (schedule.type !== 'internal' || !schedule.teamFormation || schedule.ourScore === null || schedule.opponentScore === null) {
      return;
    }
    
    schedule.attendances.forEach(a => {
      if (a.status !== 'ATTENDING') return;
      const userId = a.userId;
      if (!userStats[userId]) userStats[userId] = { wins: 0, draws: 0, losses: 0, matches: [] };
      
      const formation = schedule.teamFormation;
      const yellowTeam = formation.yellowTeam || [];
      const blueTeam = formation.blueTeam || [];
      const isOnYellow = yellowTeam.some(p => p.userId === userId);
      const isOnBlue = blueTeam.some(p => p.userId === userId);
      
      let res = '';
      if (isOnYellow) {
        if (schedule.ourScore > schedule.opponentScore) { userStats[userId].wins++; res = 'W'; }
        else if (schedule.ourScore === schedule.opponentScore) { userStats[userId].draws++; res = 'D'; }
        else { userStats[userId].losses++; res = 'L'; }
        userStats[userId].matches.push({id: schedule.id, date: schedule.matchDate, res});
      } else if (isOnBlue) {
        if (schedule.opponentScore > schedule.ourScore) { userStats[userId].wins++; res = 'W'; }
        else if (schedule.opponentScore === schedule.ourScore) { userStats[userId].draws++; res = 'D'; }
        else { userStats[userId].losses++; res = 'L'; }
        userStats[userId].matches.push({id: schedule.id, date: schedule.matchDate, res});
      }
    });
  });
  
  let anomalies = Object.entries(userStats).filter(([_, s]) => (s.wins + s.draws + s.losses) > 5);
  console.log('Anomalies (>5 matches):', anomalies.length);
  for (let [uid, s] of anomalies) {
    const u = await prisma.user.findUnique({where: {id: uid}});
    console.log(u.name, s.wins + 'W ' + s.losses + 'L', s.matches.map(m => m.date.toISOString().split('T')[0]));
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
