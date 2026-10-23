import { SKILLS } from "../data/skills";

export function mentions(text: string, term: string) {
  return new RegExp(
    "\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
    "i",
  ).test(text);
}

/** Application crosswalk, not an O*NET rating: retain the occupation link as evidence. */
export function softwareSkills(
  rows: Record<string, string>[],
  code: string,
  focus?: string[],
) {
  const examples = rows.filter((r) => r["O*NET-SOC Code"] === code);
  return SKILLS.flatMap((skill) => {
    if (focus && !focus.includes(skill.name)) return [];
    const evidence = examples.filter((r) =>
      skill.aliases.some((a) => mentions(r["Workplace Example"], a)),
    );
    return evidence.length
      ? [
          {
            ...skill,
            importance: evidence.some((r) => r["In Demand"] === "Y") ? 3 : 2,
          },
        ]
      : [];
  }).sort((a, b) => b.importance - a.importance);
}

export function taskSkills(
  rows: Record<string, string>[],
  code: string,
  focus: string[],
) {
  const tasks = rows.filter(
    (r) => r["O*NET-SOC Code"] === code && r["Task Type"] === "Core",
  );
  return SKILLS.filter(
    (s) =>
      focus.includes(s.name) &&
      s.category !== "Human" &&
      tasks.some((r) =>
        [s.name, ...s.aliases].some((a) => mentions(r.Task, a)),
      ),
  ).map((s) => ({ ...s, importance: 3 }));
}
