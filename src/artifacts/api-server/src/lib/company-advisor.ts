import { hashInput } from "./agents";
import type { companyData } from "./company";

type Company = Awaited<ReturnType<typeof companyData>>;
/** No names, employee IDs, raw CVs or cross-company records enter the advisor context. */
export function companyFutureContext(company: Company, years: number) {
  return {
    ...company,
    members: company.members.map(({ id, name, ...m }) => m),
    updatedAt: undefined,
    years,
    baseYear: new Date().getFullYear(),
    assumption:
      "Illustrative adoption scenario only: each year AI overlaps 5% of remaining tasks; no empirical company forecast, work-capacity or job-loss estimate. Skill gaps and completions are current observations, not future measurements.",
    suggestedKpis:
      "Label every target as a proposal, not a measured outcome. Use course completion, voluntary practice tasks and assessment of relevant gaps; never fabricated ROI.",
  };
}
export function companyAnalysisHash(
  organization: string | null,
  context: unknown,
) {
  return hashInput("company-future-v2", organization, context);
}
export function advisorRetrieval(company: Company, question: string) {
  const terms = question
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2);
  // This is bounded catalogue retrieval, not a model-generated course list.
  const courses = company.courseSuggestions
    .map((course) => ({
      course,
      score: terms.filter((t) =>
        `${course.title} ${course.skills.join(" ")}`.toLowerCase().includes(t),
      ).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ course }) => course);
  return {
    courses,
    sources: [
      {
        label: "O*NET occupation references",
        url: "https://www.onetcenter.org/database.html",
        dataDate:
          company.sources.find((s) => s.id === "onet")?.dataDate ?? null,
      },
      {
        label: "Anthropic Economic Index",
        url: "https://huggingface.co/datasets/Anthropic/EconomicIndex",
        dataDate:
          company.sources.find((s) => s.id === "aei_exposure")?.dataDate ??
          null,
      },
      ...courses.map((c) => ({
        label: `${c.provider}: ${c.title}`,
        url: c.url,
        dataDate: null,
      })),
    ],
  };
}
