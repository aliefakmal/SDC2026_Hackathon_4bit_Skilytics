import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/** Serve the same pinned speech data in development and production, without a CDN. */
export function localSpeechAssets(): Plugin {
  const root = path.resolve(import.meta.dirname, "node_modules/@spelling-creator/spellophone");
  const data = path.join(root, "espeak-ng-data");
  const manifest = JSON.parse(fs.readFileSync(path.join(data, "manifest.json"), "utf8"));
  manifest.dictionaries = Object.fromEntries(Object.entries(manifest.dictionaries).filter(([lang]) => ["en", "ms", "cmn"].includes(lang)));
  const files = new Map<string, Buffer>([
    ["manifest.json", Buffer.from(JSON.stringify(manifest))],
    ["LICENSE.txt", fs.readFileSync(path.join(root, "LICENSE"))],
    ["SOURCES.txt", Buffer.from("eSpeak NG 1.52.0: https://github.com/espeak-ng/espeak-ng/tree/1.52.0\nSpellophone 0.2.1: https://github.com/Spelling-Creator/spellophone\nDistributed under GPL-3.0-or-later.\nSkilytics integration source: https://github.com/ameer-yusoff/SDC2026_Hackathon_4bit_Skilytics\n")],
  ]);
  for (const entry of [manifest.core, ...Object.values(manifest.dictionaries)] as { file: string }[]) files.set(entry.file, fs.readFileSync(path.join(data, entry.file)));
  return {
    name: "local-speech-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const prefix = "/tts/espeak/";
        if (!url.startsWith(prefix)) return next();
        const name = url.slice(prefix.length);
        const file = files.get(name);
        if (!file) { res.statusCode = 404; res.end(); return; }
        res.setHeader("Content-Type", name.endsWith(".json") ? "application/json" : name.endsWith(".gz") ? "application/octet-stream" : "text/plain; charset=utf-8");
        res.end(file);
      });
    },
    generateBundle() {
      for (const [name, source] of files) this.emitFile({ type: "asset", fileName: `tts/espeak/${name}`, source });
    },
  };
}
