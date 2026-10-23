import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TRACK_NAMES = [
  "Artificial Intelligence",
  "Programming",
  "Cyber Security",
  "Web Development",
  "Career Support",
  "Financial analysis",
  "Graphic Design",
  "Business Hub",
  "Digital Marketing",
];

async function main() {
  console.log("Starting database seeding...");

  // 1. Initialize ScoreSettings
  await prisma.scoreSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      attendancePoints: 10.0,
      taskWeight: 1.0,
      bonusWeight: 1.0,
    },
  });

  // 2. Initialize Tracks
  const tracksMap: Record<string, string> = {};
  for (const name of TRACK_NAMES) {
    const track = await prisma.track.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `تراك ${name} لتأهيل وتدريب الطلاب عملياً وتقنياً.`,
      },
    });
    tracksMap[name] = track.id;
  }
  console.log(`Created/Verified ${TRACK_NAMES.length} tracks.`);

  // 3. Create Admin Account
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@branch.org" },
    update: {
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      name: "Main Admin",
      email: "admin@branch.org",
      password: adminPassword,
      role: "ADMIN",
      status: "APPROVED",
      phone: "01000000000",
    },
  });

  // 4. Create Chair Person & Vice Chair (Assistant) Accounts
  const chairPassword = await bcrypt.hash("chair123", 10);
  await prisma.user.upsert({
    where: { email: "chair@branch.org" },
    update: {
      role: "CHAIR_PERSON",
      status: "APPROVED",
    },
    create: {
      name: "Chairperson",
      email: "chair@branch.org",
      password: chairPassword,
      role: "CHAIR_PERSON",
      status: "APPROVED",
      phone: "01100000000",
    },
  });

  const viceChairPassword = await bcrypt.hash("vicechair123", 10);
  await prisma.user.upsert({
    where: { email: "vicechair@branch.org" },
    update: {
      role: "VICE_CHAIR",
      status: "APPROVED",
    },
    create: {
      name: "Vice Chair (Assistant)",
      email: "vicechair@branch.org",
      password: viceChairPassword,
      role: "VICE_CHAIR",
      status: "APPROVED",
      phone: "01200000000",
    },
  });

  // 5. Create Web Development Track Team (Head, Vice Head, 2 Core)
  const webTrackId = tracksMap["Web Development"];
  if (webTrackId) {
    const headPass = await bcrypt.hash("head123", 10);
    await prisma.user.upsert({
      where: { email: "web.head@branch.org" },
      update: {
        role: "INSTRUCTOR",
        trackTeamRole: "HEAD",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
      create: {
        name: "Web Dev Head",
        email: "web.head@branch.org",
        password: headPass,
        role: "INSTRUCTOR",
        trackTeamRole: "HEAD",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
    });

    const vicePass = await bcrypt.hash("vice123", 10);
    await prisma.user.upsert({
      where: { email: "web.vice@branch.org" },
      update: {
        role: "INSTRUCTOR",
        trackTeamRole: "VICE_HEAD",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
      create: {
        name: "Web Dev Vice Head",
        email: "web.vice@branch.org",
        password: vicePass,
        role: "INSTRUCTOR",
        trackTeamRole: "VICE_HEAD",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
    });

    const core1Pass = await bcrypt.hash("core123", 10);
    await prisma.user.upsert({
      where: { email: "web.core1@branch.org" },
      update: {
        role: "INSTRUCTOR",
        trackTeamRole: "CORE_TEAM",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
      create: {
        name: "Web Core Member 1",
        email: "web.core1@branch.org",
        password: core1Pass,
        role: "INSTRUCTOR",
        trackTeamRole: "CORE_TEAM",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
    });

    const core2Pass = await bcrypt.hash("core123", 10);
    await prisma.user.upsert({
      where: { email: "web.core2@branch.org" },
      update: {
        role: "INSTRUCTOR",
        trackTeamRole: "CORE_TEAM",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
      create: {
        name: "Web Core Member 2",
        email: "web.core2@branch.org",
        password: core2Pass,
        role: "INSTRUCTOR",
        trackTeamRole: "CORE_TEAM",
        assignedTrackId: webTrackId,
        status: "APPROVED",
      },
    });
  }

  // 6. Sample Students
  const studentPass = await bcrypt.hash("student123", 10);
  const student1 = await prisma.user.upsert({
    where: { email: "ahmed@student.com" },
    update: {},
    create: {
      name: "أحمد محمد علي",
      email: "ahmed@student.com",
      password: studentPass,
      role: "STUDENT",
      status: "APPROVED",
      college: "حاسبات ومعلومات",
      academicYear: "الفرقة الثالثة",
      phone: "01011223344",
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "sara@student.com" },
    update: {},
    create: {
      name: "سارة محمود خالد",
      email: "sara@student.com",
      password: studentPass,
      role: "STUDENT",
      status: "APPROVED",
      college: "هندسة",
      academicYear: "الفرقة الثانية",
      phone: "01155667788",
    },
  });

  // Pending student
  await prisma.user.upsert({
    where: { email: "omar.pending@student.com" },
    update: {},
    create: {
      name: "عمر شريف حسني",
      email: "omar.pending@student.com",
      password: studentPass,
      role: "STUDENT",
      status: "PENDING",
      college: "علوم حاسب",
      academicYear: "الفرقة الأولى",
      phone: "01288990011",
    },
  });

  // Enroll approved students into Web Dev and AI
  if (webTrackId) {
    await prisma.trackEnrollment.upsert({
      where: {
        userId_trackId: {
          userId: student1.id,
          trackId: webTrackId,
        },
      },
      update: {},
      create: {
        userId: student1.id,
        trackId: webTrackId,
      },
    });

    await prisma.trackEnrollment.upsert({
      where: {
        userId_trackId: {
          userId: student2.id,
          trackId: webTrackId,
        },
      },
      update: {},
      create: {
        userId: student2.id,
        trackId: webTrackId,
      },
    });

    // Create a sample Session for Web Development
    let session = await prisma.session.findFirst({
      where: { trackId: webTrackId },
    });
    if (!session) {
      session = await prisma.session.create({
        data: {
          trackId: webTrackId,
          title: "Session 1: HTML & Modern CSS Architecture",
          description: "مقدمة عن أساسيات الويب وهيكلة الصفحات والتصميم التفاعلي.",
          date: "2026-10-25",
          time: "05:00 PM",
          location: "قاعة 101 / أونلاين على Google Meet",
          materials: JSON.stringify([
            { title: "سلايدات الجلسة", url: "https://drive.google.com/drive/folders/demo1", type: "drive" },
            { title: "كود المشروع التفاعلي", url: "https://github.com/branch/web-session-1", type: "github" },
          ]),
        },
      });

      // Mark Attendance for student1 and student2
      await prisma.attendanceRecord.createMany({
        data: [
          { sessionId: session.id, studentId: student1.id, status: "PRESENT", notes: "حاضر في الموعد" },
          { sessionId: session.id, studentId: student2.id, status: "PRESENT", notes: "مشاركة ممتازة" },
        ],
      });
    }

    // Create a sample Task for Web Development
    let task = await prisma.task.findFirst({
      where: { trackId: webTrackId },
    });
    if (!task) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      task = await prisma.task.create({
        data: {
          trackId: webTrackId,
          title: "تاسك 1: تصميم واجهة متجاوبة Responsive Portfolio",
          description: "قم بإنشاء صفحة بورتفوليو شخصية متجاوبة مع الشاشات ورفع الكود على GitHub ونشرها على Vercel أو GitHub Pages، ثم ضع رابط المشروع وجوجل درايف هنا.",
          maxScore: 100,
          deadline,
          materialsLink: "https://drive.google.com/file/d/demo-task-guidelines",
        },
      });

      // Student 1 submitted
      await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          studentId: student1.id,
          solutionLink: "https://github.com/ahmed/my-portfolio",
          notes: "تم استخدام Tailwind CSS و HTML5 بنجاح.",
          score: 95,
          feedback: "عمل رائع ومتقن جداً!",
          gradedBy: "Web Dev Head",
          gradedAt: new Date(),
        },
      });

      // Student 2 submitted
      await prisma.taskSubmission.create({
        data: {
          taskId: task.id,
          studentId: student2.id,
          solutionLink: "https://drive.google.com/drive/folders/sara-task-1",
          notes: "الملفات مرفوعة على جوجل درايف.",
          score: 98,
          feedback: "تصميم ممتاز وألوان متناسقة، كود نظيف جداً.",
          gradedBy: "Web Dev Head",
          gradedAt: new Date(),
        },
      });

      // Add a bonus point for competition
      await prisma.bonusPoint.create({
        data: {
          trackId: webTrackId,
          studentId: student2.id,
          points: 15,
          reason: "الفائز بالمركز الأول في مسابقة الكود الأسرع خلال السيشن",
          awardedBy: "Web Dev Head",
        },
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
