import { useCompany } from "@/lib/enterprise";
import { enterpriseWords } from "@/i18n/enterprise";
import { MarketOutlook } from "./market-outlook";
import { marketWords } from "@/i18n/market";
import { PageGuide } from "./page-guide";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useT } from "@/i18n";
import { skillLabel } from "@/lib/skill-label";
import { ErrorBox, Rows, Panel } from "./kit";
export const jobWords = {
  en: {
    tab: "Skills in demand",
    title: "What skills are employers asking for?",
    note: "Malaysia demand signal. When the live sample is empty, use five selected DOSM JMI Q4 2025 occupations, mapped editorially to O*NET skills with course coverage. The 0–100 index is a learning-priority proxy, not a vacancy count or measured worker shortage.",
    empty:
      "No Malaysian listings with recognised skills in the current sample. No ranking can be supported yet.",
    years: "Years ahead",
    scenario:
      "Planning example: index grows 5% per year. This is an assumption, not a forecast.",
    now: "Baseline index",
    next: "Scenario index",
    jobs: "Find a job",
    apply: "View job / apply",
    matched: "Skills you can bring",
    missing: "Skills to check",
    jobNote:
      "Suggested from CV skills, completed courses and Holland role fit. Not a hiring score. Job titles stay in their original language. Confirm location, qualifications and availability on the original listing; applying may require an employer account.",
    source:
      "Public vacancy catalogues: Jobicy (hourly), Himalayas and Remotive (daily). No API keys. Location restrictions, original links and source attribution are retained. Remotive listings are delayed by 24 hours.",
    none: "No Malaysia or worldwide remote vacancies in the current sample.",
    more: "Load more",
  },
  ms: {
    tab: "Kemahiran diperlukan",
    title: "Kemahiran apa yang majikan perlukan?",
    note: "Petunjuk permintaan Malaysia. Jika sampel live kosong, gunakan lima pekerjaan terpilih DOSM JMI S4 2025, dipadankan secara editorial kepada kemahiran O*NET yang ada kursus. Indeks 0–100 ialah proksi keutamaan belajar, bukan bilangan iklan atau ukuran kekurangan pekerja.",
    empty:
      "Tiada iklan Malaysia dengan kemahiran dikenal pasti dalam sampel semasa. Belum ada bukti untuk susunan kedudukan.",
    years: "Tahun ke hadapan",
    scenario:
      "Contoh perancangan: indeks meningkat 5% setahun. Ini andaian, bukan ramalan.",
    now: "Indeks asas",
    next: "Indeks senario",
    jobs: "Cari pekerjaan",
    apply: "Lihat kerja / mohon",
    matched: "Kemahiran yang anda bawa",
    missing: "Kemahiran untuk disemak",
    jobNote:
      "Cadangan berdasarkan kemahiran CV, kursus selesai dan padanan minat Holland. Bukan skor pengambilan kerja. Tajuk kerja kekal dalam bahasa asal. Semak lokasi, kelayakan dan ketersediaan pada iklan asal; permohonan mungkin memerlukan akaun majikan.",
    source:
      "Katalog vacancy awam: Jobicy (sejam), Himalayas dan Remotive (harian). Tanpa kunci API. Syarat lokasi, pautan asal dan atribusi dikekalkan. Iklan Remotive lewat 24 jam.",
    none: "Tiada kekosongan Malaysia atau remote seluruh dunia dalam sampel semasa.",
    more: "Muat lagi",
  },
  zh: {
    tab: "需求技能",
    title: "雇主正在寻找哪些技能？",
    note: "马来西亚需求信号。实时样本为空时，使用DOSM JMI 2025年第4季度的五个选定职业，经编辑映射至有课程的O*NET技能。0–100指数是学习优先级参考，不是招聘数量或实测人才短缺。",
    empty: "当前样本没有可识别技能的马来西亚职位，暂时无法提供有依据的排名。",
    years: "未来年数",
    scenario: "规划示例：假设指数每年增长5%。这是假设，不是预测。",
    now: "基准指数",
    next: "情景指数",
    jobs: "寻找工作",
    apply: "查看职位 / 申请",
    matched: "您具备的相关技能",
    missing: "需要核对的技能",
    jobNote:
      "根据简历技能、已完成课程和霍兰德兴趣匹配推荐，并非招聘评分。职位名称保留原文。请在原招聘页面确认地点、资格与职位状态；申请可能需要雇主账号。",
    source:
      "公开招聘目录：Jobicy每小时缓存，Himalayas及Remotive每天缓存，无需密钥。保留地点限制、原链接和来源。Remotive职位延迟24小时。",
    none: "当前样本没有马来西亚或全球远程职位。",
    more: "加载更多",
  },
};
export function MarketSkills({
  employer = false,
}: { employer?: boolean } = {}) {
  const company = useCompany(employer);
  const { lang } = useT(),
    w = jobWords[lang];
  const [years, setYears] = useState(3),
    [limit, setLimit] = useState(10);
  const q = useQuery({
    queryKey: ["market-skills"],
    queryFn: () =>
      customFetch<{
        sample: number;
        checkedAt: string;
        source: string;
        skills: { id: number; name: string; count: number }[];
      }>("/api/market/skill-demand"),
    retry: false,
  });
  return (
    <Panel title={w.title} meta={w.note}>
      <label className="block text-sm">
        {w.years}: <b>{years}</b>
        <input
          className="my-4 block w-full accent-[#7a1523]"
          type="range"
          min="1"
          max="10"
          value={years}
          onChange={(e) => setYears(+e.target.value)}
        />
      </label>
      <p className="mb-4 text-xs text-muted-foreground">{w.scenario}</p>
      {q.isLoading ? (
        <Rows n={3} />
      ) : q.isError ? (
        <ErrorBox error={q.error} retry={() => q.refetch()} />
      ) : !q.data?.skills.length ? (
        <p>{w.empty}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {q.data.skills.slice(0, 3).map((s, i) => (
              <article
                key={s.id}
                className={`rounded-2xl border p-4 ${i === 0 ? "border-accent bg-amber-50" : "bg-card"}`}
              >
                <b className="text-accent">#{i + 1}</b>
                <h3 className="mt-2 font-bold">{skillLabel(s.name, lang)}</h3>
                {employer && (
                  <p className="mt-2 text-xs">
                    {enterpriseWords[lang].gaps}:{" "}
                    {company.data?.members.filter((m) =>
                      m.skillNames && !m.skillNames.includes(s.name),
                    ).length ?? 0}{" "}
                    / {company.data?.profileCount ?? 0}
                  </p>
                )}
                <p className="mt-3 text-xs">
                  {w.now}: {s.count} → {w.next}:{" "}
                  {(s.count * 1.05 ** years).toFixed(1)}
                </p>
              </article>
            ))}
          </div>
          <ol className="mt-4 space-y-2">
            {q.data.skills.slice(3, limit).map((s, i) => (
              <li
                className="flex justify-between gap-3 rounded-xl border p-3 text-sm"
                key={s.id}
              >
                <b>
                  #{i + 4} {skillLabel(s.name, lang)}
                </b>
                <span>
                  {s.count} → {(s.count * 1.05 ** years).toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
          {limit < q.data.skills.length && (
            <button
              className="mt-3 min-h-11 rounded-xl border px-4"
              onClick={() => setLimit((n) => n + 10)}
            >
              {w.more}
            </button>
          )}
        </>
      )}
      <p className="mt-5 text-xs">
        {q.data?.source} · {q.data?.sample ?? 0} · {q.data?.checkedAt} ·{" "}
        <a
          href="https://github.com/Jobicy/remote-jobs-api"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {w.source}
        </a>
      </p>
    </Panel>
  );
}

export function MarketExplore() {
  const { lang } = useT(),
    w = jobWords[lang],
    m = marketWords[lang];
  const [tab, setTab] = useState("ai");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1"
        >
          {[
            ["ai", m.ai],
            ["demand", m.demand],
            ["skills", w.tab],
          ].map(([id, label]) => (
            <button
              className={`min-h-11 rounded-lg px-2 text-xs sm:text-sm ${tab === id ? "bg-primary text-primary-foreground" : ""}`}
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <PageGuide
          title={m.guide}
          steps={[
            { title: m.title, body: m.sub },
            { title: w.tab, body: w.note },
            { title: w.years, body: w.scenario },
          ]}
        />
      </div>
      {tab === "skills" ? (
        <MarketSkills />
      ) : (
        <MarketOutlook
          hideGuide
          selectedMode={tab === "demand" ? "demand" : "ai"}
        />
      )}
    </div>
  );
}
export function JobsSource() {
  const { lang } = useT(),
    w = jobWords[lang];
  return (
    <Panel title="Jobicy · Himalayas · Remotive" meta={w.source}>
      <div className="flex flex-wrap gap-4 text-sm"><a href="https://himalayas.app/api" target="_blank" rel="noreferrer" className="underline">Himalayas · API</a><a href="https://github.com/remotive-com/remote-jobs-api" target="_blank" rel="noreferrer" className="underline">Remotive · API</a></div>
      <a
        href="https://www.dosm.gov.my/uploads/release-content/file_20260525094010.pdf"
        className="block min-h-11 text-sm underline"
      >
        DOSM JMI Q4 2025 · selected occupations → O*NET skills
      </a>
      <a
        className="inline-flex min-h-11 items-center text-sm underline"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/Jobicy/remote-jobs-api"
      >
        Jobicy · REST API · Public dataset ↗
      </a>
    </Panel>
  );
}
