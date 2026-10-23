import {test} from "node:test";
import assert from "node:assert/strict";
import {malaysiaLocation,eligibleLocation} from "../routes/jobs";
test("local market data never treats APAC or worldwide jobs as Malaysia observations",()=>{assert.equal(malaysiaLocation("Malaysia"),true);assert.equal(malaysiaLocation("Anywhere"),false);assert.equal(malaysiaLocation("APAC"),false);assert.equal(eligibleLocation("Anywhere"),true);assert.equal(eligibleLocation("USA"),false);assert.equal(eligibleLocation("APAC"),false);});
