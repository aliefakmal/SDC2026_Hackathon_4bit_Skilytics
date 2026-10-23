import test from "node:test";
import assert from "node:assert/strict";
import { chooseVoice, speechParts } from "./speech";

test("switches English, Malay and Mandarin voices within a mixed script", () => {
  const parts = speechParts("Your skills can help you. Anda boleh cuba kerja ini. 你可以试试 Python。", "en");
  assert.deepEqual([...new Set(parts.map((part) => part.lang))], ["en", "ms", "zh"]);
  assert.equal(parts.find((part) => part.text.includes("Python"))?.lang, "en");
});
test("cleans Markdown and keeps long text in small speakable chunks", () => {
  const parts = speechParts("### Your skills\n**Learn** [Python](https://example.com). " + "Learning ".repeat(80), "en");
  assert.ok(parts.every((part) => part.text.length <= 180));
  assert.ok(parts.every((part) => !/[#*]|https:/.test(part.text)));
  assert.ok(parts.map((part) => part.text).join(" ").includes("Python"));
});
test("does not silently substitute English when a Malay voice is missing", () => {
  const voices = [{ lang: "en-US", localService: true }, { lang: "zh-CN", localService: true }] as SpeechSynthesisVoice[];
  assert.equal(chooseVoice(voices, "ms"), undefined);
  assert.equal(chooseVoice(voices, "zh")?.lang, "zh-CN");
});
