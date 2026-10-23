import policy from "../data/self-directed-roles.json";
import { ROLES } from "../data/roles";
import type { CourseView, RoleView } from "./catalog";
import { courseFitsRole } from "./course-relevance";
export const SELF_DIRECTED_POLICY = policy;
export function selfDirectedRoles(roles: RoleView[], courses: CourseView[]) {
  return roles.filter(role => {
    if (Object.hasOwn(policy.excluded, role.title) || /engineering|healthcare/i.test(role.sector)) return false;
    const core = (policy.coreSkills as Record<string,string[]>)[role.title]
      ?? ROLES.find(r=>r.title === role.title)?.skills.filter(([,importance])=>importance >= 3).map(([name])=>name) ?? [];
    return role.skills.some(skill => core.includes(skill.name) && courses.some(course => courseFitsRole(course,role.title) && course.skills.some(k=>k.id === skill.skillId)));
  });
}
