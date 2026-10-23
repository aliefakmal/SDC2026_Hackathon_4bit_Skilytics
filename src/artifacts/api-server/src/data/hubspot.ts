import type { CourseView } from "../lib/catalog";
// Public publisher metadata reviewed 23 October 2026. Manual selection, not a live API.
// Academy enrolment requires a free HubSpot account. No article/course content is copied.
export const HUBSPOT = [
  { id: -2090000001, title: "Digital Marketing Certification Course", path: "digital-marketing", hours: 3.4, skills: ["Digital Marketing", "Social Media Management", "Search Engine Optimisation", "Sales and Marketing"], roles: ["Digital Marketing Specialist"] },
  { id: -2090000002, title: "Content Marketing Certification Course", path: "content-marketing", hours: 8 + 23/60, skills: ["Content Writing", "Communications and Media", "Search Engine Optimisation"], roles: ["Content Writer", "Digital Marketing Specialist"] },
];
export function hubspotCourses(skills: {id:number;name:string;category:string}[]): CourseView[] {
  return HUBSPOT.map(c=>({id:c.id,title:c.title,provider:"HubSpot Academy",url:`https://academy.hubspot.com/courses/${c.path}`,roleScope:c.roles,costMyr:0,costType:"free",hrdcStatus:"not_claimable",durationHours:c.hours,level:"beginner",language:"English",certificate:true,skills:skills.filter(s=>c.skills.includes(s.name)),lastVerified:"2026-10-23T00:00:00Z",sdgCodes:["8.3"],catalogStale:false}));
}
