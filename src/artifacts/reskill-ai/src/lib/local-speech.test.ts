import test from "node:test";
import assert from "node:assert/strict";
import { createEspeak } from "@spelling-creator/spellophone/node";

test("bundled engine produces non-silent English, Malay and Mandarin audio without an API", async () => {
  const engine = await createEspeak({ languages: ["en", "ms", "cmn"] });
  for (const [voice, text] of [
    ["en-us", "Your interests are like a compass."],
    ["ms", "Minat anda ibarat kompas. Cuba satu langkah kecil hari ini."],
    ["cmn", "你的兴趣就像指南针。试试一个小步骤。"],
  ]) {
    engine.setVoice(voice);
    const audio = engine.synthesize(text, { rate: 150 });
    assert.equal(audio.sampleRate, 22050);
    assert.ok(audio.samples.length > 2205, `${voice}: at least 100 ms of audio`);
    assert.ok(audio.samples.some((sample) => Math.abs(sample) > 100), `${voice}: non-silent PCM`);
  }
});
