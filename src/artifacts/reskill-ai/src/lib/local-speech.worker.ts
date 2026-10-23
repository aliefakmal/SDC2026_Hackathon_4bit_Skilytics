import { createEspeak } from "@spelling-creator/spellophone/browser";
import type { SpeechLanguage } from "./speech";

let engine: ReturnType<typeof createEspeak> | undefined;
// Requests are serialized because the eSpeak instance is not thread safe.
let queue = Promise.resolve();
self.onmessage = (event: MessageEvent<{ id: number; text: string; lang: SpeechLanguage; dataUrl: string }>) => {
  const request = event.data;
  queue = queue.then(async () => {
    try {
      engine ??= createEspeak({ dataUrl: request.dataUrl, languages: ["en", "ms", "cmn"] }).catch((error) => { engine = undefined; throw error; });
      const speaker = await engine;
      speaker.setVoice(request.lang === "zh" ? "cmn" : request.lang === "en" ? "en-us" : "ms");
      const { samples, sampleRate } = speaker.synthesize(request.text, { rate: 150, pitch: 48 });
      // Copy out of the WASM memory before transferring ownership.
      const pcm = new Int16Array(samples);
      self.postMessage({ id: request.id, samples: pcm, sampleRate }, { transfer: [pcm.buffer] });
    } catch {
      self.postMessage({ id: request.id, error: true });
    }
  });
};
