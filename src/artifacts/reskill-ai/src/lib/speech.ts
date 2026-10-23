export type SpeechLanguage = "en" | "ms" | "zh";
export type SpeechPart = { text: string; lang: SpeechLanguage };
const malay = /\b(saya|anda|awak|kita|kami|yang|dan|dengan|untuk|boleh|mahu|minat|kemahiran|kerja|pengalaman|ialah|adalah|dalam|ini|itu|seperti|cuba|satu|anda|belajar|membantu|daripada|kepada)\b/gi;
const english = /\b(the|you|your|and|with|for|can|want|interest|skills|work|experience|is|are|this|that|like|try|one|learn|help|from|to)\b/gi;

/** Script boundaries are reliable; English/Malay detection is a conservative heuristic. */
export function speechParts(markdown: string, fallback: SpeechLanguage): SpeechPart[] {
  const text = markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/\S+/g, " ").replace(/[#*`_>|]/g, " ");
  const parts: SpeechPart[] = [];
  for (const sentence of text.match(/[^.!?。！？\n]+[.!?。！？]?/g) ?? []) {
    const latin = sentence.replace(/[\p{Script=Han}\u3000-\u303f\uff00-\uffef]+/gu, " ");
    const msCount = (latin.match(malay) ?? []).length;
    const enCount = (latin.match(english) ?? []).length;
    const base: SpeechLanguage = msCount > enCount ? "ms" : enCount > msCount ? "en" : fallback === "zh" ? "en" : fallback;
    // Keep spaces/punctuation attached, but switch voice at Chinese/Latin boundaries.
    const runs = sentence.match(/[\p{Script=Han}\u3000-\u303f\uff00-\uffef]+|[^\p{Script=Han}\u3000-\u303f\uff00-\uffef]+/gu) ?? [];
    for (const run of runs) {
      const lang = /\p{Script=Han}/u.test(run) ? "zh" : base;
      for (const chunk of run.match(/.{1,180}(?:\s|$)|\S{1,180}/gu) ?? []) {
        if (/[\p{L}\p{N}]/u.test(chunk)) parts.push({ text: chunk.trim(), lang });
      }
    }
  }
  return parts;
}
