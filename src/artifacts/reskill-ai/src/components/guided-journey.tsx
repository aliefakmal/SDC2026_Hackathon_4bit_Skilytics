import { JourneyReady } from "./journey-welcome";
import { useEffect, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Profile,
  useListRoles,
  useUpdateProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { Pencil, LockKeyhole, Check, ArrowRight, X } from "lucide-react";
import { useT } from "@/i18n";
import { learningWords } from "@/i18n/learning";
import { useLearning, useLearningAction } from "@/lib/learning";
import { skillLabel } from "@/lib/skill-label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ErrorBox, Rows } from "./kit";
import { ProfileFormDialog } from "./profile-form";
import { IndividualMatcher, IndividualPathway } from "./individual-journey";

export function GuidedJourney({ p, mod }: { p: Profile; mod: string }) {
  const { lang } = useT(),
    w = learningWords[lang];
  const q = useLearning(p.id);
  useEffect(() => { window.scrollTo({top:0,behavior:"instant"}); }, [mod,p.id]);
  if (q.isLoading) return <Rows n={3} />;
  if (q.isError) return <ErrorBox error={q.error} retry={() => q.refetch()} />;
  if (p.onboardingStep !== "complete")
    return <Redirect to={`/onboarding/${!p.cvExtractionKey?"cv":!p.verified?"review":!p.riasecScores?"holland":"save"}?pid=${p.id}`} replace />;
  const stage = q.data!.stage;
  if (
    mod === "agents" ||
    mod === "radar" ||
    (mod === "matcher" && stage === "intake") ||
    (mod === "pathway" && ["intake", "matcher"].includes(stage))
  )
    return (
      <Redirect
        to={`/me/profiles/${p.id}/${stage === "active" ? "intake" : stage}`}
        replace
      />
    );
  if (stage !== "active" && mod === "ready") return <Redirect to={`/me/profiles/${p.id}/${stage}`} replace />;
  if (stage === "active" && mod === "ready") return <JourneyReady />;
  if (stage === "active" && mod !== "intake")
    return <Redirect to="/me" replace />;
  const index = mod === "matcher" ? 1 : mod === "pathway" ? 2 : 0;
  return (
    <div className="space-y-5">
      <Link
        href="/me"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        ← {w.back}
      </Link>
      <h1 className="break-words text-2xl font-bold sm:text-3xl">{p.name}</h1>
      <p className="text-sm text-muted-foreground">{w.review}</p>
      {stage !== "active" && (
        <ol className="sticky top-[61px] z-20 grid grid-cols-3 gap-1.5 bg-background/95 py-2 backdrop-blur sm:gap-2" aria-label={w.review}>
          {w.steps.map((name, i) => (
            <li
              key={name}
              aria-current={index === i ? "step" : undefined}
              className={`rounded-xl border p-2 text-xs sm:p-3 sm:text-sm ${index === i ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            >
              <b>{i + 1}</b>
              <span className="ml-1 sm:ml-2">{name}</span>
            </li>
          ))}
        </ol>
      )}
      {stage !== "active" && index > 0 && (
        <Link
          href={`/me/profiles/${p.id}/${index === 2 ? "matcher" : "intake"}`}
          className="inline-flex min-h-11 items-center rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-muted"
        >
          ← {w.steps[index - 1]}
        </Link>
      )}
      {index === 0 ? (
        <IntakeSummary p={p} active={stage === "active"} />
      ) : index === 1 ? (
        <IndividualMatcher p={p} base="/me/profiles" />
      ) : (
        <IndividualPathway p={p} base="/me/profiles" />
      )}
    </div>
  );
}

function IntakeSummary({ p, active }: { p: Profile; active: boolean }) {
  const { lang, t, tk } = useT(),
    w = learningWords[lang];
  const [edit, setEdit] = useState(false);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const [, nav] = useLocation();
  const advance = useLearningAction(p.id);
  const roles = useListRoles();
  const update = useUpdateProfile({
    mutation: {
      onSuccess: async (next) => {
        qc.setQueryData(getGetProfileQueryKey(p.id), next);
        await qc.invalidateQueries({ queryKey: ["learning", p.id] });
      },
    },
  });
  const catalogue = new Map<number, string>();
  roles.data?.forEach((r) =>
    r.skills.forEach((s) => catalogue.set(s.skillId, s.name)),
  );
  const suggestions = Array.from(catalogue)
    .filter(
      ([id, name]) =>
        !p.skills.some((s) => s.skillId === id) &&
        `${name} ${skillLabel(name, lang)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .slice(0, 8);
  const fields = [
    [t("ob.review.role"), p.currentRole],
    [t("ob.review.org"), p.organization],
    [t("ob.review.edu"), p.education],
    [t("ob.review.exp"), p.experience],
    [t("profile.goals"), p.goals],
    [t("profile.hours"), String(p.weeklyHours)],
    [t("profile.budget"), `RM ${p.budgetMyr}`],
  ];
  return (
    <>
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{w.summary}</h2>
          <Button onClick={() => setEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {w.edit}
          </Button>
        </div>
        <dl className="grid gap-4 md:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted/40 p-4">
              <dt className="flex items-center justify-between text-xs text-muted-foreground">
                {label}
                <button
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-primary/10"
                  aria-label={`${w.edit}: ${label}`}
                  onClick={() => setEdit(true)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </dt>
              <dd className="whitespace-pre-line break-words text-sm font-medium">
                {value || w.empty}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <h3 className="mb-2 font-bold">{w.skills}</h3>
          <div className="flex flex-wrap gap-2">
            {p.skills.map((s) => (
              <span
                key={s.skillId}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
              >
                {skillLabel(s.name, lang)}
                <button
                  disabled={update.isPending}
                  aria-label={`${w.remove} ${s.name}`}
                  onClick={() =>
                    update.mutate({
                      id: p.id,
                      data: { removeSkillIds: [s.skillId] },
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <Input
            className="mt-3"
            placeholder={w.search}
            aria-label={w.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.trim() && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map(([id, name]) => (
                <Button
                  variant="outline"
                  key={id}
                  disabled={update.isPending}
                  onClick={() => {
                    update.mutate({
                      id: p.id,
                      data: {
                        addSkills: [{ skillId: id, status: "self_reported" }],
                      },
                    });
                    setSearch("");
                  }}
                >
                  {w.add} · {skillLabel(name, lang)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-bold">
          Holland ·{" "}
          <span translate="no" className="notranslate text-primary">
            {p.riasecCode ?? "—"}
          </span>
        </h2>
        <p className="my-3 flex gap-2 text-sm text-muted-foreground">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          {w.locked}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(p.riasecScores ?? {}).map(([code, value]) => (
            <div key={code} className="rounded-xl bg-muted/40 p-3">
              <span translate="no" className="notranslate font-bold">
                {code}
              </span>{" "}
              · {tk("riasec", code)}
              <span className="float-right">
                {Number(value).toFixed(1)} / 5
              </span>
              <div className="mt-2 h-2 rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{ width: `${Number(value) * 20}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      {(advance.isError || update.isError) && (
        <ErrorBox error={advance.error ?? update.error} />
      )}
      {!active && (
        <Button
          className="min-h-12 w-full text-base"
          disabled={advance.isPending || update.isPending}
          onClick={async () => {
            try {
              await advance.mutateAsync({ action: "confirm_intake" });
              nav(`/me/profiles/${p.id}/matcher`);
            } catch {}
          }}
        >
          <Check className="mr-2 h-4 w-4" />
          {w.next}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      <ProfileFormDialog
        open={edit}
        onOpenChange={setEdit}
        profile={p}
        lockSegment
      />
    </>
  );
}
