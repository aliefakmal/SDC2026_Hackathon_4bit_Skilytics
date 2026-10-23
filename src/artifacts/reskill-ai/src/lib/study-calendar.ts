export type StudyCourse = {
  courseId: number;
  title: string;
  provider: string;
  startDate: string | null;
  deadline: string | null;
};
export const studyColors = [
  "#7a1523",
  "#2563eb",
  "#047857",
  "#9333ea",
  "#b45309",
  "#be185d",
  "#0e7490",
  "#4d7c0f",
  "#6d28d9",
];
export function monthCells(month: string) {
  const start = new Date(`${month}-01T12:00:00Z`);
  if (!Number.isFinite(start.getTime())) return [];
  const offset = (start.getUTCDay() + 6) % 7;
  const count = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) =>
    i < offset || i >= offset + count
      ? null
      : `${month}-${String(i - offset + 1).padStart(2, "0")}`,
  );
}
export function coursesOnDay<T extends StudyCourse>(
  courses: T[],
  date: string,
) {
  return courses.filter(
    (c) =>
      c.startDate && c.deadline && c.startDate <= date && date <= c.deadline,
  );
}
export function isAiWorkplaceCourse(c: { url: string; title: string }) {
  return (
    /\/training\/paths\/(explore-microsoft-365-copilot-business-chat|draft-analyze-present-microsoft-365-copilot|enhance-productivity-prebuilt-agents)\//.test(
      c.url,
    ) ||
    (/copilot|generative ai|responsible ai|prompt/i.test(c.title) &&
      /workplace|at work|productivity|business user|effective prompts|work smarter/i.test(
        c.title,
      ) &&
      !/azure|fabric|security operations|administ|architect|deploy|developer|github|trainer|educator|databricks|cosmos|endpoint|purview/i.test(
        c.title,
      ))
  );
}
export const studyWords = {
  en: {
    calendar: "Your study calendar",
    previous: "Previous month",
    next: "Next month",
    today: "Plan start",
    empty: "No course scheduled",
    courses: "courses",
    ai: "AI at work",
    aiNote: "Build on your skills with AI for everyday work.",
    tools:
      "Learning content is free. Some practice tools need a separate licence.",
    starts: "Start",
    ends: "Finish",
    skills: "Build your skills",
    select: "Choose a day to see your courses",
    missing: "Some dates still need your study-week estimate.",
  },
  ms: {
    calendar: "Kalendar belajar anda",
    previous: "Bulan sebelumnya",
    next: "Bulan seterusnya",
    today: "Mula pelan",
    empty: "Tiada kursus dijadualkan",
    courses: "kursus",
    ai: "AI untuk kerja",
    aiNote: "Mantapkan kemahiran dengan AI untuk kerja harian.",
    tools:
      "Kandungan pembelajaran percuma. Sesetengah alat latihan memerlukan lesen berasingan.",
    starts: "Mula",
    ends: "Selesai",
    skills: "Bina kemahiran anda",
    select: "Pilih hari untuk lihat kursus anda",
    missing: "Sesetengah tarikh masih memerlukan anggaran minggu belajar anda.",
  },
  zh: {
    calendar: "你的学习日历",
    previous: "上个月",
    next: "下个月",
    today: "计划开始",
    empty: "当天没有安排课程",
    courses: "门课程",
    ai: "工作中的 AI",
    aiNote: "用 AI 提升技能，让日常工作更轻松。",
    tools: "学习内容免费。部分练习工具需要另购许可。",
    starts: "开始",
    ends: "完成",
    skills: "提升你的技能",
    select: "选一天，查看你的课程",
    missing: "部分日期仍需填写预计学习周数。",
  },
};
