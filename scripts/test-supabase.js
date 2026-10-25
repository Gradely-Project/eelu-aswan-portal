const { PrismaClient } = require("@prisma/client");

async function run() {
  const pw = encodeURIComponent("%k6q6-V#pcn7G5eMOI%$#78qriyut");

  // Let's test session pooler 5432 vs transaction pooler 6543
  const urls = [
    `postgresql://postgres.yhmzilfqdubjygmokghz:${pw}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?connection_limit=10&connect_timeout=20`,
    `postgresql://postgres.yhmzilfqdubjygmokghz:${pw}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20&connect_timeout=20`,
  ];

  for (let i = 0; i < urls.length; i++) {
    console.log(`Testing URL #${i + 1}...`);
    const p = new PrismaClient({ datasources: { db: { url: urls[i] } } });
    try {
      const res = await p.track.findMany({ take: 3 });
      console.log(`✅ SUCCESS on URL #${i + 1}! Tracks count:`, res.length);
      console.log("Tracks:", res.map(t => t.name));
      const users = await p.user.findMany({ select: { name: true, role: true, email: true } });
      console.log("Users:", users);
      await p.$disconnect();
      return urls[i];
    } catch (e) {
      console.log(`Failed URL #${i + 1}:`, e.message.split("\n").filter(Boolean).slice(-1)[0]);
      await p.$disconnect();
    }
  }
}

run();
