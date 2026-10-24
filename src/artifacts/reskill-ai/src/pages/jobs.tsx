import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Trophy, ArrowUpRight } from "lucide-react";
import { useT } from "@/i18n";
import { jobWords } from "@/components/market-skills";
import { skillLabel } from "@/lib/skill-label";
import { roleGoals } from "@/components/matcher-skill-map";
import { PageHeader, Rows, ErrorBox, Meter, SdgBadge } from "@/components/kit";
type Vacancy = {
  source?: string;
  sourceUrl?: string;
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  matched: string[];
  missing: string[];
  skillsMatchPct: number | null;
  aiExposure: number | null;
  exposureRole: {
    title: string;
    sector: string;
    sourceUrl: string | null;
  } | null;
};
const words = {
  en: {
    top: "Your top matches",
    rest: "More jobs to explore",
    match: "Skills match",
    ai: "AI exposure",
    note: "Skills match counts recognised skills in the advert. AI exposure refers to a similar occupation, not this employer or a job-loss prediction. SDGs show work themes, not measured impact.",
  },
  ms: {
    top: "Padanan terbaik anda",
    rest: "Pekerjaan lain untuk diteroka",
    match: "Padanan kemahiran",
    ai: "Pendedahan AI",
    note: "Padanan mengira kemahiran yang dikenal pasti dalam iklan. Pendedahan AI merujuk pekerjaan seumpama, bukan majikan ini atau ramalan kehilangan kerja. SDG menunjukkan tema kerja, bukan impak yang diukur.",
  },
  zh: {
    top: "最适合您的职位",
    rest: "探索更多职位",
    match: "技能匹配",
    ai: "AI影响程度",
    note: "技能匹配根据广告中识别的技能计算。AI影响程度参考相似职业，并非该雇主的数据或失业预测。SDG表示工作主题，不代表实测影响。",
  },
};
export default function Jobs() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useT(),
    w = jobWords[lang],
    v = words[lang];
  const [limit, setLimit] = useState(10);
  const q = useQuery({
    queryKey: ["jobs", id],
    queryFn: () => customFetch<{ jobs: Vacancy[] }>(`/api/profiles/${id}/jobs`),
    retry: false,
  });
  const jobs = q.data?.jobs ?? [];
  const card = (j: Vacancy, rank: number, podium = false) => (
    <article
      key={j.id}
      className={`flex h-full min-w-0 flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${podium && rank === 1 ? "border-2 border-primary md:min-h-[440px]" : podium ? "md:min-h-[400px]" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${rank === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}
        >
          {rank === 1 ? (
            <Trophy className="h-5 w-5" aria-label="#1" />
          ) : (
            `#${rank}`
          )}
        </span>
        <div className="min-w-0">
          <h3 className="break-words text-lg font-bold leading-snug">
            {j.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {j.company} · {j.location}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="mb-2 text-xs font-semibold">{v.match}</p>
          <Meter
            max={100}
            value={j.skillsMatchPct}
            label={j.skillsMatchPct == null ? "—" : `${j.skillsMatchPct}%`}
          />
        </div>
        <div className="rounded-xl bg-sky-50 p-3" title={j.exposureRole?.title}>
          <p className="mb-2 text-xs font-semibold">{v.ai}</p>
          <Meter
            value={j.aiExposure}
            tone="slate"
            label={
              j.aiExposure == null ? "—" : `${Math.round(j.aiExposure * 100)}%`
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {j.matched.slice(0, 4).map((s) => (
          <span key={s} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs">
            {skillLabel(s, lang)}
          </span>
        ))}
      </div>
      {(j.missing.length > 0 || j.matched.length > 4) && (
        <details className="text-xs">
          <summary className="cursor-pointer py-1">{w.missing}</summary>
          <p className="mt-2">
            {w.matched}: {j.matched.map((s) => skillLabel(s, lang)).join(", ")}
          </p>
          {j.missing.length > 0 && (
            <p className="mt-2">
              {w.missing}:{" "}
              {j.missing.map((s) => skillLabel(s, lang)).join(", ")}
            </p>
          )}
        </details>
      )}
      <div className="flex flex-wrap gap-1">
        {roleGoals(j.exposureRole ?? { title: j.title, sector: "" }).map(
          (code, i) => (
            <SdgBadge key={code} code={code} compact primary={i === 0} />
          ),
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <a
          href={j.sourceUrl ?? j.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground underline"
        >
          {j.source ?? "Public vacancy catalogue"}
        </a>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
          href={j.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {w.apply}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
  return (
    <>
      <Link
        href="/me"
        className="inline-flex min-h-11 items-center text-primary"
      >
        ← {t("nav.workspace")}
      </Link>
      <PageHeader title={w.jobs} sub={w.jobNote} />
      {q.isLoading ? (
        <Rows n={4} />
      ) : q.isError ? (
        <ErrorBox error={q.error} retry={() => q.refetch()} />
      ) : !jobs.length ? (
        <p>{w.none}</p>
      ) : (
        <>
          <section aria-label={v.top}>
            <h2 className="mb-4 text-xl font-bold">{v.top}</h2>
            <div className="grid items-stretch gap-4 md:grid-cols-3">
              {jobs.slice(0, 3).map((j, i) => (
                <div
                  key={j.id}
                  className={
                    i === 0
                      ? "md:order-2"
                      : i === 1
                        ? "md:order-1 md:pt-10"
                        : "md:order-3 md:pt-16"
                  }
                >
                  {card(j, i + 1, true)}
                </div>
              ))}
            </div>
          </section>
          <p className="my-5 text-xs leading-relaxed text-muted-foreground">
            {v.note}
          </p>
          {jobs.length > 3 && (
            <section aria-label={v.rest}>
              <h2 className="mb-4 text-xl font-bold">{v.rest}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {jobs.slice(3, limit).map((j, i) => card(j, i + 4))}
              </div>
            </section>
          )}
          {limit < jobs.length && (
            <button
              className="mt-5 min-h-11 rounded-xl border px-4"
              onClick={() => setLimit((n) => n + 10)}
            >
              {w.more}
            </button>
          )}
        </>
      )}
      <p className="mt-5 text-xs">
        <a
          href="https://github.com/public-apis/public-apis#jobs"
          className="underline"
        >
          {w.source}
        </a>
      </p>
    </>
  );
}
