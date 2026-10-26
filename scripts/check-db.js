const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tracks = await prisma.track.findMany({ select: { id: true, name: true } });
  console.log("=== DB TRACKS ===");
  console.log(tracks);

  const leaders = await prisma.branchLeader.findMany({ select: { id: true, name: true, roleTitle: true } });
  console.log("=== DB LEADERS ===");
  console.log(leaders);

  const settings = await prisma.systemSetting.findMany();
  console.log("=== DB SETTINGS ===");
  console.log(settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
