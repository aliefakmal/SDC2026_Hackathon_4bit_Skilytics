import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useT } from "@/i18n";
import { chooseVoice, speechParts, type SpeechLanguage } from "@/lib/speech";

const copy = {
  en: { listen: "Listen", stop: "Stop", info: "Free device voices · switches voices for mixed languages. English/Malay detection is approximate.", missing: "This device has no voice for: ", install: ". Add the language in your device’s speech settings, then try again.", failed: "Speech could not play. Check your device voices and try again.", loading: "Voices are not ready yet. Please try again in a moment." },
  ms: { listen: "Dengar", stop: "Henti", info: "Suara peranti percuma · bertukar suara untuk bahasa campuran. Pengesanan English/Melayu adalah anggaran.", missing: "Peranti ini tiada suara untuk: ", install: ". Tambahkan bahasa dalam tetapan pertuturan peranti, kemudian cuba lagi.", failed: "Bacaan tidak dapat dimainkan. Semak suara peranti dan cuba lagi.", loading: "Suara belum tersedia. Cuba lagi sebentar nanti." },
  zh: { listen: "朗读", stop: "停止", info: "免费使用设备语音 · 混合语言自动切换声音。英语与马来语识别为近似判断。", missing: "此设备缺少以下语言的声音：", install: "。请在设备语音设置中添加该语言后重试。", failed: "无法播放语音。请检查设备声音后重试。", loading: "语音尚未就绪，请稍后重试。" },
};
const names = { en: "English", ms: "Bahasa Melayu", zh: "中文" };

export function MultilingualListen({ text, language }: { text: string; language: string }) {
  const { lang } = useT();
  const words = copy[lang];
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
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
    setNotice("");
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
    if (!voices.current.length) { setNotice(words.loading); return; }
    const missing = [...new Set(parts.filter((part) => !chooseVoice(voices.current, part.lang)).map((part) => names[part.lang]))];
    if (missing.length) { setNotice(words.missing + missing.join(", ") + words.install); return; }
    setNotice("");
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
      utter.onerror = () => { if (token.current === session) { setSpeaking(false); setNotice(words.failed); } };
      utterance.current = utter;
      synth.speak(utter);
    };
    play(0);
  };
  return <div className="max-w-sm"><button type="button" onClick={toggle} aria-pressed={speaking} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted" title={words.info} data-testid="button-multilingual-listen">{speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}{speaking ? words.stop : words.listen}</button>{notice && <p className="mt-1 text-xs text-muted-foreground" role="status">{notice}</p>}</div>;
}
