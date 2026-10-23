import policy from "../data/self-directed-roles.json";
import type { CourseView, RoleView } from "./catalog";
import { courseFitsRole } from "./course-relevance";
export const SELF_DIRECTED_POLICY = policy;
export function selfDirectedRoles(roles: RoleView[], courses: CourseView[]) {
  return roles.filter(r => policy.included.includes(r.title) && r.skills.some(s => (policy.coreSkills as Record<string,string[]>)[r.title]?.includes(s.name) && courses.some(c => courseFitsRole(c, r.title) && c.skills.some(k => k.id === s.skillId))));
}
