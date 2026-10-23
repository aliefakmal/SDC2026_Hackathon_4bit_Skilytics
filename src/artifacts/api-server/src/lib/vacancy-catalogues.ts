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
  if (cache && Date.now() - cache.at < 86400000) return cache.rows.filter(j=>!j.expiresAt||j.expiresAt>Date.now());
  if (pending) return pending;
  pending = (async () => {
    const rows: Vacancy[] = [];
    let successes = 0;
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
            expiresAt:j.expiryDate*1000,
            source: "Himalayas",
            sourceUrl: j.guid,
          });
        }
      }
    } catch {}
    if (!successes) throw Error("jobs_unavailable");
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
    return cache.rows.filter(j=>!j.expiresAt||j.expiresAt>Date.now());
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
