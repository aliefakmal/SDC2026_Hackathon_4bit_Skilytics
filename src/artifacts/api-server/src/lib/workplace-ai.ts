import type { CourseView } from "./catalog";

// Public, general workplace learning paths, reviewed against the provider on 2026-10-23.
const paths = [
  "/training/paths/explore-microsoft-365-copilot-business-chat/",
  "/training/paths/draft-analyze-present-microsoft-365-copilot/",
  "/training/paths/enhance-productivity-prebuilt-agents/",
];
export function workplaceAiCourses(courses: CourseView[]) {
  const eligible = courses.filter(
    (c) =>
      c.costMyr === 0 &&
      !c.catalogStale &&
      c.durationHours !== null &&
      c.durationHours > 0 &&
      !c.roleScope,
  );
  const chosen: CourseView[] = [];
  for (const path of paths) {
    const course = eligible.find((c) => {
      try {
        return (
          new URL(c.url).hostname === "learn.microsoft.com" &&
          new URL(c.url).pathname.endsWith(path)
        );
      } catch {
        return false;
      }
    });
    if (course && !chosen.some((c) => c.id === course.id)) chosen.push(course);
  }
  // If a catalogue entry is retired, use another general business-user course.
  const alternatives = eligible
    .filter(
      (c) =>
        /copilot|generative ai|responsible ai|prompt/i.test(c.title) &&
        /workplace|at work|productivity|business user|effective prompts|work smarter/i.test(
          c.title,
        ) &&
        !/azure|fabric|security operations|administ|architect|deploy|developer|github|trainer|educator|databricks|cosmos|endpoint|purview/i.test(
          c.title,
        ),
    )
    .sort((a, b) => (a.durationHours ?? 0) - (b.durationHours ?? 0));
  for (const c of alternatives) {
    if (chosen.length >= 3) break;
    if (!chosen.some((x) => x.id === c.id || x.url === c.url)) chosen.push(c);
  }
  return chosen;
}
