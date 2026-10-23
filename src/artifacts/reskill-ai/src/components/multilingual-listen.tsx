import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/i18n";
import { speechParts, type SpeechLanguage } from "@/lib/speech";
import SpeechWorker from "@/lib/local-speech.worker?worker";
import { useToast } from "@/hooks/use-toast";

const copy = {
  en: { listen: "Listen", stop: "Stop", info: "Free on-device speech · English, Malay and Mandarin · no API tokens", failed: "Local speech could not play. Check your connection while the speech files load, then try again.", loading: "Preparing voice…" },
  ms: { listen: "Dengar", stop: "Henti", info: "Bacaan percuma pada peranti · English, Melayu dan Mandarin · tiada token API", failed: "Bacaan setempat tidak dapat dimainkan. Semak sambungan semasa fail suara dimuatkan, kemudian cuba lagi.", loading: "Menyediakan suara…" },
  zh: { listen: "朗读", stop: "停止", info: "设备端免费语音 · 英语、马来语和普通话 · 无需 API 令牌", failed: "本地语音无法播放。请在语音文件加载时检查网络连接，然后重试。", loading: "正在准备语音…" },
};
export function MultilingualListen({ text, language }: { text: string; language: string }) {
  const { lang } = useT();
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();
  const words = copy[lang];
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const notify = (description: string) => toast({ title: lang === "ms" ? "Bacaan suara tidak tersedia" : lang === "zh" ? "语音暂不可用" : "Speech unavailable", description, variant: "destructive", duration: 6000 });
  const token = useRef(0);
  const worker = useRef<Worker | null>(null);
  const context = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const supported = typeof window !== "undefined" && "AudioContext" in window && "Worker" in window && "WebAssembly" in window;
  const stop = () => {
    token.current++;
    if (source.current) { source.current.onended = null; source.current.stop(); source.current.disconnect(); source.current = null; }
  };
  useEffect(() => {
    setSpeaking(false);
    setLoading(false);
    return stop;
  }, [text, language, lang, supported]);
  useEffect(() => () => { worker.current?.terminate(); void context.current?.close(); }, []);
  if (!supported) return null;

  const toggle = async () => {
    stop();
    if (speaking) { setSpeaking(false); setLoading(false); return; }
    const parts = speechParts(text, (["en", "ms", "zh"].includes(language) ? language : "en") as SpeechLanguage);
    if (!parts.length) return;
    setSpeaking(true);
    setLoading(true);
    const session = token.current;
    const fail = () => { if (token.current === session) { stop(); setSpeaking(false); setLoading(false); notify(words.failed); } };
    try {
      context.current ??= new AudioContext();
      // Resume inside the user gesture, before fetching the engine.
      await context.current.resume();
      if (token.current !== session) return;
      worker.current ??= new SpeechWorker();
    } catch { fail(); return; }
    const currentWorker = worker.current;
    let index = 0;
    const play = (index: number) => {
      if (token.current !== session) return;
      if (index >= parts.length) { setSpeaking(false); setLoading(false); source.current = null; return; }
      const part = parts[index];
      currentWorker.postMessage({ id: session, text: part.text, lang: part.lang, dataUrl: new URL(`${import.meta.env.BASE_URL}tts/espeak/`, window.location.origin).href });
    };
    currentWorker.onerror = () => { currentWorker.terminate(); worker.current = null; fail(); };
    currentWorker.onmessage = (event: MessageEvent<{ id: number; samples: Int16Array; sampleRate: number; error?: boolean }>) => {
      if (event.data.id !== session || token.current !== session) return;
      if (event.data.error) { fail(); return; }
      try {
        const { samples, sampleRate } = event.data;
        const ctx = context.current!;
        const buffer = ctx.createBuffer(1, samples.length, sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
        const node = ctx.createBufferSource();
        node.buffer = buffer;
        node.connect(ctx.destination);
        node.onended = () => { node.disconnect(); if (source.current === node) source.current = null; play(++index); };
        source.current = node;
        setLoading(false);
        node.start();
      } catch { fail(); }
    };
    play(0);
  };
  return <motion.button type="button" onClick={toggle} aria-pressed={speaking} whileHover={reducedMotion ? undefined : { scale: 1.04 }} whileTap={reducedMotion ? undefined : { scale: .97 }} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${speaking ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20" : "border-primary/40 bg-[hsl(var(--gold-soft))] text-primary hover:border-primary hover:bg-primary/10"}`} title={loading ? words.loading : words.info} data-testid="button-multilingual-listen">{loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{speaking ? words.stop : words.listen}{speaking && <span aria-hidden="true" className="flex h-5 items-center gap-0.5">{[0, 1, 2, 3].map((bar) => <motion.span key={bar} className="w-0.5 rounded-full bg-current" style={{ height: 14 }} animate={reducedMotion ? {} : { scaleY: [.3, 1, .3] }} transition={{ duration: .7, repeat: Infinity, delay: bar * .12 }} />)}</span>}</motion.button>;
}
