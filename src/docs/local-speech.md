# Local speech playback

Listen uses eSpeak NG 1.52.0 through Spellophone 0.2.1 in a dedicated browser worker. English (`en-us`), Malay (`ms`) and Mandarin (`cmn`) dictionaries are served with the application. There is no TTS API, API credential, token budget, or provider request quota. Text remains in the browser for synthesis. First playback downloads approximately 1.4 MB of runtime and voice assets; the voice is a formant synthesizer and sounds synthetic.

`tts-assets.ts` serves and emits the pinned package data in development and production. WASM and the worker are emitted by Vite. The Listen component resumes Web Audio during the click gesture, plays short PCM segments sequentially, and cancels playback when stopped, unmounted, or when the explanation/UI language changes. Synthesis language detection uses script boundaries and a conservative English/Malay heuristic; ambiguous mixed Latin text can be misclassified.

## Attribution and source

eSpeak NG and Spellophone are licensed under GPL-3.0-or-later. The separate speech worker imports the unmodified runtime. The complete license and source references are included in each build at `/tts/espeak/LICENSE.txt` and `/tts/espeak/SOURCES.txt`, also linked from Data Sources.

- eSpeak NG 1.52.0 source and build instructions: https://github.com/espeak-ng/espeak-ng/tree/1.52.0
- Spellophone source, wrapper, build scripts and license: https://github.com/Spelling-Creator/spellophone
- Exact dependency: `@spelling-creator/spellophone@0.2.1` (integrity pinned in `src/pnpm-lock.yaml`).
- Skilytics speech integration source: `src/artifacts/reskill-ai/src/lib/local-speech.worker.ts` and `src/artifacts/reskill-ai/src/components/multilingual-listen.tsx` in this public repository.

Engine tests synthesize all three languages and assert non-silent PCM. Browser playback also requires WebAssembly, Web Workers and Web Audio; hardware output and perceived pronunciation must be checked on the target device.
