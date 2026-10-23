import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/i18n";
import { chooseVoice, speechParts, type SpeechLanguage } from "@/lib/speech";
import { useToast } from "@/hooks/use-toast";

const copy = {
  en: { listen: "Listen", stop: "Stop", info: "Free device voices · switches voices for mixed languages. English/Malay detection is approximate.", missing: "This device has no voice for: ", install: ". Add the language in your device’s speech settings, then try again.", failed: "Speech could not play. Check your device voices and try again.", loading: "Voices are not ready yet. Please try again in a moment." },
  ms: { listen: "Dengar", stop: "Henti", info: "Suara peranti percuma · bertukar suara untuk bahasa campuran. Pengesanan English/Melayu adalah anggaran.", missing: "Peranti ini tiada suara untuk: ", install: ". Tambahkan bahasa dalam tetapan pertuturan peranti, kemudian cuba lagi.", failed: "Bacaan tidak dapat dimainkan. Semak suara peranti dan cuba lagi.", loading: "Suara belum tersedia. Cuba lagi sebentar nanti." },
  zh: { listen: "朗读", stop: "停止", info: "免费使用设备语音 · 混合语言自动切换声音。英语与马来语识别为近似判断。", missing: "此设备缺少以下语言的声音：", install: "。请在设备语音设置中添加该语言后重试。", failed: "无法播放语音。请检查设备声音后重试。", loading: "语音尚未就绪，请稍后重试。" },
};
const names = { en: "English", ms: "Bahasa Melayu", zh: "中文" };

export function MultilingualListen({ text, language }: { text: string; language: string }) {
  const { lang } = useT();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();
  const words = copy[lang];
  const [speaking, setSpeaking] = useState(false);
  const notify = (description: string) => toast({ title: lang === "ms" ? "Bacaan suara tidak tersedia" : lang === "zh" ? "语音暂不可用" : "Speech unavailable", description, variant: "destructive", duration: 6000 });
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const token = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const update = () => { voices.current = synth.getVoices(); };
    update();
    synth.addEventListener("voiceschanged", update);
    return () => { synth.removeEventListener("voiceschanged", update); };
  }, [supported]);
  useEffect(() => {
    setSpeaking(false);
    return () => { token.current++; if (supported) window.speechSynthesis.cancel(); };
  }, [text, language, lang, supported]);
  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    token.current++;
    synth.cancel();
    if (speaking) { setSpeaking(false); return; }
    voices.current = synth.getVoices();
    const parts = speechParts(text, (["en", "ms", "zh"].includes(language) ? language : "en") as SpeechLanguage);
    if (!voices.current.length) { notify(words.loading); return; }
    const missing = [...new Set(parts.filter((part) => !chooseVoice(voices.current, part.lang)).map((part) => names[part.lang]))];
    if (missing.length) { notify(words.missing + missing.join(", ") + words.install); return; }
    setSpeaking(true);
    const session = token.current;
    const play = (index: number) => {
      if (token.current !== session) return;
      if (index >= parts.length) { setSpeaking(false); utterance.current = null; return; }
      const part = parts[index];
      const voice = chooseVoice(voices.current, part.lang)!;
      const utter = new SpeechSynthesisUtterance(part.text);
      utter.voice = voice;
      utter.lang = voice.lang;
      utter.rate = .92;
      utter.onend = () => play(index + 1);
      utter.onerror = () => { if (token.current === session) { setSpeaking(false); notify(words.failed); } };
      utterance.current = utter;
      try { synth.speak(utter); } catch { setSpeaking(false); notify(words.failed); }
    };
    play(0);
  };
  return <motion.button type="button" onClick={toggle} aria-pressed={speaking} whileHover={reducedMotion ? undefined : { scale: 1.04 }} whileTap={reducedMotion ? undefined : { scale: .97 }} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${speaking ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20" : "border-primary/40 bg-[hsl(var(--gold-soft))] text-primary hover:border-primary hover:bg-primary/10"}`} title={words.info} data-testid="button-multilingual-listen">{speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{speaking ? words.stop : words.listen}{speaking && <span aria-hidden="true" className="flex h-5 items-center gap-0.5">{[0, 1, 2, 3].map((bar) => <motion.span key={bar} className="w-0.5 rounded-full bg-current" style={{ height: 14 }} animate={reducedMotion ? {} : { scaleY: [.3, 1, .3] }} transition={{ duration: .7, repeat: Infinity, delay: bar * .12 }} />)}</span>}</motion.button>;
}
