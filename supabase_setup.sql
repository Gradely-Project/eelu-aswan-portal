-- ====================================================================
-- EELU Aswan Student Branch Portal - Supabase PostgreSQL Setup
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ====================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS "Track" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Track_name_key" ON "Track"("name");

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "college" TEXT,
    "academicYear" TEXT,
    "universityEmail" TEXT,
    "universityId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "trackTeamRole" TEXT,
    "assignedTrackId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "TrackEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackEnrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TrackEnrollment_userId_trackId_key" ON "TrackEnrollment"("userId", "trackId");

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "materials" TEXT,
    "checkInCode" TEXT,
    "codeExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

CREATE TABLE IF NOT EXISTS "WeeklySchedule" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklySchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "deadline" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "materialsLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskSubmission" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "solutionLink" TEXT NOT NULL,
    "notes" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TaskSubmission_taskId_studentId_key" ON "TaskSubmission"("taskId", "studentId");

CREATE TABLE IF NOT EXISTS "BonusPoint" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "awardedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonusPoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScoreSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "attendancePoints" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "latePoints" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "taskWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "bonusWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BranchLeader" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "affiliation" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BranchLeader_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "trackId" TEXT,
    "authorName" TEXT NOT NULL DEFAULT 'Branch Administration',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SessionEvaluation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT,
    "instructorName" TEXT,
    "instructorRole" TEXT,
    "clarityRating" INTEGER NOT NULL DEFAULT 5,
    "materialRating" INTEGER NOT NULL DEFAULT 5,
    "overallRating" INTEGER NOT NULL DEFAULT 5,
    "feedbackText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SessionEvaluation_sessionId_studentId_key" ON "SessionEvaluation"("sessionId", "studentId");

CREATE TABLE IF NOT EXISTS "Certificate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT,
    "trackId" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT 'Distinction',
    "supervisorName" TEXT NOT NULL DEFAULT 'Eng. Abdelrahman Mahmoud',
    "chairName" TEXT NOT NULL DEFAULT 'Dr. Chairperson',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_certificateNo_key" ON "Certificate"("certificateNo");

