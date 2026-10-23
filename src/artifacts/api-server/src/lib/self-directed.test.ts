import { test } from "node:test";
import assert from "node:assert/strict";
import { selfDirectedRoles, SELF_DIRECTED_POLICY } from "./self-directed";
import type { RoleView, CourseView } from "./catalog";
test("new suggestions exclude practical/regulated work and require course coverage of a core skill", () => {
  const role = (title: string, skill: string) => ({ title, skills: [{skillId:1,name:skill,category:"Business"}] }) as RoleView;
  const course = {title:"Digital Marketing Certification Course",skills:[{id:1,name:"Digital Marketing"}],roleScope:["Digital Marketing Specialist"]} as unknown as CourseView;
  assert.equal(selfDirectedRoles([role("Digital Marketing Specialist","Digital Marketing")],[course]).length,1);
  assert.equal(selfDirectedRoles([role("Digital Marketing Specialist","Data Visualisation")],[course]).length,0);
  assert.equal(selfDirectedRoles([role("Registered Nurse","Digital Marketing"),role("Solar PV Installer","Digital Marketing"),role("Accountant","Digital Marketing")],[course]).length,0);
  assert.equal(selfDirectedRoles([role("Digital Marketing Specialist","Digital Marketing")],[]).length,0);
  assert.equal(SELF_DIRECTED_POLICY.version,"self-directed-v2");
  const project = {title:"Project management basics",skills:[{id:1,name:"Project Management"}]} as unknown as CourseView;
  assert.equal(selfDirectedRoles([role("Project Management Specialist","Project Management")],[project]).length,1);
  assert.equal(selfDirectedRoles([role("Project Management Specialist","Microsoft Excel")],[project]).length,0);
});
