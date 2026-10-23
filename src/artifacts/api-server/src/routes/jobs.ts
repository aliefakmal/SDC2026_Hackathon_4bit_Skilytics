import { Router } from "express";
import { z } from "zod";
import { db, profilesTable, plansTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getProfileRow, canAccessProfile } from "../lib/profiles";
import { learningState, allComplete } from "../lib/learning-journey";
import { loadSkills, loadRoles, loadCourses } from "../lib/catalog";
import { profileSkills } from "../lib/profile-skills";
import { scoreRole } from "../lib/scoring";
import { extractSkills } from "../lib/cv";
const router = Router();
type Job = {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  jobDescription: string;
  pubDate: string;
};
let snapshot: { at: number; jobs: Job[] } | undefined;
let pending: Promise<Job[]> | undefined;
export function malaysiaLocation(s: string) {
  return /\bmalaysia\b/i.test(s);
}
export function eligibleLocation(s: string) {
  return malaysiaLocation(s) || /^(anywhere|worldwide|global)$/i.test(s.trim());
}
export async function publicJobs() {
  if (snapshot && Date.now() - snapshot.at < 3600000) return snapshot.jobs;
  if (pending) return pending;
  pending = (async () => {
    const r = await fetch("https://jobicy.com/api/jobs?count=200", {
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw Error("jobs_unavailable");
    const body = (await r.json()) as { jobs?: Job[] };
    if (!Array.isArray(body.jobs)) throw Error("jobs_unavailable");
    const jobs = body.jobs.filter(
      (j) =>
        Number.isSafeInteger(j.id) &&
        typeof j.jobDescription === "string" &&
        /^https:\/\/jobicy\.com\/jobs\//.test(j.url) &&
        Number.isFinite(Date.parse(j.pubDate)) &&
        Date.parse(j.pubDate) >= Date.now() - 7 * 86400000,
    );
    snapshot = { at: Date.now(), jobs };
    return jobs;
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
router.get("/market/skill-demand", async (_req, res) => {
  try {
    const [jobs, skills] = await Promise.all([publicJobs().catch(() => [] as Job[]), loadSkills()]);
    const local = jobs.filter((j) => malaysiaLocation(j.jobGeo));
    const counts = new Map<number, number>();
    for (const j of local)
      for (const s of extractSkills(
        j.jobTitle + " " + j.jobDescription.replace(/<[^>]*>/g, " "),
        skills,
      ))
        counts.set(s.skillId, (counts.get(s.skillId) ?? 0) + 1);
    if (!local.length) {
      const [roles, courses] = await Promise.all([loadRoles(), loadCourses()]);
      const reviewed = [
        { title: "Administrative Assistant", count: 5179 },
        { title: "Digital Marketing Specialist", count: 4642 },
        { title: "Sales Representative", count: 4557 },
        { title: "Data Analyst", count: 3455 },
        { title: "Graphic Designer", count: 2644 },
      ];
      const weights = new Map<number, number>();
      for (const reference of reviewed) {
        const role = roles.find((r) => r.title === reference.title);
        if (!role) continue;
        for (const skill of role.skills.filter(
          (s) =>
            s.category !== "Human" &&
            courses.some((c) => c.skills.some((k) => k.id === s.skillId)),
        ))
          weights.set(
            skill.skillId,
            (weights.get(skill.skillId) ?? 0) +
              reference.count * skill.importance,
          );
      }
      const max = Math.max(1, ...weights.values());
      res.json({
        sample: reviewed.length,
        checkedAt: "2026-05-25",
        source: "DOSM JMI Q4 2025 · O*NET · editorial occupation crosswalk",
        skills: [...weights]
          .map(([id, n]) => ({
            id,
            name: skills.find((s) => s.id === id)!.name,
            count: Math.round((n / max) * 100),
          }))
          .sort((a, b) => b.count - a.count),
      });
      return;
    }
    res.json({
      sample: local.length,
      checkedAt: new Date(snapshot!.at).toISOString(),
      source: "Jobicy",
      skills: [...counts]
        .map(([id, count]) => ({
          id,
          name: skills.find((s) => s.id === id)!.name,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    });
  } catch {
    res.status(503).json({ error: "jobs_unavailable" });
  }
});
router.get("/profiles/:id/jobs", async (req, res) => {
  const p = await getProfileRow(
    z.coerce.number().int().positive().parse(req.params.id),
  );
  if (!p || !(await canAccessProfile(req, p))) {
    res.status(404).json({ error: "profile_not_found" });
    return;
  }
  if (req.user && req.user.role !== "individual") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const state = await learningState(p.id);
  const [plan] = state.planId
    ? await db
        .select()
        .from(plansTable)
        .where(
          and(eq(plansTable.id, state.planId), eq(plansTable.profileId, p.id)),
        )
    : [];
  if (!plan || !state.finishedAt || !allComplete(plan.items, state.completed)) {
    res.status(409).json({ error: "pathway_incomplete" });
    return;
  }
  try {
    const [jobs, skills, roles, courses] = await Promise.all([
      publicJobs(),
      loadSkills(),
      loadRoles(),
      loadCourses(),
    ]);
    const learned = new Set(plan.items.flatMap((i) => i.skills));
    const existing = profileSkills(p, skills);
    for (const s of skills)
      if (learned.has(s.name) && !existing.some((k) => k.skillId === s.id))
        existing.push({
          skillId: s.id,
          status: "self_reported",
          evidence: null,
        });
    const ranked = jobs
      .filter((j) => eligibleLocation(j.jobGeo))
      .map((j) => {
        const required = extractSkills(
          j.jobTitle + " " + j.jobDescription.replace(/<[^>]*>/g, " "),
          skills,
        );
        const matched = required.filter((s) =>
          existing.some((k) => k.skillId === s.skillId),
        );
        const words = j.jobTitle
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length > 3);
        const role = roles
          .map((r) => ({
            r,
            n: words.filter((w) => r.title.toLowerCase().includes(w)).length,
          }))
          .sort((a, b) => b.n - a.n)[0];
        const fit = role?.n
          ? scoreRole({ ...p, skills: existing }, role.r, skills, courses).score
          : 0;
        return {
          id: j.id,
          title: j.jobTitle,
          company: j.companyName,
          location: j.jobGeo,
          url: j.url,
          posted: j.pubDate,
          matched: matched.map(
            (s) => skills.find((k) => k.id === s.skillId)!.name,
          ),
          missing: required
            .filter((s) => !matched.includes(s))
            .map((s) => skills.find((k) => k.id === s.skillId)!.name),
          score: matched.length * 10 + fit / 10,
        };
      })
      .sort((a, b) => b.score - a.score);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      checkedAt: new Date(snapshot!.at).toISOString(),
      jobs: ranked,
      source: "Jobicy",
    });
  } catch {
    res.status(503).json({ error: "jobs_unavailable" });
  }
});
export default router;