CREATE TABLE IF NOT EXISTS "HallSlot" (
    "id" TEXT NOT NULL,
    "hallName" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "date" TEXT,
    "timeSlot" TEXT NOT NULL,
    "capacity" INTEGER DEFAULT 50,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "bookedTrackId" TEXT,
    "bookedTrackName" TEXT,
    "bookedById" TEXT,
    "bookedByName" TEXT,
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HallSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- 2. Foreign Key Constraints
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_assignedTrackId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_assignedTrackId_fkey" FOREIGN KEY ("assignedTrackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TrackEnrollment" DROP CONSTRAINT IF EXISTS "TrackEnrollment_userId_fkey";
ALTER TABLE "TrackEnrollment" ADD CONSTRAINT "TrackEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackEnrollment" DROP CONSTRAINT IF EXISTS "TrackEnrollment_trackId_fkey";
ALTER TABLE "TrackEnrollment" ADD CONSTRAINT "TrackEnrollment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_trackId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttendanceRecord" DROP CONSTRAINT IF EXISTS "AttendanceRecord_sessionId_fkey";
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttendanceRecord" DROP CONSTRAINT IF EXISTS "AttendanceRecord_studentId_fkey";
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeeklySchedule" DROP CONSTRAINT IF EXISTS "WeeklySchedule_trackId_fkey";
ALTER TABLE "WeeklySchedule" ADD CONSTRAINT "WeeklySchedule_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_trackId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskSubmission" DROP CONSTRAINT IF EXISTS "TaskSubmission_taskId_fkey";
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskSubmission" DROP CONSTRAINT IF EXISTS "TaskSubmission_studentId_fkey";
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BonusPoint" DROP CONSTRAINT IF EXISTS "BonusPoint_trackId_fkey";
ALTER TABLE "BonusPoint" ADD CONSTRAINT "BonusPoint_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BonusPoint" DROP CONSTRAINT IF EXISTS "BonusPoint_studentId_fkey";
ALTER TABLE "BonusPoint" ADD CONSTRAINT "BonusPoint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Performance Indexes (Minimizes Supabase Egress & Speeds Up Queries)
CREATE INDEX IF NOT EXISTS "Session_trackId_idx" ON "Session"("trackId");
CREATE INDEX IF NOT EXISTS "Task_trackId_idx" ON "Task"("trackId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");
CREATE INDEX IF NOT EXISTS "BonusPoint_trackId_idx" ON "BonusPoint"("trackId");
CREATE INDEX IF NOT EXISTS "BonusPoint_studentId_idx" ON "BonusPoint"("studentId");
CREATE INDEX IF NOT EXISTS "WeeklySchedule_trackId_idx" ON "WeeklySchedule"("trackId");

-- 4. Initial Seed Data
-- 4.1 Default Score Setting
INSERT INTO "ScoreSetting" ("id", "attendancePoints", "latePoints", "taskWeight", "bonusWeight", "updatedAt")
VALUES ('default', 10.0, 5.0, 1.0, 1.0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 4.2 System Setting (Supervisor Info)
INSERT INTO "SystemSetting" ("key", "value", "updatedAt")
VALUES (
    'supervisor_card',
    '{"name":"Abdelrahman Mahmoud","title":"Software Engineer & Branch Supervisor","phone":"+20 100 000 0000","email":"abdelrahman@branch.eelu.edu.eg","linkedin":"https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0","statusBadge":"Active Supervision"}',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

-- 4.3 Academic Tracks
INSERT INTO "Track" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
    ('track_ai', 'Artificial Intelligence', 'تراك الذكاء الاصطناعي لتأهيل وتدريب الطلاب عملياً وتقنياً.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_prog', 'Programming', 'تراك البرمجة لتأهيل وتدريب الطلاب عملياً وتقنياً.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_cyber', 'Cyber Security', 'تراك الأمن السيبراني لتأهيل وتدريب الطلاب عملياً وتقنياً.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_web', 'Web Development', 'تراك تطوير الويب لتأهيل وتدريب الطلاب عملياً وتقنياً.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_career', 'Career Support', 'تراك التطوير المهني والدعم الوظيفي للطلاب.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_fin', 'Financial analysis', 'تراك التحليل المالي للأعمال.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_design', 'Graphic Design', 'تراك التصميم الجرافيكي وتجربة المستخدم.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_biz', 'Business Hub', 'تراك ريادة الأعمال وإدارة المشروعات.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('track_market', 'Digital Marketing', 'تراك التسويق الرقمي وإدارة الحملات.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- 4.4 Default Staff Accounts
-- Password for all is admin123 / chair123 / vicechair123 (Change after initial login!)
INSERT INTO "User" ("id", "name", "email", "password", "role", "status", "phone", "createdAt", "updatedAt")
VALUES
    ('admin_root', 'Main Admin', 'admin@branch.org', '$2b$10$XHNO3HtS6P.voX3KOeS86uwZ4vxlWGWb9obxOFN9MGw9If4gbdB32', 'ADMIN', 'APPROVED', '01000000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('chair_root', 'Branch Chairperson', 'chair@branch.org', '$2b$10$gvcezeyIgWvwaPmgl2fbD.nWQUIuirzliGNqXFxXvrPra2hb5sC06', 'CHAIR_PERSON', 'APPROVED', '01100000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vice_root', 'Vice Chairperson', 'vicechair@branch.org', '$2b$10$TyWwIHor91hrdBimajx1Y.2ukso8Nfa/zC6mS.Q8zmjNDz0iPWJ42', 'VICE_CHAIR', 'APPROVED', '01200000000', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;

-- 4.5 Branch Leadership Board
INSERT INTO "BranchLeader" ("id", "name", "roleTitle", "affiliation", "displayOrder", "createdAt", "updatedAt")
VALUES
    ('leader_1', 'Prof. Dr. Ahmed El-Sayed', 'Academic Branch Supervisor', 'Faculty of Information Technology, EELU', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('leader_2', 'Eng. Mostafa Hassan', 'Branch Chairperson', 'EELU Aswan Student Branch', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('leader_3', 'Eng. Nourhan Ahmed', 'Vice Chairperson', 'EELU Aswan Student Branch', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('leader_4', 'Eng. Abdelrahman Mahmoud', 'Software & Technology Director', 'Software Engineering & Systems', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Setup Completed Successfully!
