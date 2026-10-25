const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const pw = encodeURIComponent("%k6q6-V#pcn7G5eMOI%$#78qriyut");
const dbUrl = `postgresql://postgres.yhmzilfqdubjygmokghz:${pw}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?connection_limit=5&connect_timeout=25`;

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function main() {
  console.log("Seeding Web Head, instructors, and students to Supabase...");

  // Find or create Web Development track
  let webTrack = await prisma.track.findFirst({
    where: { name: { contains: "Web", mode: "insensitive" } },
  });

  if (!webTrack) {
    webTrack = await prisma.track.create({
      data: {
        name: "Web Development",
        description: "تراك تطوير الويب لتأهيل وتدريب الطلاب عملياً وتقنياً.",
      },
    });
  }

  console.log("Using Web track ID:", webTrack.id);

  // 1. Web Head
  const headPass = await bcrypt.hash("head123", 10);
  const webHead = await prisma.user.upsert({
    where: { email: "web.head@branch.org" },
    update: {
      role: "INSTRUCTOR",
      trackTeamRole: "HEAD",
      assignedTrackId: webTrack.id,
      status: "APPROVED",
      password: headPass,
    },
    create: {
      name: "Eng. Ahmed (Web Head)",
      email: "web.head@branch.org",
      password: headPass,
      role: "INSTRUCTOR",
      trackTeamRole: "HEAD",
      assignedTrackId: webTrack.id,
      status: "APPROVED",
      phone: "01011111111",
      college: "Faculty of IT",
    },
  });
  console.log("✅ Seeded Web Head:", webHead.email, "(password: head123)");

  // 2. Web Vice Head
  const vicePass = await bcrypt.hash("vice123", 10);
  const webVice = await prisma.user.upsert({
    where: { email: "web.vice@branch.org" },
    update: {
      role: "INSTRUCTOR",
      trackTeamRole: "VICE_HEAD",
      assignedTrackId: webTrack.id,
      status: "APPROVED",
      password: vicePass,
    },
    create: {
      name: "Eng. Sara (Web Vice Head)",
      email: "web.vice@branch.org",
      password: vicePass,
      role: "INSTRUCTOR",
      trackTeamRole: "VICE_HEAD",
      assignedTrackId: webTrack.id,
      status: "APPROVED",
      phone: "01022222222",
      college: "Faculty of IT",
    },
  });
  console.log("✅ Seeded Web Vice Head:", webVice.email, "(password: vice123)");

  // 3. Web Core Member
  const corePass = await bcrypt.hash("core123", 10);
  const webCore = await prisma.user.upsert({
    where: { email: "web.core@branch.org" },
    update: {
      role: "INSTRUCTOR",
      trackTeamRole: "CORE_TEAM",
      assignedTrackId: webTrack.id,
      status: "APPROVED",
      password: corePass,
    },
    create: {
      name: "Eng. Mahmoud (Core Team)",
      email: "web.core@branch.org",
      password: corePass,
      role: "INSTRUCTOR",
      trackTeamRole: "CORE_TEAM",
      assignedTrackId: webTrack.id,
      status: "APPROVED",
      phone: "01033333333",
      college: "Faculty of IT",
    },
  });
  console.log("✅ Seeded Web Core Member:", webCore.email, "(password: core123)");

  // 4. Student 1
  const studentPass = await bcrypt.hash("student123", 10);
  const student1 = await prisma.user.upsert({
    where: { email: "student1@branch.org" },
    update: {
      role: "STUDENT",
      status: "APPROVED",
      password: studentPass,
    },
    create: {
      name: "Youssef Mohamed",
      email: "student1@branch.org",
      password: studentPass,
      role: "STUDENT",
      status: "APPROVED",
      phone: "01099999991",
      college: "Information Technology",
      academicYear: "Year 2",
      universityId: "2024001",
    },
  });

  // Enroll student in Web track
  await prisma.trackEnrollment.upsert({
    where: {
      userId_trackId: {
        userId: student1.id,
        trackId: webTrack.id,
      },
    },
    update: {},
    create: {
      userId: student1.id,
      trackId: webTrack.id,
    },
  });
  console.log("✅ Seeded Student 1:", student1.email, "(password: student123)");

  // 5. Student 2
  const student2 = await prisma.user.upsert({
    where: { email: "student2@branch.org" },
    update: {
      role: "STUDENT",
      status: "APPROVED",
      password: studentPass,
    },
    create: {
      name: "Mariam Ali",
      email: "student2@branch.org",
      password: studentPass,
      role: "STUDENT",
      status: "APPROVED",
      phone: "01099999992",
      college: "Business Administration",
      academicYear: "Year 3",
      universityId: "2024002",
    },
  });

  await prisma.trackEnrollment.upsert({
    where: {
      userId_trackId: {
        userId: student2.id,
        trackId: webTrack.id,
      },
    },
    update: {},
    create: {
      userId: student2.id,
      trackId: webTrack.id,
    },
  });
  console.log("✅ Seeded Student 2:", student2.email, "(password: student123)");

  console.log("\n🎉 All staff, instructors, and students seeded into Supabase successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
