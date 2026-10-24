import {test} from "node:test";
import assert from "node:assert/strict";
import audit from "../../../../data/source-access-audit.json";
import {SOURCES} from "./market";
test("every registered external source has a trilingual access audit, including authenticated AI services",()=>{
 assert.deepEqual(audit.rows.map(r=>r.id).sort(),SOURCES.map(s=>s.id).sort());
 for(const row of audit.rows){for(const language of ["en","ms","zh"] as const)assert.ok(row.note[language].length>20);assert.ok(row.documentation.startsWith("https://"));assert.ok(row.licence.length>10);}
 assert.equal(audit.rows.find(r=>r.id==="gemini")?.access,"service");
 assert.equal(audit.rows.find(r=>r.id==="runpod_main")?.access,"disabled");
 assert.equal(audit.rows.filter(r=>r.category==="catalogue"&&r.id.endsWith("_jobs")).length,3);
 assert.equal(audit.rows.some(r=>/jobicy/i.test(r.id+" "+r.documentation)),false);
});
