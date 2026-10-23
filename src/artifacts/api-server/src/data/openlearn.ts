import { createHash } from "node:crypto";
import type { CourseView } from "../lib/catalog";

// Public metadata reviewed against the linked publisher pages, 23 October 2026.
// Only titles/links and application-authored subject crosswalks are stored.
// Introductory courses are learning resources, not professional qualifications.
export const OPENLEARN_REVIEWED_AT = "2026-10-23T00:00:00Z";
export const OPENLEARN = [
  {
    title: "Data analysis: visualisations in Excel",
    hours: 6,
    level: "beginner",
    roles: [],
    path: "science-maths-technology/data-analysis-visualisations-excel/content-section-0",
    skills: ["Microsoft Excel", "Data Visualisation"],
    sdg: ["8.2"],
  },
  {
    title: "Start writing fiction",
    hours: 12,
    level: "beginner",
    roles: ["Content Writer"],
    path: "history-the-arts/creative-writing/start-writing-fiction/content-section-0",
    skills: ["Content Writing", "English Language", "Writing"],
    sdg: ["8.3"],
  },
  {
    title: "Manufacturing",
    hours: 20,
    level: "beginner",
    roles: [
      "Production Operator",
      "Quality Control Inspector",
      "Industrial Maintenance Technician",
      "Electrical Engineer",
      "Electrical and Electronics Technician",
    ],
    path: "science-maths-technology/design-innovation/manufacturing/content-section-0",
    skills: [
      "Production and Processing",
      "Production Line Operation",
      "Design",
    ],
    sdg: ["9.2"],
  },
  {
    title: "Energy resources: solar energy",
    hours: 2,
    level: "intermediate",
    roles: ["Solar PV Installer"],
    path: "nature-environment/environmental-studies/energy-resources-solar-energy/content-section-0",
    skills: ["Solar PV Systems", "Physics"],
    sdg: ["7.2", "13.3"],
  },
  {
    title: "So, you want to be a nurse? A brief introduction to nursing",
    hours: 6,
    level: "beginner",
    roles: ["Registered Nurse"],
    path: "health-sports-psychology/so-you-want-be-nurse-a-brief-introduction-nursing/content-section-0",
    skills: ["Medicine and Dentistry"],
    sdg: ["3.c"],
  },
  {
    title: "Learning to teach: making sense of learning to teach",
    hours: 5,
    level: "advanced",
    roles: ["Training and Development Specialist"],
    path: "education-development/learning-teach-making-sense-learning-teach/content-section-0",
    skills: ["Education and Training", "Instructional Design"],
    sdg: ["4.c"],
  },
  {
    title: "Translation as a career",
    hours: 4,
    level: "advanced",
    roles: ["Translator and Interpreter"],
    path: "languages/learning-languages/translation-career/content-section-0",
    skills: ["Translation", "Foreign Language"],
    sdg: ["8.3"],
  },
] as const;

export function openLearnCourses(
  skills: { id: number; name: string; category: string }[],
): CourseView[] {
  return OPENLEARN.flatMap((entry) => {
    const mapped = skills.filter((s) =>
      (entry.skills as readonly string[]).includes(s.name),
    );
    if (!mapped.length) return [];
    return [
      {
        id:
          -1900000000 -
          (createHash("sha256").update(entry.path).digest().readUInt32BE(0) %
            100000000),
        title: entry.title,
        provider: "OpenLearn",
        roleScope: entry.roles.length ? entry.roles : undefined,
        url: `https://www.open.edu/openlearn/${entry.path}`,
        costMyr: 0,
        costType: "free",
        hrdcStatus: "not_claimable",
        durationHours: entry.hours,
        level: entry.level,
        language: "English",
        certificate: false,
        skills: mapped,
        lastVerified: OPENLEARN_REVIEWED_AT,
        sdgCodes: [...entry.sdg],
        catalogStale: false,
      },
    ];
  });
}
