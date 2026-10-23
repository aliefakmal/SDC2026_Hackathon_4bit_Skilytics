import { test } from "node:test";
import assert from "node:assert/strict";
import { selfDirectedRoles, SELF_DIRECTED_POLICY } from "./self-directed";
import { hubspotCourses } from "../data/hubspot";
import type { RoleView, CourseView } from "./catalog";
test("new suggestions exclude practical/regulated work and require course coverage of a core skill", () => {
  const role = (title: string, skill: string) => ({ title, skills: [{skillId:1,name:skill,category:"Business"}] }) as RoleView;
  const course = {title:"Digital Marketing Certification Course",skills:[{id:1,name:"Digital Marketing"}],roleScope:["Digital Marketing Specialist"]} as unknown as CourseView;
  assert.equal(selfDirectedRoles([role("Digital Marketing Specialist","Digital Marketing")],[course]).length,1);
  assert.equal(selfDirectedRoles([role("Digital Marketing Specialist","Data Visualisation")],[course]).length,0);
  assert.equal(selfDirectedRoles([role("Registered Nurse","Digital Marketing"),role("Solar PV Installer","Digital Marketing"),role("Accountant","Digital Marketing")],[course]).length,0);
  assert.equal(selfDirectedRoles([role("Digital Marketing Specialist","Digital Marketing")],[]).length,0);
  assert.equal(new Set(SELF_DIRECTED_POLICY.included).size,15);
});
test("reviewed public marketing courses cover the actual source skills and preserve direct provider URLs", () => {
  const courses = hubspotCourses([{id:1,name:"Digital Marketing",category:"Business"},{id:2,name:"Communications and Media",category:"Creative"}]);
  assert.equal(courses.length,2);
  assert.ok(courses.every(c=>new URL(c.url).hostname === "academy.hubspot.com" && c.costMyr === 0 && c.certificate));
  assert.ok(courses[1].skills.some(s=>s.name === "Communications and Media"));
  assert.equal(courses[0].durationHours,3.4);
});
