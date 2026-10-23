import { createHash } from "node:crypto";
import type { CourseView } from "./catalog";
import { SKILLS } from "../data/skills";
import { mentions } from "./occupational-skills";

// Public website search, not a documented developer API or an open-content licence.
// The shared fingerprint identifies the public RPC schema; no user credentials.
export const HUBSPOT_SEARCH_URL = "https://app.hubspot.com/api/chirp-frontend-external/v1/gateway/com.hubspot.learning.center.search.no.auth.rpc.PublicSearchService/search";
const FINGERPRINT = "nNyD99hcDXDg2dv8wHUIyxLuLWvMCU-G";
export type HubSpotTrack = {
  id: number; contentType: string; name: string; pagePath: string;
  duration: number; language: string; visibleOnLoggedOutPage: boolean;
  hasAward?: boolean; levels?: string[]; categories?: string[];
};
type Page = { type: string; data?: { results: HubSpotTrack[]; total: number; hasMore: boolean; offset?: { cursor: number } } };

export async function fetchHubSpotTracks(request: typeof fetch = fetch): Promise<HubSpotTrack[]> {
  const tracks = new Map<string, HubSpotTrack>();
  let cursor = 0;
  for (let page = 0; page < 20; page++) {
    const response = await request(HUBSPOT_SEARCH_URL, {
      method: "POST", headers: { "Content-Type": "application/json", "x-hs-fingerprint": FINGERPRINT },
      body: JSON.stringify({ language: "EN", contentTypes: ["TRACK"], pageLength: 50, offset: { cursor }, shouldFilterDeprecated: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HubSpot public catalogue HTTP ${response.status}`);
    const body = await response.json() as Page;
    const data = body.data;
    if (body.type !== "data" || !data || !Array.isArray(data.results) || !Number.isFinite(data.total)) throw new Error("Invalid HubSpot public catalogue");
    for (const item of data.results) {
      if (item.contentType === "TRACK" && item.language === "EN" && item.visibleOnLoggedOutPage && /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(item.pagePath)) tracks.set(item.pagePath, item);
    }
    if (!data.hasMore) return [...tracks.values()];
    const next = data.offset?.cursor;
    if (!Number.isInteger(next) || next! <= cursor || !data.results.length) throw new Error("Invalid HubSpot pagination");
    cursor = next!;
  }
  throw new Error("HubSpot catalogue pagination exceeded bound");
}

export function mapHubSpotTracks(tracks: HubSpotTrack[], skills: {id:number;name:string;category:string}[], fetchedAt: string): CourseView[] {
  return tracks.flatMap(track => {
    if (track.contentType !== "TRACK" || track.language !== "EN" || !track.visibleOnLoggedOutPage || !track.name?.trim() || !/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(track.pagePath) || !(track.duration > 0)) return [];
    // Use course subject/categories, not a passing example in a long description.
    const subject = `${track.name} ${(track.categories ?? []).join(" ").replaceAll("_", " ")}`;
    const mapped = skills.filter(s => [s.name, ...(SKILLS.find(k=>k.name === s.name)?.aliases ?? [])].some(a=>mentions(subject,a)));
    if (/content marketing/i.test(subject)) mapped.push(...skills.filter(s=>["Content Writing","Communications and Media"].includes(s.name)));
    if (/inbound marketing|email marketing|social media|\bseo\b|digital advertising/i.test(subject)) mapped.push(...skills.filter(s=>s.name === "Digital Marketing"));
    if (/inbound sales|sales enablement/i.test(subject)) mapped.push(...skills.filter(s=>s.name === "Sales and Negotiation"));
    if (/inbound service|customer success/i.test(subject)) mapped.push(...skills.filter(s=>s.name === "Customer Service"));
    const unique = [...new Map(mapped.map(s=>[s.id,s])).values()];
    if (!unique.length) return [];
    const legacy = track.pagePath === "digital-marketing" ? -2090000001 : track.pagePath === "content-marketing" ? -2090000002 : null;
    return [{ id: legacy ?? -1500000000 - createHash("sha256").update(track.pagePath).digest().readUInt32BE(0) % 400000000,
      title: track.name.trim(), provider: "HubSpot Academy", url: `https://academy.hubspot.com/courses/${track.pagePath}`,
      costMyr: 0, costType: "free", hrdcStatus: "not_claimable", durationHours: Math.round(track.duration/36)/100,
      level: track.levels?.[0]?.toLowerCase() ?? "self-paced", language: "English", certificate: track.hasAward === true,
      skills: unique, lastVerified: fetchedAt, sdgCodes: ["8.3"], catalogStale: false }];
  });
}
