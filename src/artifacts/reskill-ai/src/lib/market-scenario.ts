/** Illustrative scenarios, not measured forecasts or job-loss probabilities. */
export const AI_REMAINING_TASK_PACE = 0.05;
export type ScenarioRole = {
  aiExposure: number | null;
  projection: { growthPct: number } | null;
};
export function scenarioPercent(
  mode: "ai" | "demand",
  role: ScenarioRole,
  years: number,
): number | null {
  const n = Math.min(10, Math.max(0, years));
  if (mode === "ai") {
    if (role.aiExposure == null || !Number.isFinite(role.aiExposure))
      return null;
    const current = Math.min(1, Math.max(0, role.aiExposure));
    return 100 * (1 - (1 - current) * (1 - AI_REMAINING_TASK_PACE) ** n);
  }
  const growth = role.projection?.growthPct;
  if (growth == null || !Number.isFinite(growth) || growth <= -100) return null;
  return 100 * ((1 + growth / 100) ** (n / 10) - 1);
}
