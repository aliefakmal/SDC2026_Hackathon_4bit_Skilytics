import { createHash } from "node:crypto";
import type { CourseView } from "./catalog";
import { SKILLS } from "../data/skills";

export const LEARN_CATALOG_URL = "https://learn.microsoft.com/api/catalog/?locale=en-us&type=learningPaths";
export const FCC_STRUCTURE_URL = "https://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/main/curriculum/structure/curriculum.json";
export const FCC_INTRO_URL = "https://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/main/client/i18n/locales/english/intro.json";
const TTL = 6 * 60 * 60 * 1000;
type Skill = { id: number; name: string; category: string };
type Provider = "microsoft" | "freecodecamp";
const providers: Provider[] = ["microsoft", "freecodecamp"];
const snapshots = new Map<Provider, { at: number; courses: CourseView[] }>();
const pending = new Map<Provider, Promise<void>>();
const retryAfter = new Map<Provider, number>();
let hydratePromise: Promise<void> | undefined;

export function courseSdg(text: string): string[] {
  const codes = ["4.4"];
  if (/sustainab|environmental|ecolog/i.test(text)) codes.unshift("4.7");
  if (/climate|carbon/i.test(text)) codes.unshift("13.3");
  if (/energy|renewable/i.test(text)) codes.unshift("7.3");
  if (/recycl|waste/i.test(text)) codes.unshift("12.5");
  if (/entrepreneur|small business/i.test(text)) codes.push("8.3");
  if (/accessibility|inclusive/i.test(text)) codes.push("10.2");
  if (/\b(ai|data|cloud|software|digital|business|productivity)\b/i.test(text)) codes.push("8.2");
  return [...new Set(codes)];
}

