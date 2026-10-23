import { hashInput } from "./agents";
import type { ProfileRow } from "./profiles";

/** Excludes navigation state: only facts that can change the explanation belong here. */
export function hollandSource(p: ProfileRow) {
  return hashInput("holland-source-v1", p.cvExtractionKey, p.cvUploadedAt, p.cvText,
    p.name,p.segment,p.currentRole,p.organization,p.education,p.experience,p.goals,
    p.weeklyHours,p.budgetMyr,p.skills,p.riasecAnswers,p.riasecScores,p.riasecCode,p.cvEvidence);
}
