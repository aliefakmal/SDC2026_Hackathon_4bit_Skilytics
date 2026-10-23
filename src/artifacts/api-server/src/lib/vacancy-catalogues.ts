import { db, marketSourcesTable } from "@workspace/db";
import { createHash } from "node:crypto";
export type Vacancy = {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  jobDescription: string;
  pubDate: string;
  expiresAt?: number;
  source?: string;
  sourceUrl?: string;
};
let cache: { at: number; rows: Vacancy[] } | undefined;
let pending: Promise<Vacancy[]> | undefined;
const id = (s: string) =>
  -parseInt(createHash("sha256").update(s).digest("hex").slice(0, 12), 16);
const safe = (s: unknown): s is string => {
  try {
    return (
      typeof s === "string" && s.startsWith("https://") && !new URL(s).username
    );
  } catch {
    return false;
  }
};
export function himalayasMalaysia(j: {
  locationRestrictions?: string[];
  timezoneRestrictions?: number[];
}) {
  return (
    Array.isArray(j.locationRestrictions) &&
    (j.locationRestrictions.length === 0 ||
      j.locationRestrictions.some((s) => /^(malaysia|my)$/i.test(s))) &&
    Array.isArray(j.timezoneRestrictions) &&
    j.timezoneRestrictions.includes(8)
  );
}
export async function additionalVacancies() {
  if (cache && Date.now() - cache.at < 86400000)
    return cache.rows.filter((j) => !j.expiresAt || j.expiresAt > Date.now());
  if (pending) return pending;
  pending = (async () => {
    const rows: Vacancy[] = [];
    let successes = 0;
    const successful = new Set<string>();
    try {
      const r = await fetch("https://remotive.com/api/remote-jobs", {
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw Error();
      const d = (await r.json()) as { jobs: any[] };
      for (const j of d.jobs ?? [])
        if (safe(j.url))
          rows.push({
            id: id(j.url),
            url: j.url,
            jobTitle: j.title,
            companyName: j.company_name,
            jobGeo: j.candidate_required_location ?? "Unknown",
            jobDescription: j.description,
            pubDate: j.publication_date,
            source: "Remotive",
            sourceUrl: j.url,
          });
      successful.add("Remotive");
      successes++;
    } catch {}
    try {
      for (let page = 1; page <= 20; page++) {
        const r = await fetch(
          `https://himalayas.app/jobs/api/search?country=MY&sort=recent&page=${page}`,
          { signal: AbortSignal.timeout(15000) },
        );
        if (!r.ok) throw Error();
        const d = (await r.json()) as { jobs: any[] };
        if (!Array.isArray(d.jobs)) throw Error();
        successful.add("Himalayas");
        successes++;
        if (!d.jobs.length) break;
        for (const j of d.jobs) {
          if (
            !safe(j.applicationLink) ||
            !safe(j.guid) ||
            !himalayasMalaysia(j) ||
            !Number.isFinite(j.expiryDate) ||
            j.expiryDate * 1000 <= Date.now()
          )
            continue;
          // Country-filtered public API enforces MY and timezone eligibility. Keep its original application URL.
          rows.push({
            id: id(j.guid),
            url: j.applicationLink,
            jobTitle: j.title,
            companyName: j.companyName,
            jobGeo: "Malaysia",
            jobDescription: j.description ?? "",
            pubDate: new Date(j.pubDate * 1000).toISOString(),
            expiresAt: j.expiryDate * 1000,
            source: "Himalayas",
            sourceUrl: j.guid,
          });
        }
      }
    } catch {}
    try {
      const r = await fetch("https://remoteok.com/api", {
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw Error();
      const data = (await r.json()) as any[];
      if (!Array.isArray(data)) throw Error();
      for (const j of data.slice(1))
        if (
          safe(j.url) &&
          /^https:\/\/remoteok\.com\//.test(j.url) &&
          typeof j.description === "string" &&
          Number.isFinite(Date.parse(j.date)) &&
          Date.parse(j.date) > Date.now() - 30 * 86400000
        )
          rows.push({
            id: id(j.url),
            url: j.url,
            jobTitle: j.position,
            companyName: j.company,
            jobGeo: j.location || "Unknown",
            jobDescription: j.description,
            pubDate: j.date,
            source: "RemoteOK",
            sourceUrl: j.url,
          });
      successful.add("RemoteOK");
      successes++;
    } catch {}
    if (!successes) throw Error("jobs_unavailable");
    for (const [name, sourceId] of [
      ["Remotive", "remotive_jobs"],
      ["Himalayas", "himalayas_jobs"],
      ["RemoteOK", "remoteok_jobs"],
    ]) {
      const status = successful.has(name) ? "ok" : "error";
      const state = {
        status,
        lastFetchedAt: new Date(),
        recordCount: rows.filter((j) => j.source === name).length,
        version: "public-api-2026-10",
        detail:
          "Public unauthenticated provider response; count before profile matching. Daily cache; partial feed, not all market vacancies.",
        error:
          status === "error"
            ? "Provider unavailable; other public sources remain separate"
            : null,
      };
      await db
        .insert(marketSourcesTable)
        .values({ id: sourceId, ...state })
        .onConflictDoUpdate({ target: marketSourcesTable.id, set: state });
    }
    cache = {
      at: Date.now(),
      rows: [
        ...new Map(
          rows.map((j) => [
            j.companyName.toLowerCase() + "|" + j.jobTitle.toLowerCase(),
            j,
          ]),
        ).values(),
      ],
    };
    return cache.rows.filter((j) => !j.expiresAt || j.expiresAt > Date.now());
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}

export const vacancyFetchedAt = () => cache?.at ?? null;
