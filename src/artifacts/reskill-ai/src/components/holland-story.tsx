import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, FileText, Lightbulb, ChevronDown, Check } from "lucide-react";
import { useT } from "@/i18n";
import { Markdown } from "@/components/kit";

const copy = {
  en: { title: "Big ideas. Small, simple steps.", note: "While your explanation is being prepared, tap a picture to see how it works.", labels: ["Your interests", "Your experience", "One small step"], lessons: ["Your interests are like a compass. They point to activities you might enjoy. They do not measure how good you are at them.", "Your CV is like a backpack. It holds examples of things you have learned or tried. We connect one example to your interests.", "You do not need to plan your whole future today. A small activity can help you discover what you like."], simple: "ELI5 · Simple words, real examples", more: "Read the little story", less: "Close the story", action: "I’ll try this small step", done: "My small step is saved for this visit", translating: "Translating in the background. Your existing explanation stays here while you explore.", retry: "Retry translation" },
  ms: { title: "Idea besar. Langkah kecil dan mudah.", note: "Sementara penjelasan disediakan, tekan gambar untuk fahami caranya.", labels: ["Minat anda", "Pengalaman anda", "Satu langkah kecil"], lessons: ["Minat anda ibarat kompas. Ia menunjukkan aktiviti yang mungkin anda suka. Ia tidak mengukur tahap kebolehan anda.", "CV anda ibarat beg galas. Ia menyimpan contoh perkara yang pernah anda pelajari atau cuba. Kami kaitkan satu contoh dengan minat anda.", "Anda tidak perlu merancang seluruh masa depan hari ini. Aktiviti kecil boleh membantu anda mengenali minat sendiri."], simple: "ELI5 · Bahasa mudah, contoh sebenar", more: "Baca cerita ringkas", less: "Tutup cerita", action: "Saya akan cuba langkah kecil ini", done: "Langkah kecil disimpan untuk lawatan ini", translating: "Terjemahan berjalan di latar belakang. Penjelasan sedia ada kekal untuk anda terokai.", retry: "Cuba terjemahan semula" },
  zh: { title: "大想法，简单的小步骤。", note: "解读准备期间，点击图片了解它如何运作。", labels: ["你的兴趣", "你的经历", "一个小步骤"], lessons: ["兴趣就像指南针，指向你可能喜欢的活动。它不代表你的能力水平。", "简历就像背包，装着你学过或尝试过的事情。我们会将其中一个例子与你的兴趣联系起来。", "今天不必规划整个未来。一个小活动就能帮你发现自己喜欢什么。"], simple: "ELI5 · 简单语言，真实例子", more: "阅读小故事", less: "收起故事", action: "我会试试这个小步骤", done: "本次访问已记下这个小步骤", translating: "正在后台翻译。你可以继续探索已有的解读。", retry: "重试翻译" },
};
const icons = [Compass, FileText, Lightbulb];

export function HollandLoadingStory() {
  const { lang } = useT();
  const words = copy[lang];
  const [selected, setSelected] = useState(0);
  const reduce = useReducedMotion();
  return <div className="rounded-2xl border border-accent/30 bg-[hsl(var(--gold-soft))]/40 p-5" data-testid="holland-loading-story">
    <p className="text-xs font-bold text-accent">{words.simple}</p>
    <h3 className="mt-2 text-lg font-extrabold">{words.title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{words.note}</p>
    <div className="my-5 grid grid-cols-3 gap-2">
      {icons.map((Icon, i) => <button key={i} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-xs font-bold transition-colors ${selected === i ? "border-primary bg-background text-primary" : "border-transparent bg-background/50 text-muted-foreground"}`}>
        <motion.span animate={reduce ? {} : { y: [0, -6, 0], rotate: i === 0 ? [-8, 8, -8] : 0 }} transition={{ duration: 2.8, repeat: Infinity, delay: i * .3 }}><Icon className="h-8 w-8" /></motion.span>{words.labels[i]}
      </button>)}
    </div>
    <p className="min-h-20 rounded-xl bg-background p-4 text-sm leading-relaxed" aria-live="polite">{words.lessons[selected]}</p>
  </div>;
}

export function HollandStoryCard({ title, body, kind, index }: { title: string; body: string; kind: "compass" | "cv" | "action"; index: number }) {
  const { lang } = useT();
  const words = copy[lang];
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();
  const iconIndex = kind === "cv" ? 1 : kind === "action" ? 2 : 0;
  const Icon = icons[iconIndex];
  const paragraphs = body.trim().split(/\n\s*\n/);
  const preview = paragraphs[0] ?? body;
  const remainder = paragraphs.slice(1).join("\n\n");
  return <motion.article initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }} className={`rounded-2xl border p-5 ${kind === "cv" ? "border-blue-500/25 bg-blue-500/5" : kind === "action" ? "border-amber-500/25 bg-amber-500/5" : "border-primary/20 bg-card"}`}>
    {index === 0 && <p className="mb-3 text-xs font-bold text-accent">{words.simple}</p>}
    <div className="mb-3 flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background text-primary"><Icon className="h-6 w-6" /></span><div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{index + 1} · {words.labels[iconIndex]}</p><h3 className="text-base font-bold">{title}</h3></div></div>
    <div className="prose-sk text-base leading-loose"><Markdown>{preview}</Markdown></div>
    {remainder && <details className="mt-3 rounded-xl border border-border/60 bg-background/60 p-3"><summary className="flex min-h-8 cursor-pointer items-center gap-2 text-sm font-semibold text-primary"><ChevronDown className="h-4 w-4" />{words.more}</summary><div className="prose-sk mt-3 text-base leading-loose"><Markdown>{remainder}</Markdown></div></details>}
    {kind === "action" && <button type="button" aria-pressed={done} onClick={() => setDone(!done)} className="mt-4 flex min-h-11 items-center gap-2 rounded-xl border border-primary/25 bg-background px-3 py-2 text-left text-sm font-semibold text-primary"><Check className={`h-4 w-4 ${done ? "opacity-100" : "opacity-30"}`} />{done ? words.done : words.action}</button>}
  </motion.article>;
}

export function HollandTranslationNote({ failed, retry }: { failed: boolean; retry: () => void }) {
  const { lang } = useT();
  const failure = lang === "ms" ? "Terjemahan belum tersedia. Anda masih boleh membaca penjelasan sedia ada." : lang === "zh" ? "翻译暂不可用。你仍可阅读已有的解读。" : "Translation is unavailable. You can still read your existing explanation.";
  return <div className="mb-3 rounded-xl border border-accent/30 bg-muted/40 p-3 text-xs" role="status">{failed ? failure : copy[lang].translating}{failed && <button type="button" onClick={retry} className="ml-2 min-h-9 underline">{copy[lang].retry}</button>}</div>;
}
