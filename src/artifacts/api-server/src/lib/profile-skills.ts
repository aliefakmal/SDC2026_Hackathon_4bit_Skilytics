import type { SkillRow, StoredProfileSkill } from "@workspace/db";
import { extractSkills } from "./cv";

/** Keep confirmed skills; infer cautiously from education and experience, never interests. */
export function profileSkills(
  p: {
    skills: StoredProfileSkill[];
    education?: string | null;
    experience?: string | null;
    currentRole?: string | null;
    cvText?: string | null;
  },
  catalogue: SkillRow[],
): StoredProfileSkill[] {
  const result = new Map(p.skills.map((skill) => [skill.skillId, skill]));
  const text = [p.education, p.experience, p.currentRole, p.cvText]
    .filter(Boolean)
    .join("\n");
  for (const skill of extractSkills(text, catalogue))
    if (!result.has(skill.skillId))
      result.set(skill.skillId, { ...skill, status: "inferred" });
  const rules = [
    {
      pattern: /data science|sains data|数据科学/i,
      names: [
        "Statistics",
        "Data Visualisation",
        "Machine Learning",
        "Mathematics",
        "Programming",
      ],
    },
    {
      pattern: /computer science|sains komputer|计算机科学/i,
      names: [
        "Problem Solving",
        "Software Testing",
        "Programming",
        "Complex Problem Solving",
      ],
    },
    {
      pattern: /accounting|perakaunan|会计/i,
      names: ["Financial Accounting", "Bookkeeping"],
    },
    {
      pattern:
        /supervis(ed|ing)|managed a team|team leader|memimpin pasukan|管理团队/i,
      names: ["Team Leadership"],
    },
  ];
  for (const rule of rules)
    if (rule.pattern.test(text))
      for (const name of rule.names) {
        const skill = catalogue.find((item) => item.name === name);
        if (skill && !result.has(skill.id))
          result.set(skill.id, {
            skillId: skill.id,
            status: "inferred",
            evidence: `Suggested from reviewed education or experience: ${text.match(rule.pattern)?.[0]}`,
          });
      }
  return [...result.values()];
}
