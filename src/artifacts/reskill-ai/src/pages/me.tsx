import { useLearning } from "@/lib/learning";
import { ClearGuestProfile } from "@/components/clear-guest-profile";
import { WorkspaceWelcome } from "@/components/journey-welcome";
import { LearningDashboard } from "@/components/learning-dashboard";
import { useState, useEffect, type FormEvent } from "react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  FileText,
  Loader2,
  LogOut,
  CalendarDays,
  Clock3,
  Wallet,
  CheckCircle2,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  useCreatePrediction,
  useGetDashboardSummary,
  useListPredictions,
  useListRoles,
  getDashboardSummary,
  listProfiles,
  getListPredictionsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListProfilesQueryKey,
  type Segment,
  type Profile,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AiWait,
  Empty,
  ErrorBox,
  GuestBanner,
  Markdown,
  PageHeader,
  Panel,
  Rows,
  SegTag,
  SourceList,
  Stat,
} from "@/components/kit";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { roleTitle, useFmt } from "@/lib/fmt";
import { LANG_SHORT, errCode, useErrText, useT, type Lang } from "@/i18n";

export function Workspace() {
  const { t, tk, lang } = useT();
  const f = useFmt();
  const { user, signOut } = useAuth();
  const search = useSearch();
  const qc = useQueryClient();
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (
        ["skilytics.activeProfile", "skilytics.onboarding.guest"].includes(
          event.key ?? "",
        )
      ) {
        void qc.invalidateQueries({ queryKey: getListProfilesQueryKey() });
        void qc.invalidateQueries({
          queryKey: getGetDashboardSummaryQueryKey(),
        });
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [qc]);
  const [, nav] = useLocation();
  const preset = new URLSearchParams(search).get("new");
  const profiles = useInfiniteQuery({
    queryKey: getListProfilesQueryKey(),
    initialPageParam: undefined as number | undefined,
    retry: false,
    queryFn: ({ signal }) =>
      listProfiles(
        { limit: 1 },
        { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) },
      ),
    getNextPageParam: () => undefined,
  });
  const p = profiles.data?.pages[0]?.[0];
  const sum = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      retry: false,
      queryFn: ({ signal }) =>
        getDashboardSummary({
          signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        }),
    },
  });
  if (preset === "worker" || preset === "graduate")
    return <Redirect to={`/onboarding/cv?seg=${preset}&new=1`} replace />;
  const w =
    lang === "ms"
      ? {
          profile: "Profil saya",
          device:
            "Satu peranti, satu profil. Intake baharu akan menggantikan profil lama.",
          ready: "Sedia untuk langkah seterusnya?",
          sub: "Kursus, tarikh akhir dan kemajuan anda di satu tempat.",
          details: "Lihat profil",
        }
      : lang === "zh"
        ? {
            profile: "我的资料",
            device: "每台设备仅保留一份资料。新的录入将替换旧资料。",
            ready: "准备好下一步了吗？",
            sub: "课程、截止日期及进度都在这里。",
            details: "查看资料",
          }
        : {
            profile: "My profile",
            device:
              "One device, one profile. A new intake replaces the previous one.",
            ready: "Ready for your next step?",
            sub: "Your courses, deadlines and progress in one place.",
            details: "View profile",
          };
  return (
    <>
      <PageHeader
        help={<WorkspaceWelcome />}
        title={user ? t("me.hello", { name: user.name }) : t("me.title")}
        sub={w.sub}
        actions={
          user ? (
            <Button
              variant="outline"
              className="min-h-11 gap-2 lg:hidden"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </Button>
          ) : undefined
        }
      />
      {!user && (
        <div className="mb-5 space-y-2">
          <GuestBanner />
          <p className="px-1 text-xs text-muted-foreground">{w.device}</p>
        </div>
      )}
      {profiles.isLoading ? (
        <Rows n={2} h="h-28" />
      ) : profiles.isError ? (
        <ErrorBox error={profiles.error} retry={() => profiles.refetch()} />
      ) : !p ? (
        <Empty
          title={w.ready}
          icon={<UserRound className="h-5 w-5" />}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                className="min-h-11"
                onClick={() => nav("/onboarding/cv?seg=worker&new=1")}
              >
                {t("landing.worker")}
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => nav("/onboarding/cv?seg=graduate&new=1")}
              >
                {t("landing.grad")}
              </Button>
            </div>
          }
        >
          {t("me.emptyBody")}
        </Empty>
      ) : (
        <>
          <WorkspaceMetrics p={p} />
          <div className="mt-5">
            <LearningDashboard p={p} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Panel title={w.profile}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.currentRole}
                  </p>
                </div>
                {!user && <ClearGuestProfile id={p.id} name={p.name} />}
              </div>
              <div className="my-4 flex flex-wrap gap-2 text-xs">
                <SegTag s={p.segment} />
                <span className="rounded-full bg-muted px-3 py-1">
                  {t("me.skillsN", { n: p.skills.length })}
                </span>
                {p.riasecCode && (
                  <span
                    translate="no"
                    className="rounded-full bg-[hsl(var(--gold-soft))] px-3 py-1 font-semibold"
                  >
                    RIASEC {p.riasecCode}
                  </span>
                )}
              </div>
              <Link
                href={`/me/profiles/${p.id}/intake`}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
              >
                {w.details}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Panel>
            <Panel title={t("me.activity")}>
              {sum.isLoading ? (
                <Rows n={2} h="h-10" />
              ) : sum.isError ? (
                <ErrorBox error={sum.error} retry={() => sum.refetch()} />
              ) : !sum.data?.recentActivity.length ? (
                <p className="text-sm text-muted-foreground">
                  {t("me.noActivity")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {sum.data.recentActivity.slice(0, 4).map((a, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 py-3 first:pt-0"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {tk("activity", a.kind)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {f.dateTime(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

function WorkspaceMetrics({ p }: { p: Profile }) {
  const { lang } = useT(),
    f = useFmt(),
    q = useLearning(p.id),
    j = q.data;
  const w =
    lang === "ms"
      ? {
          done: "Kursus selesai",
          next: "Tarikh akhir seterusnya",
          time: "Masa belajar",
          budget: "Bajet latihan",
          hours: "jam / minggu",
        }
      : lang === "zh"
        ? {
            done: "已完成课程",
            next: "下个截止日期",
            time: "学习时间",
            budget: "学习预算",
            hours: "小时 / 周",
          }
        : {
            done: "Courses completed",
            next: "Next deadline",
            time: "Study time",
            budget: "Training budget",
            hours: p.weeklyHours === 1 ? "hour / week" : "hours / week",
          };
  const done =
    j?.items.filter((i) => j.completed[String(i.courseId)]).length ?? 0;
  const next = j?.items
    .filter((i) => !j.completed[String(i.courseId)] && i.deadline)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))[0];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        {
          label: w.done,
          value: j ? `${done} / ${j.items.length}` : "—",
          Icon: CheckCircle2,
        },
        {
          label: w.next,
          value: next ? f.date(next.deadline) : "—",
          Icon: CalendarDays,
        },
        {
          label: w.time,
          value: `${f.num(p.weeklyHours)} ${w.hours}`,
          Icon: Clock3,
        },
        { label: w.budget, value: f.myr(p.budgetMyr), Icon: Wallet },
      ].map(({ label, value, Icon }) => (
        <div key={label} className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span>{label}</span>
          </div>
          <p className="break-words text-lg font-bold sm:text-xl">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function Outlook() {
  const { t, lang } = useT();
  const et = useErrText();
  const f = useFmt();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const roles = useListRoles();
  const list = useListPredictions({
    query: { queryKey: getListPredictionsQueryKey() },
  });
  const [question, setQuestion] = useState("");
  const [horizon, setHorizon] = useState(3);
  const [roleId, setRoleId] = useState("none");
  const [since, setSince] = useState<number | null>(null);
  const create = useCreatePrediction({
    mutation: {
      onSuccess: () => {
        setSince(null);
        setQuestion("");
        qc.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({
          title: t("outlook.ready"),
          description: !user ? t("guest.milestone") : undefined,
        });
      },
      onError: () => setSince(null),
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 3) return;
    setSince(Date.now());
    create.mutate({
      data: {
        question: question.trim(),
        horizonYears: horizon,
        lang,
        ...(roleId !== "none" ? { roleId: Number(roleId) } : {}),
      },
    });
  };
  return (
    <>
      <PageHeader
        eyebrow={t("nav.outlook")}
        title={t("outlook.title")}
        sub={t("outlook.sub")}
      />
      {!user && (
        <div className="mb-5">
          <GuestBanner compact />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Panel title={t("outlook.ask")} className="h-fit lg:sticky lg:top-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="q">{t("outlook.question")}</Label>
              <Textarea
                id="q"
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("outlook.questionPh")}
                data-testid="input-question"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("outlook.horizon", { n: horizon })}</Label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[horizon]}
                onValueChange={(v) => setHorizon(v[0] ?? 3)}
                className="py-3"
                aria-label={t("outlook.horizon", { n: horizon })}
                data-testid="slider-horizon"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("outlook.role")}</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="min-h-11" data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("outlook.anyRole")}</SelectItem>
                  {(roles.data ?? []).map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {roleTitle(r, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="min-h-11 w-full"
              disabled={create.isPending || question.trim().length < 3}
              data-testid="button-ask"
            >
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("outlook.submit")}
            </Button>
            {create.isPending && since && <AiWait since={since} />}
            {create.isError && (
              <ErrorBox
                message={
                  errCode(create.error) === "ai_timeout"
                    ? t("ai.timeout")
                    : et(create.error)
                }
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              {t("outlook.note")}
            </p>
          </form>
        </Panel>
        <div className="space-y-3">
          {list.isLoading ? (
            <Rows n={3} h="h-40" />
          ) : list.isError ? (
            <ErrorBox error={list.error} retry={() => list.refetch()} />
          ) : !list.data?.length ? (
            <Empty
              title={t("outlook.emptyTitle")}
              icon={<Sparkles className="h-5 w-5" />}
            >
              {t("outlook.emptyBody")}
            </Empty>
          ) : (
            list.data.map((p) => (
              <article
                key={p.id}
                className="rise min-w-0 rounded-2xl border border-card-border bg-card p-4 shadow-xs md:p-5"
                data-testid={`card-prediction-${p.id}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground">
                    {t("outlook.years", { n: p.horizonYears })}
                  </span>
                  {p.roleTitle && (
                    <span
                      className="max-w-[14rem] truncate whitespace-nowrap rounded-full bg-muted px-2 py-0.5"
                      title={p.roleTitle}
                    >
                      {p.roleTitle}
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {LANG_SHORT[p.lang as Lang] ?? p.lang}
                  </span>
                  {p.cached && (
                    <span className="rounded-full bg-[hsl(var(--gold-soft))] px-2 py-0.5 font-semibold text-foreground">
                      {t("common.cached")}
                    </span>
                  )}
                  <span>{f.dateTime(p.createdAt)}</span>
                </div>
                <h3 className="mt-2 font-semibold">{p.question}</h3>
                <div className="mt-2">
                  <Markdown>{p.content}</Markdown>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                    {t("common.sources")} · {t("agent.model")}: {p.model}
                  </div>
                  <SourceList sources={p.sources} />
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </>
  );
}
