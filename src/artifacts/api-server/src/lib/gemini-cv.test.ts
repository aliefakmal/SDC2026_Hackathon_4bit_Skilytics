import assert from "node:assert/strict";
import { test } from "node:test";
import { chatWithImages } from "./llm";
test("CV JSON requests preserve the configured Gemini model and allow full transcription output", async () => {
  const keys = ["AI_PROVIDER","AI_AGENT_ROUTING","AI_TEST_MODE","GEMINI_API_KEY","GEMINI_CV_MODEL","GEMINI_MODEL","GEMINI_FALLBACK_MODEL"];
  const saved = keys.map((key) => process.env[key]), originalFetch = globalThis.fetch;
  let calls = 0;
  try {
    process.env.AI_PROVIDER = "gemini"; process.env.AI_AGENT_ROUTING = "single"; delete process.env.AI_TEST_MODE;
    process.env.GEMINI_API_KEY = "test-only";
    process.env.GEMINI_CV_MODEL = "gemini-3.8-flash";
    globalThis.fetch = async (input, init) => {
      calls++;
      assert.match(String(input), /gemini-3.8-flash:generateContent/);
      const body = JSON.parse(String(init?.body));
      assert.equal(body.generationConfig.maxOutputTokens, 8192);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(body.contents[0].parts[0].inlineData.data, "test-image");
      return new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{thought:true,text:"internal"},{text:'{"profile":{}}'}] } }] }));
    };
    const out = await chatWithImages("light", "Extract JSON", "CV", [{ mediaType:"image/jpeg",base64:"test-image" }], { agent:"cv" });
    assert.equal(calls, 1); assert.equal(out.content, '{"profile":{}}');
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key,i) => { if(saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; });
  }
});
