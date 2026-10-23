import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchHubSpotTracks, mapHubSpotTracks, type HubSpotTrack } from "./hubspot-catalogue";

const track: HubSpotTrack = {id:1,contentType:"TRACK",name:"Content Marketing",pagePath:"content-marketing",duration:30180,language:"EN",visibleOnLoggedOutPage:true,hasAward:true,categories:["CONTENT_MARKETING"]};
test("public search paginates, deduplicates and excludes lessons or private records", async () => {
  const cursors: number[] = [];
  const request = (async (_url: unknown, options: RequestInit) => {
    const body = JSON.parse(options.body as string); cursors.push(body.offset.cursor);
    assert.deepEqual(body.contentTypes,["TRACK"]);
    assert.equal(options.headers && "Authorization" in options.headers,false);
    return Response.json({type:"data",data:{total:4,results:body.offset.cursor === 0 ? [track,{...track,pagePath:"private",visibleOnLoggedOutPage:false}] : [track,{...track,pagePath:"lesson",contentType:"LESSON"}],hasMore:body.offset.cursor === 0,offset:{cursor:2}}});
  }) as typeof fetch;
  assert.equal((await fetchHubSpotTracks(request)).length,1);
  assert.deepEqual(cursors,[0,2]);
});
test("failed or looping pagination is rejected instead of publishing a partial snapshot", async () => {
  await assert.rejects(fetchHubSpotTracks((async()=>Response.json({type:"rpcError"})) as typeof fetch),/Invalid HubSpot/);
  await assert.rejects(fetchHubSpotTracks((async()=>Response.json({type:"data",data:{total:10,results:[track],hasMore:true,offset:{cursor:0}}})) as typeof fetch),/pagination/);
});
test("course metadata keeps seconds, award status, subject skills and safe direct URLs", () => {
  const skills = [{id:1,name:"Content Writing",category:"Creative"},{id:2,name:"Python",category:"Digital"}];
  const mapped = mapHubSpotTracks([track,{...track,pagePath:"../login"},{...track,pagePath:"video",contentType:"LESSON"}],skills,"2026-10-23T00:00:00Z");
  assert.equal(mapped.length,1);
  assert.equal(mapped[0].id,-2090000002);
  assert.equal(mapped[0].durationHours,8.38);
  assert.equal(mapped[0].url,"https://academy.hubspot.com/courses/content-marketing");
  assert.deepEqual(mapped[0].skills.map(s=>s.name),["Content Writing"]);
  assert.equal(mapped[0].certificate,true);
  assert.equal(mapHubSpotTracks([{...track,hasAward:false}],skills,"now")[0].certificate,false);
});