function matchingSkills(text: string, skills: Skill[]): Skill[] {
  return skills.filter((s) => {
    const aliases = SKILLS.find((entry) => entry.name === s.name)?.aliases ?? [s.name];
    return aliases.some((alias) => new RegExp("\\b" + alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(text));
  });
}

type LearnPath = { uid: string; title: string; summary?: string; url: string; duration_in_minutes: number; levels?: string[] };
export function mapLearnPaths(paths: LearnPath[], skills: Skill[], fetchedAt: string): CourseView[] {
  return paths.flatMap((p) => {
    let url: URL;
    try { url = new URL(p.url); } catch { return []; }
    if (url.protocol !== "https:" || url.hostname !== "learn.microsoft.com" || !url.pathname.includes("/training/paths/") || !p.uid || !p.title || !(p.duration_in_minutes > 0)) return [];
    const text = p.title + " " + (p.summary ?? "");
    const mapped = matchingSkills(text, skills);
    if (!mapped.length) return [];
    url.search = "";
    return [{ id: 1000000 + (createHash("sha256").update(p.uid).digest().readUInt32BE(0) % 2000000000),
      title: p.title, provider: "Microsoft Learn", url: url.toString(), costMyr: 0, costType: "free" as const,
      hrdcStatus: "not_claimable" as const, durationHours: Math.round(p.duration_in_minutes / 60 * 100) / 100,
      level: p.levels?.[0] ?? "beginner", language: "English", certificate: false, skills: mapped,
      lastVerified: fetchedAt, sdgCodes: courseSdg(text), catalogStale: false }];
  });
}

const FCC_SLUGS = ["responsive-web-design-v9", "javascript-v9", "front-end-development-libraries-v9", "python-v9",
  "relational-databases-v9", "back-end-development-and-apis-v9", "full-stack-developer-v9", "data-analysis-with-python",
  "machine-learning-with-python", "information-security", "learn-rag-mcp-fundamentals", "introduction-to-sql-and-postgresql",
  "learn-python-for-beginners", "learn-data-visualization-with-d3", "introduction-to-git-and-github", "learn-bash-scripting",
  "html-and-accessibility", "design-for-developers", "learn-algorithms-in-python"] as const;
type FccStructure = { superblocks: string[]; certifications: string[] };
type FccIntro = Record<string, { title?: string; intro?: string[] }>;
export function mapFccCourses(structure: FccStructure, intro: FccIntro, skills: Skill[], fetchedAt: string): CourseView[] {
  const available = new Set(structure.superblocks);
  const certifications = new Set(structure.certifications);
  return FCC_SLUGS.flatMap((slug) => {
    const meta = intro[slug];
    if (!available.has(slug) || !meta?.title) return [];
    const text = [meta.title, ...(meta.intro ?? [])].join(" ");
    const mapped = matchingSkills(text, skills);
    if (!mapped.length) return [];
    return [{ id: -1000000 - (createHash("sha256").update(slug).digest().readUInt32BE(0) % 400000000),
      title: meta.title, provider: "freeCodeCamp", url: `https://www.freecodecamp.org/learn/${slug}/`,
      costMyr: 0, costType: "free" as const, hrdcStatus: "not_claimable" as const,
      durationHours: null, level: "self-paced", language: "English", certificate: certifications.has(slug),
      skills: mapped, lastVerified: fetchedAt, sdgCodes: courseSdg(text), catalogStale: false }];
  });
}

async function hydrate() {
  if (process.env.NODE_TEST_CONTEXT || process.env.NODE_ENV === "test") return;
  try {
    const { pool } = await import("@workspace/db");
    const result = await pool.query("SELECT provider, fetched_at, payload FROM course_catalog_snapshots");
    for (const row of result.rows) if ((row.provider === "microsoft" || row.provider === "freecodecamp") && Array.isArray(row.payload))
      snapshots.set(row.provider, { at: new Date(row.fetched_at).getTime(), courses: row.payload });
  } catch (error) { console.warn("Course snapshot unavailable", error instanceof Error ? error.message : "unknown error"); }
}

async function save(provider: Provider, courses: CourseView[], at: number) {
  if (process.env.NODE_TEST_CONTEXT || process.env.NODE_ENV === "test") return;
  try {
    const { pool } = await import("@workspace/db");
    await pool.query("INSERT INTO course_catalog_snapshots (provider,fetched_at,payload) VALUES ($1,$2,$3::jsonb) ON CONFLICT (provider) DO UPDATE SET fetched_at=EXCLUDED.fetched_at,payload=EXCLUDED.payload", [provider, new Date(at), JSON.stringify(courses)]);
  } catch (error) { console.warn("Course snapshot not persisted", error instanceof Error ? error.message : "unknown error"); }
}

async function refresh(provider: Provider, skills: Skill[]) {
  if (pending.has(provider) || Date.now() < (retryAfter.get(provider) ?? 0)) return pending.get(provider);
  const job = (async () => {
    try {
      const fetchedAt = new Date().toISOString();
      let courses: CourseView[];
      if (provider === "microsoft") {
        const res = await fetch(LEARN_CATALOG_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json() as { learningPaths?: LearnPath[] };
        if (!Array.isArray(body.learningPaths)) throw new Error("Invalid Microsoft catalogue");
        courses = mapLearnPaths(body.learningPaths, skills, fetchedAt);
      } else {
        const [structureRes, introRes] = await Promise.all([FCC_STRUCTURE_URL, FCC_INTRO_URL].map((url) => fetch(url, { signal: AbortSignal.timeout(8000) })));
        if (!structureRes.ok || !introRes.ok) throw new Error("freeCodeCamp catalogue unavailable");
        courses = mapFccCourses(await structureRes.json() as FccStructure, await introRes.json() as FccIntro, skills, fetchedAt);
      }
      if (!courses.length) throw new Error("Empty mapped catalogue");
      const at = Date.now(); snapshots.set(provider, { at, courses }); await save(provider, courses, at);
    } catch (error) {
      retryAfter.set(provider, Date.now() + 60_000);
      console.warn(`Course provider ${provider} refresh failed`, error instanceof Error ? error.message : "unknown error");
    } finally { pending.delete(provider); }
  })();
  pending.set(provider, job);
  return job;
}

/** Serve the last good snapshots immediately and refresh expired providers independently. */
export async function liveCourses(skills: Skill[]): Promise<CourseView[]> {
  hydratePromise ??= hydrate(); await hydratePromise;
  const jobs = providers.filter((provider) => !snapshots.has(provider) || Date.now() - snapshots.get(provider)!.at >= TTL).map((provider) => refresh(provider, skills));
  if (!snapshots.size) await Promise.allSettled(jobs); else void Promise.allSettled(jobs);
  return providers.flatMap((provider) => {
    const snapshot = snapshots.get(provider);
    return snapshot ? snapshot.courses.map((course) => ({ ...course, catalogStale: Date.now() - snapshot.at >= TTL })) : [];
  });
}
