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
      name: "100% Attendance Master",
      nameAr: "نجم الحضور التام",
      description: "حضور كافة المحاضرات بدون غياب (معدل 100%)",
      icon: "🎯",
      color: "text-emerald-400 border-emerald-500/40",
      bgColor: "bg-emerald-500/10",
      isUnlocked: attendanceRate >= 100 && present >= 1,
      progressText: `${attendanceRate}% حضور`,
    },
    {
      id: "gold_champion",
      name: "Rank #1 Champion",
      nameAr: "المتصدر الذهبي الأول",
      description: "الحصول على المركز الأول في ليدربورد التراك",
      icon: "👑",
      color: "text-amber-400 border-amber-500/40",
      bgColor: "bg-amber-500/10",
      isUnlocked: rank === 1,
      progressText: rank === 1 ? "المركز الأول" : `الترتيب الحالي: #${rank}`,
    },
    {
      id: "top_elite",
      name: "Podium Elite (Top 3)",
      nameAr: "فارس التتويج (Top 3)",
      description: "ضمن أفضل 3 طلاب متفوقين في التراك",
      icon: "🏆",
      color: "text-blue-400 border-blue-500/40",
      bgColor: "bg-blue-500/10",
      isUnlocked: rank > 0 && rank <= 3,
      progressText: `الترتيب: #${rank}`,
    },
    {
      id: "bonus_hunter",
      name: "Bonus Hunter",
      nameAr: "صائد نقاط البونص",
      description: "حصد نقاط تميز إضافية معتمدة من المدربين",
      icon: "⚡",
      color: "text-purple-400 border-purple-500/40",
      bgColor: "bg-purple-500/10",
      isUnlocked: bonus > 0,
      progressText: `${bonus} نقطة إضافية`,
    },
    {
      id: "task_master",
      name: "Task Striker",
      nameAr: "ملتزم بالتاسكات",
      description: "إنجاز وتسليم الواجبات والتطبيقات العملية",
      icon: "🚀",
      color: "text-cyan-400 border-cyan-500/40",
      bgColor: "bg-cyan-500/10",
      isUnlocked: tasksScore > 0,
      progressText: `${tasksScore} نقطة تقييم`,
    },
  ];
}
