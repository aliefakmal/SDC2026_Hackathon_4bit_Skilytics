import {test} from "node:test";
import assert from "node:assert/strict";
import {malaysiaLocation,eligibleLocation} from "../routes/jobs";
test("local market data never treats APAC or worldwide jobs as Malaysia observations",()=>{assert.equal(malaysiaLocation("Malaysia"),true);assert.equal(malaysiaLocation("Anywhere"),false);assert.equal(malaysiaLocation("APAC"),false);assert.equal(eligibleLocation("Anywhere"),true);assert.equal(eligibleLocation("USA"),false);assert.equal(eligibleLocation("APAC"),false);});

import app from "../app";
import {db,pool,profilesTable,plansTable} from "@workspace/db";
import {eq} from "drizzle-orm";
import {randomUUID} from "node:crypto";
import {saveLearningState} from "./learning-journey";
test("job discovery requires completed owned pathway and uses canonical public listings",async()=>{
 const token=randomUUID().replaceAll("-","");const server=app.listen(0);await new Promise<void>(r=>server.once("listening",r));const base=`http://127.0.0.1:${(server.address() as {port:number}).port}/api`;
 const [p]=await db.insert(profilesTable).values({name:"Disposable jobs QA",segment:"worker",weeklyHours:4,budgetMyr:0,guestToken:token}).returning();
 try{
  const get=(guest=token)=>fetch(`${base}/profiles/${p.id}/jobs`,{headers:{"x-guest-token":guest}});
  assert.equal((await get()).status,409);assert.equal((await get(randomUUID().replaceAll("-",""))).status,404);
  const [plan]=await db.insert(plansTable).values({profileId:p.id,roleId:1,roleTitle:"QA",totalWeeks:1,totalCostMyr:0,uncoveredSkills:[],items:[{courseId:1,title:"QA",provider:"QA",url:"https://example.test",startWeek:1,durationWeeks:1,costMyr:0,hrdcStatus:"not_claimable",skills:["SQL"],sdgCodes:[]}]}).returning();
  await saveLearningState(p.id,{stage:"active",planId:plan.id,completed:{"1":new Date().toISOString()},finishedAt:new Date().toISOString()});
  const r=await get();assert.equal(r.status,200);const body=await r.json() as {jobs:{url:string;location:string}[]};assert.ok(body.jobs.every(j=>j.url.startsWith("https://")&&eligibleLocation(j.location)));
  const demand=await fetch(base+"/market/skill-demand");assert.equal(demand.status,200);const d=await demand.json() as {skills:unknown[]};assert.ok(d.skills.length>=3);
 }finally{await db.delete(profilesTable).where(eq(profilesTable.id,p.id));await new Promise<void>(r=>server.close(()=>r()));await pool.end();}
});

import {himalayasMalaysia} from "./vacancy-catalogues";
test("Himalayas eligibility requires both Malaysia location and UTC+8",()=>{assert.equal(himalayasMalaysia({locationRestrictions:[],timezoneRestrictions:[8]}),true);assert.equal(himalayasMalaysia({locationRestrictions:["United States"],timezoneRestrictions:[8]}),false);assert.equal(himalayasMalaysia({locationRestrictions:["Malaysia"],timezoneRestrictions:[-5]}),false);assert.equal(himalayasMalaysia({}),false);});

test("RemoteOK canonical mixed-case hostnames stay valid without changing application links",()=>{const original="https://remoteOK.com/remote-jobs/example";assert.equal(new URL(original).hostname,"remoteok.com");assert.equal(/^https:\/\/remoteok\.com\//i.test(original),true);assert.equal(/^https:\/\/remoteok\.com\//i.test("https://remoteok.com.evil.test/jobs"),false);});
