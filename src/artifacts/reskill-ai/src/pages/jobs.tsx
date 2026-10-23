import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useT } from "@/i18n";
import { jobWords } from "@/components/market-skills";
import { skillLabel } from "@/lib/skill-label";
import { PageHeader, Rows, ErrorBox, Panel } from "@/components/kit";
export default function Jobs() {
  const { id } = useParams<{ id: string }>(),
    { lang, t } = useT(),
    w = jobWords[lang];
  const [limit, setLimit] = useState(10);
  const q = useQuery({
    queryKey: ["jobs", id],
    queryFn: () =>
      customFetch<{
        jobs: {
          id: number;
          title: string;
          company: string;
          location: string;
          url: string;
          matched: string[];
          missing: string[];
        }[];
      }>(`/api/profiles/${id}/jobs`),
    retry: false,
  });
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
      ) : (
        <div className="space-y-4">
          {!q.data?.jobs.length && <p>{w.none}</p>}
          {q.data?.jobs.slice(0, limit).map((j, i) => (
            <Panel
              key={j.id}
              title={`${i + 1}. ${j.title}`}
              meta={`${j.company} · ${j.location}`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {j.matched.map((s) => (
                  <span
                    className="rounded bg-emerald-50 px-2 py-1 text-xs"
                    key={s}
                  >
                    {skillLabel(s, lang)}
                  </span>
                ))}
              </div>
              {j.missing.length > 0 && (
                <details className="mb-3 text-xs">
                  <summary>{w.missing}</summary>
                  {j.missing.map((s) => skillLabel(s, lang)).join(", ")}
                </details>
              )}
              <a
                className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                href={j.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {w.apply} ↗
              </a>
            </Panel>
          ))}
          {limit < (q.data?.jobs.length ?? 0) && (
            <button
              className="min-h-11 rounded-xl border px-4"
              onClick={() => setLimit((n) => n + 10)}
            >
              {w.more}
            </button>
          )}
        </div>
      )}
      <p className="mt-5 text-xs">
        <a
          href="https://github.com/Jobicy/remote-jobs-api"
          className="underline"
        >
          {w.source}
        </a>
      </p>
    </>
  );
}
