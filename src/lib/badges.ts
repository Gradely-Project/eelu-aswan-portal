export interface Badge {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  isUnlocked: boolean;
  progressText?: string;
}

export function computeStudentBadges(stats: {
  attendanceRate?: number;
  presentCount?: number;
  totalSessions?: number;
  rank?: number;
  bonusScore?: number;
  tasksScore?: number;
  submittedTasksCount?: number;
}): Badge[] {
  const attendanceRate = stats.attendanceRate ?? 0;
  const rank = stats.rank ?? 999;
  const bonus = stats.bonusScore ?? 0;
  const present = stats.presentCount ?? 0;
  const tasksScore = stats.tasksScore ?? 0;

  return [
    {
      id: "perfect_attendance",
      name: "Academic Discipline Honor",
      nameAr: "وسام الانضباط الأكاديمي التام",
      description: "حضور كافة المحاضرات التدريبية بنسبة 100% بدون أي غياب",
      icon: "🎯",
      color: "text-emerald-400 border-emerald-500/40",
      bgColor: "bg-emerald-500/10",
      isUnlocked: attendanceRate >= 100 && present >= 1,
      progressText: `${attendanceRate}% حضور`,
    },
    {
      id: "gold_champion",
      name: "Grand Track Valedictorian",
      nameAr: "وشاح الصدارة الأكاديمية المطلقة",
      description: "الحصول على الترتيب الأول في لوحة الشرف والتنافسية للتراك",
      icon: "👑",
      color: "text-amber-400 border-amber-500/40",
      bgColor: "bg-amber-500/10",
      isUnlocked: rank === 1,
      progressText: rank === 1 ? "المركز الأول 🥇" : `الترتيب الحالي: #${rank}`,
    },
    {
      id: "top_elite",
      name: "Dean's List Laureate",
      nameAr: "وسام التفوق الفخري (Top 3)",
      description: "ضمن خيرة الطلاب الثلاثة الأوائل على مستوى التراك",
      icon: "🏆",
      color: "text-blue-400 border-blue-500/40",
      bgColor: "bg-blue-500/10",
      isUnlocked: rank > 0 && rank <= 3,
      progressText: `الترتيب: #${rank}`,
    },
    {
      id: "bonus_hunter",
      name: "Academic Innovation Distinction",
      nameAr: "نوط التميز والابتكار الفردي",
      description: "حصد نقاط تميز إضافية معتمدة من هيئة التدريس والإشراف",
      icon: "⚡",
      color: "text-purple-400 border-purple-500/40",
      bgColor: "bg-purple-500/10",
      isUnlocked: bonus > 0,
      progressText: `${bonus} نقطة إضافية`,
    },
    {
      id: "task_master",
      name: "Mastery of Applied Practice",
      nameAr: "وسام الإتقان التطبيقي والمهام",
      description: "إنجاز وتسليم كافة التكليفات البرمجية والمشاريع بنجاح",
      icon: "🚀",
      color: "text-cyan-400 border-cyan-500/40",
      bgColor: "bg-cyan-500/10",
      isUnlocked: tasksScore > 0,
      progressText: `${tasksScore} نقطة تقييم`,
    },
  ];
}
