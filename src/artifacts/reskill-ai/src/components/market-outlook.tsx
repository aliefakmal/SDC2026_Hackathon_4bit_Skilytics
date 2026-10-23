import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, RefreshCw, Loader2, TrendingUp, Cpu } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { useT } from "@/i18n";
import { roleTitle } from "@/lib/fmt";
import { Button } from "./ui/button";
import { ErrorBox, Rows } from "./kit";
type Tri = { en: string; ms: string; zh: string };
type Candidate = {
  roleId: number;
  title: string;
  titleMs: string;
  titleZh: string;
  sector: string;
  socCode: string;
  aiExposure: number | null;
  usageMy: number | null;
  projection: { growthPct: number; annualOpenings: number } | null;
  reason: Tri | null;
  confidence: "low" | "medium" | null;
};
type Outlook = {
  generated: boolean;
  generatedAt: string | null;
  model: string | null;
  baseYear: number;
  horizon: number;
  ai: Candidate[];
  demand: Candidate[];
  note: Tri | null;
  sources: { label: string; url: string; dataDate: string | null }[];
  reviewedAt: string;
  projectionPeriod: string;
};
const words = {
  en: {
    title: "Where could work be heading?",
    sub: "Explore career possibilities using public data and an AI outlook.",
    ai: "AI at work",
    demand: "Growing careers",
    years: "Years ahead",
    generate: "Get AI outlook",
    retry: "Try AI outlook again",
    loading: "Reading the sources and comparing careers…",
    estimate: "AI outlook",
    observed: "Data view",
    confidence: "Confidence",
    low: "Low",
    medium: "Medium",
    exposure: "AI task exposure now",
    growth: "Projected US growth",
    openings: "US openings per year",
    more: "More careers to explore",
    why: "Why this career?",
    sources: "Sources & how this works",
    limit: "US projections are a reference. Malaysian hiring can differ.",
    aiLimit: "Exposure measures observed AI assistance across tasks.",
    cache:
      "One outlook is shared for 24 hours. Changing language uses the same answer.",
    empty: "No source data is available yet.",
    next: "Explore career",
    based: "BLS reference",
    reviewed: "Snapshot reviewed",
    forecast: "Outlook for",
  },
  ms: {
    title: "Ke mana arah dunia kerja?",
    sub: "Terokai peluang kerjaya menggunakan data awam dan jangkaan AI.",
    ai: "AI dalam kerja",
    demand: "Kerjaya berpotensi",
    years: "Tahun akan datang",
    generate: "Lihat jangkaan AI",
    retry: "Cuba jangkaan AI lagi",
    loading: "Membaca sumber dan membandingkan kerjaya…",
    estimate: "Jangkaan AI",
    observed: "Paparan data",
    confidence: "Keyakinan",
    low: "Rendah",
    medium: "Sederhana",
    exposure: "Bantuan AI pada tugasan kini",
    growth: "Unjuran pertumbuhan AS",
    openings: "Peluang kerja AS setahun",
    more: "Kerjaya lain untuk diterokai",
    why: "Kenapa kerjaya ini?",
    sources: "Sumber & cara ia berfungsi",
    limit:
      "Unjuran AS ialah rujukan. Pengambilan pekerja di Malaysia boleh berbeza.",
    aiLimit: "Menunjukkan bantuan AI pada tugasan yang diperhatikan.",
    cache:
      "Satu jangkaan dikongsi selama 24 jam. Tukar bahasa menggunakan jawapan sama.",
    empty: "Data sumber belum tersedia.",
    next: "Terokai kerjaya",
    based: "Rujukan BLS",
    reviewed: "Snapshot disemak",
    forecast: "Jangkaan untuk",
  },
  zh: {
    title: "未来的工作会怎样发展？",
    sub: "结合公开数据与 AI 展望，探索职业可能性。",
    ai: "工作中的 AI",
    demand: "增长潜力职业",
    years: "展望年数",
    generate: "查看 AI 展望",
    retry: "重新尝试 AI 展望",
    loading: "正在阅读来源并比较职业…",
    estimate: "AI 展望",
    observed: "数据视图",
    confidence: "可信程度",
    low: "较低",
    medium: "中等",
    exposure: "目前 AI 任务参与程度",
    growth: "美国预计就业增长",
    openings: "美国每年职位空缺",
    more: "探索更多职业",
    why: "为什么推荐此职业？",
    sources: "来源与方法",
    limit: "美国预测仅作参考，马来西亚的招聘情况可能不同。",
    aiLimit: "表示已观察到的 AI 任务协助。",
    cache: "展望共享缓存 24 小时，切换语言沿用同一答案。",
    empty: "暂时没有可用来源数据。",
    next: "探索职业",
    based: "BLS 参考",
    reviewed: "快照审核日期",
    forecast: "展望年份",
  },
};
export function MarketOutlook() {
  const { lang } = useT(),
    w = words[lang];
  const qc = useQueryClient();
  const [horizon, setHorizon] = useState(3);
  const [mode, setMode] = useState<"ai" | "demand">("ai");
  const tried = useRef(new Set<number>());
  const key = ["public-market-outlook", horizon];
  const q = useQuery({
    queryKey: key,
    queryFn: () =>
      customFetch<Outlook>(`/api/market/outlook?horizon=${horizon}`),
    staleTime: 300000,
    refetchInterval: 300000,
    retry: false,
  });
  const generate = useMutation({
    mutationFn: (years: number) =>
      customFetch<Outlook>("/api/market/outlook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizon: years }),
      }),
    onSuccess: (data, years) =>
      qc.setQueryData(["public-market-outlook", years], data),
  });
  useEffect(() => {
    if (
      q.data &&
      !q.data.generated &&
      !tried.current.has(horizon) &&
      !generate.isPending
    ) {
      tried.current.add(horizon);
      generate.mutate(horizon);
    }
  }, [q.data, horizon, generate.isPending]);
  const data = q.data,
    list = data?.[mode] ?? [];
  const locale = { en: "en-GB", ms: "ms-MY", zh: "zh-CN" }[lang];
  const metric = (r: Candidate) =>
    mode === "ai"
      ? r.aiExposure == null
        ? "—"
        : `${Math.round(r.aiExposure * 100)}%`
      : r.projection
        ? `${r.projection.growthPct > 0 ? "+" : ""}${r.projection.growthPct.toLocaleString(locale)}%`
        : "—";
  const detail = (r: Candidate) => (
    <>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {r.reason?.[lang] ?? (mode === "ai" ? w.aiLimit : w.limit)}
      </p>
      {r.confidence && (
        <span className="mt-2 block text-[10px] text-muted-foreground">
          {w.confidence}: {w[r.confidence]}
        </span>
      )}
      <Link
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-primary"
        href={`/roles/${r.roleId}`}
      >
        {w.next}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </>
  );
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{w.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{w.sub}</p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-muted p-1" role="tablist">
          {(["ai", "demand"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold sm:text-sm ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {m === "ai" ? (
                <Cpu className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {w[m]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs">
          {w.years}
          <select
            className="min-h-11 rounded-lg border bg-card px-3"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </label>
      </div>
      {q.isLoading ? (
        <Rows n={3} h="h-40" />
      ) : q.isError ? (
        <ErrorBox error={q.error} retry={() => q.refetch()} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold">
              {data?.generated ? w.estimate : w.observed} · {w.forecast}{" "}
              {(data?.baseYear ?? new Date().getFullYear()) + horizon}
            </p>
            {mode === "demand" && (
              <span className="text-xs text-muted-foreground">
                {w.based} {data?.projectionPeriod}
              </span>
            )}
          </div>
          {generate.isPending && (
            <p
              className="flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs"
              role="status"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {w.loading}
            </p>
          )}
          {generate.isError && (
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">
                {w.observed} · {w.limit}
              </p>
              <Button
                variant="outline"
                className="mt-2 min-h-11 text-xs"
                onClick={() => generate.mutate(horizon)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {w.retry}
              </Button>
            </div>
          )}
          {!list.length ? (
            <p className="text-sm">{w.empty}</p>
          ) : (
            <div className="grid items-stretch gap-3 md:grid-cols-3">
              {list.slice(0, 3).map((r, i) => (
                <article
                  key={r.roleId}
                  className={`flex min-w-0 flex-col rounded-2xl border p-5 ${i === 0 ? "border-accent bg-[hsl(var(--gold-soft))] md:order-2" : i === 1 ? "bg-card md:order-1 md:mt-8" : "bg-card md:order-3 md:mt-14"}`}
                >
                  <span className="text-3xl font-black text-accent">
                    #{i + 1}
                  </span>
                  <h2 className="mt-2 text-lg font-bold leading-snug">
                    {roleTitle(r, lang)}
                  </h2>
                  <div className="my-4 rounded-xl bg-background/70 p-3">
                    <p className="text-[10px] text-muted-foreground">
                      {mode === "ai" ? w.exposure : w.growth}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-primary">
                      {metric(r)}
                    </p>
                    {mode === "demand" && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {w.openings}:{" "}
                        {r.projection?.annualOpenings.toLocaleString(locale)}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto">{detail(r)}</div>
                </article>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {mode === "ai" ? w.aiLimit : w.limit}
          </p>
          {list.length > 3 && (
            <section>
              <h2 className="mb-3 font-bold">{w.more}</h2>
              <div className="space-y-2">
                {list.slice(3).map((r, i) => (
                  <details
                    key={r.roleId}
                    className="rounded-xl border bg-card p-3"
                  >
                    <summary className="min-h-11 cursor-pointer text-sm font-semibold">
                      <span className="mr-2 text-accent">#{i + 4}</span>
                      {roleTitle(r, lang)}
                      <span className="ml-2 text-primary">{metric(r)}</span>
                    </summary>
                    <div className="pt-3">{detail(r)}</div>
                  </details>
                ))}
              </div>
            </section>
          )}
          <details className="rounded-xl border p-4">
            <summary className="min-h-11 cursor-pointer text-sm font-semibold">
              {w.sources}
            </summary>
            <p className="mb-3 text-xs text-muted-foreground">
              {data?.note?.[lang] ?? w.limit} {w.cache}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {w.reviewed}: {data?.reviewedAt} · {data?.model ?? w.observed}
            </p>
            <ul className="space-y-2">
              {data?.sources.map((s) => (
                <li key={s.url}>
                  <a
                    className="text-xs text-primary underline"
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label} · {s.dataDate ?? "—"}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
