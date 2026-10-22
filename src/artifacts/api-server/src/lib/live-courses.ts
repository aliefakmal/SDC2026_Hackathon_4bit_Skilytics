import { createHash } from "node:crypto";
import type { CourseView } from "./catalog";
import { SKILLS } from "../data/skills";

export const LEARN_CATALOG_URL = "https://learn.microsoft.com/api/catalog/?locale=en-us&type=learningPaths";
const TTL = 6 * 60 * 60 * 1000;
let cache: { at: number; courses: CourseView[] } | undefined;
let pending: Promise<CourseView[]> | undefined;
let retryAfter = 0;

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

type LearnPath = { uid: string; title: string; summary?: string; url: string; duration_in_minutes: number; levels?: string[]; last_modified?: string };
export function mapLearnPaths(paths: LearnPath[], skills: { id: number; name: string; category: string }[], fetchedAt: string): CourseView[] {
  return paths.flatMap((p) => {
    let url: URL;
    try { url = new URL(p.url); } catch { return []; }
    if (url.protocol !== "https:" || url.hostname !== "learn.microsoft.com" || !url.pathname.includes("/training/paths/") || !p.uid || !p.title || !(p.duration_in_minutes > 0)) return [];
    const text = p.title + " " + (p.summary ?? "");
    const mapped = skills.filter((s) => {
      const aliases = SKILLS.find((entry) => entry.name === s.name)?.aliases ?? [s.name];
      return aliases.some((alias) => new RegExp("\\b" + alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(text));
    });
    if (!mapped.length) return [];
    url.search = "";
    return [{
      id: 1000000 + (createHash("sha256").update(p.uid).digest().readUInt32BE(0) % 2000000000),
      title: p.title, provider: "Microsoft Learn", url: url.toString(), costMyr: 0, costType: "free" as const,
      hrdcStatus: "not_claimable" as const, durationHours: Math.round(p.duration_in_minutes / 60 * 100) / 100,
      level: p.levels?.[0] ?? "beginner", language: "English", certificate: false, skills: mapped,
      lastVerified: fetchedAt, sdgCodes: courseSdg(text),
    }];
  });
}

// Request-coalesced provider refresh. Expired data is withheld on failures.
export async function liveCourses(skills: { id: number; name: string; category: string }[]): Promise<CourseView[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.courses;
  if (pending) return pending;
  if (Date.now() < retryAfter) return [];
  pending = (async () => {
    try {
      const res = await fetch(LEARN_CATALOG_URL, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error("Provider HTTP " + res.status);
      const body = await res.json() as { learningPaths?: LearnPath[] };
      if (!Array.isArray(body.learningPaths)) throw new Error("Invalid provider catalogue");
      const courses = mapLearnPaths(body.learningPaths, skills, new Date().toISOString());
      if (!courses.length) throw new Error("Empty provider catalogue");
      cache = { at: Date.now(), courses };
      return courses;
    } catch {
      retryAfter = Date.now() + 60000;
      return [];
    } finally { pending = undefined; }
  })();
  return pending;
}
