import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import {
  Activity, ArrowDown, ArrowRight, Briefcase, Building2, ChevronRight, Database, FileText,
  GraduationCap, HardHat, Loader2, Map, School, ShieldCheck, Sparkles, UserRound
} from "lucide-react";
import { useGetMarketOverview, useListDemoAccounts, useLogin, useRegister, getGetMarketOverviewQueryKey, type UserRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PublicHeader } from "@/components/shell";
import { BrandMark, ErrorBox } from "@/components/kit";
import { useToast } from "@/hooks/use-toast";
import { useAuth, portalHome } from "@/lib/auth";
import { errCode, useT, type DictKey } from "@/i18n";
import { moveGuestObToUser, safeNext } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

function HonestyLine() {
  const { t } = useT();
  const ov = useGetMarketOverview({ query: { queryKey: getGetMarketOverviewQueryKey() } });
  const o = ov.data;
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground" data-testid="text-honesty">
      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <span>{t("landing.honesty", { dosm: o?.unemploymentDate ?? t("common.notYet"), aei: o?.aiUsagePeriod ?? t("common.notYet") })}</span>
    </div>
  );
}

export function Landing() {
  const { t } = useT();
  const { user } = useAuth();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  useEffect(() => {
    // Pre-warm backend API while visitor explores landing page to eliminate cold start
    const base = import.meta.env.VITE_API_URL || "";
    fetch(`${base}/api/auth/demo-accounts`, { cache: "no-store" }).catch(() => {});
  }, []);

  const prewarm = () => {
    const base = import.meta.env.VITE_API_URL || "";
    fetch(`${base}/api/auth/demo-accounts`, { cache: "no-store" }).catch(() => {});
  };

  return (
    <div className="paper min-h-[100dvh] bg-background">
      <PublicHeader />
      <main className="relative z-[1] mx-auto max-w-6xl px-4 pb-16 md:px-8">
        {/* 1. HERO SECTION WITH IMAGE.PNG ON RIGHT */}
        <section className="grid items-center gap-8 py-8 md:grid-cols-[1.15fr_1fr] md:py-14">
          <div className="rise min-w-0">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-accent/50 bg-card px-3.5 py-1 text-xs font-semibold text-accent shadow-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate whitespace-nowrap">{t("landing.badge")}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-tight text-foreground">
              {t("landing.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t("landing.sub")}
            </p>

            {/* TWO CTA BUTTONS: Maroon (First time user) + White with Maroon Outline (Employers & Educators) */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={() => setUserModalOpen(true)}
                className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-primary/95 cursor-pointer"
                data-testid="button-first-time-user"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm sm:text-base">{t("landing.ctaFirstTime")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setPartnerModalOpen(true)}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-6 py-3 font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/5 cursor-pointer"
                data-testid="button-partners"
              >
                <Building2 className="h-4 w-4" />
                <span className="text-sm sm:text-base">{t("landing.ctaPartners")}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {user && (
              <div className="mt-4">
                <Link href={portalHome(user.role)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80" data-testid="link-continue">
                  {t("landing.continue", { name: user.name })}<ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
            <div className="mt-6"><HonestyLine /></div>
          </div>

          {/* Right Side: image.png */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-card shadow-xl transition-all hover:shadow-2xl">
              <img
                src="/image.png"
                alt="Find Your Fit. Fuel Your Future."
                className="h-auto w-full object-cover max-h-[460px]"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* 2. TARGET MARKET HORIZONTAL CARDS (4 CHOICES) */}
        <section className="mt-12 sm:mt-16" aria-label={t("landing.marketTitle")}>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{t("landing.marketTitle")}</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("landing.marketSub")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Student / Fresh Graduate */}
            <Link
              href="/onboarding/cv?seg=graduate&new=1"
              onMouseEnter={prewarm}
              data-testid="card-market-graduate"
              className="rise group flex flex-col justify-between rounded-2xl border border-card-border bg-card p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Talent</span>
                </div>
                <h3 className="mt-4 font-bold text-sm sm:text-base text-foreground">{t("landing.grad")}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t("landing.gradSub")}</p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span>Start Assessment</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 2. Jobseeker / Working Professional */}
            <Link
              href="/onboarding/cv?seg=worker&new=1"
              onMouseEnter={prewarm}
              data-testid="card-market-worker"
              className="rise group flex flex-col justify-between rounded-2xl border border-card-border bg-card p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md cursor-pointer"
              style={{ animationDelay: "60ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Professional</span>
                </div>
                <h3 className="mt-4 font-bold text-sm sm:text-base text-foreground">{t("landing.worker")}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t("landing.workerSub")}</p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span>Analyze Reskilling</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 3. Employer / Enterprise HR */}
            <Link
              href="/login?role=hr"
              data-testid="card-market-hr"
              className="rise group flex flex-col justify-between rounded-2xl border border-card-border bg-card p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md cursor-pointer"
              style={{ animationDelay: "120ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold-soft))] text-accent">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Enterprise</span>
                </div>
                <h3 className="mt-4 font-bold text-sm sm:text-base text-foreground">{t("portal.hr")}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t("landing.hrSub")}</p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span>HR Portal</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 4. Educator / TVET Institution */}
            <Link
              href="/login?role=tvet"
              data-testid="card-market-tvet"
              className="rise group flex flex-col justify-between rounded-2xl border border-card-border bg-card p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md cursor-pointer"
              style={{ animationDelay: "180ms" }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold-soft))] text-accent">
                    <School className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Institutions</span>
                </div>
                <h3 className="mt-4 font-bold text-sm sm:text-base text-foreground">{t("portal.tvet")}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t("landing.tvetSub")}</p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span>TVET Portal</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION (3 STEPS WITH CONNECTING ARROWS) */}
        <section className="mt-14 sm:mt-18">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{t("landing.howTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Step 1: Intake */}
            <div className="rise relative flex flex-col justify-between rounded-2xl border border-card-border bg-card p-6 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-full">01</span>
                </div>
                <h3 className="mt-4 font-bold text-base text-foreground">{t("landing.stepIntake")}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("landing.stepIntakeDesc")}</p>
              </div>
              {/* Desktop arrow right indicator */}
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-xs text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              {/* Mobile arrow down indicator */}
              <div className="flex md:hidden mx-auto mt-4 h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Step 2: Matcher */}
            <div className="rise relative flex flex-col justify-between rounded-2xl border border-card-border bg-card p-6 shadow-xs" style={{ animationDelay: "70ms" }}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-full">02</span>
                </div>
                <h3 className="mt-4 font-bold text-base text-foreground">{t("landing.stepMatcher")}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("landing.stepMatcherDesc")}</p>
              </div>
              {/* Desktop arrow right indicator */}
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-xs text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              {/* Mobile arrow down indicator */}
              <div className="flex md:hidden mx-auto mt-4 h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Step 3: Pathway */}
            <div className="rise relative flex flex-col justify-between rounded-2xl border border-card-border bg-card p-6 shadow-xs" style={{ animationDelay: "140ms" }}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Map className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-full">03</span>
                </div>
                <h3 className="mt-4 font-bold text-base text-foreground">{t("landing.stepPathway")}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("landing.stepPathwayDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. UN SUSTAINABLE DEVELOPMENT GOALS (SDG) SHOWCASE */}
        <section className="mt-14 sm:mt-18 rounded-3xl bg-gradient-to-br from-primary via-[#65101c] to-[#450a12] p-6 text-primary-foreground sm:p-8 md:p-10 shadow-xl border border-primary/40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-xs mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>United Nations Sustainable Development Goals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{t("landing.sdgTitle")}</h2>
            <p className="mt-2 text-xs sm:text-sm text-primary-foreground/85 leading-relaxed">{t("landing.sdgSub")}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* SDG 4.4 */}
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xs border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src="/sdg/4.png" alt="SDG 4" className="h-12 w-12 rounded-xl object-contain shadow-sm shrink-0" />
                  <div>
                    <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">SDG 4.4</span>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug mt-0.5">{t("landing.sdg4Title")}</h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">{t("landing.sdg4Desc")}</p>
              </div>
            </div>

            {/* SDG 8.5 */}
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xs border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src="/sdg/8.png" alt="SDG 8" className="h-12 w-12 rounded-xl object-contain shadow-sm shrink-0" />
                  <div>
                    <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">SDG 8.5</span>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug mt-0.5">{t("landing.sdg8Title")}</h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">{t("landing.sdg8Desc")}</p>
              </div>
            </div>

            {/* SDG 9.5 */}
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xs border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src="/sdg/9.png" alt="SDG 9" className="h-12 w-12 rounded-xl object-contain shadow-sm shrink-0" />
                  <div>
                    <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">SDG 9.5</span>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug mt-0.5">{t("landing.sdg9Title")}</h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">{t("landing.sdg9Desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. MODAL: FIRST TIME USER (CHOICE OF WORKER OR GRADUATE) */}
        <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t("landing.modalUserTitle")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {t("landing.modalUserSub")}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-3">
              <Link
                href="/onboarding/cv?seg=worker&new=1"
                onClick={() => setUserModalOpen(false)}
                onMouseEnter={prewarm}
                className="group flex items-center gap-4 rounded-2xl border border-card-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md cursor-pointer"
                data-testid="modal-start-worker"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Briefcase className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm sm:text-base text-foreground">{t("landing.worker")}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{t("landing.workerSub")}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/onboarding/cv?seg=graduate&new=1"
                onClick={() => setUserModalOpen(false)}
                onMouseEnter={prewarm}
                className="group flex items-center gap-4 rounded-2xl border border-card-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md cursor-pointer"
                data-testid="modal-start-graduate"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm sm:text-base text-foreground">{t("landing.grad")}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{t("landing.gradSub")}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </DialogContent>
        </Dialog>

        {/* 6. MODAL: EMPLOYERS & EDUCATORS (PARTNER PORTALS) */}
        <Dialog open={partnerModalOpen} onOpenChange={setPartnerModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t("landing.modalPartnerTitle")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {t("landing.modalPartnerSub")}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-3">
              <Link
                href="/login?role=hr"
                onClick={() => setPartnerModalOpen(false)}
                className="group flex items-center gap-4 rounded-2xl border-2 border-accent/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md cursor-pointer"
                data-testid="modal-portal-hr"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--gold-soft))] text-accent">
                  <Building2 className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm sm:text-base text-foreground">{t("portal.hr")} ({t("landing.ctaEmployer")})</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{t("landing.hrSub")}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/login?role=tvet"
                onClick={() => setPartnerModalOpen(false)}
                className="group flex items-center gap-4 rounded-2xl border-2 border-accent/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md cursor-pointer"
                data-testid="modal-portal-tvet"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--gold-soft))] text-accent">
                  <School className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm sm:text-base text-foreground">{t("portal.tvet")} ({t("landing.ctaEducator")})</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{t("landing.tvetSub")}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </DialogContent>
        </Dialog>

        <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2"><BrandMark className="h-6 w-6 text-[9px]" /><span>{t("landing.footer")}</span></div>
          <div className="flex gap-4"><Link href="/market" className="min-h-11 py-3 hover:text-primary">{t("nav.market")}</Link><Link href="/sources" className="min-h-11 py-3 hover:text-primary">{t("nav.sources")}</Link></div>
        </footer>
      </main>
    </div>
  );
}

function AuthFrame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="paper min-h-[100dvh] bg-background">
      <PublicHeader />
      <main className="relative z-[1] mx-auto max-w-md px-4 py-8 md:py-14">
        <div className="rise rounded-3xl border border-card-border bg-card p-5 shadow-md md:p-8">
          <h1 title={title} className="truncate whitespace-nowrap text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6"><HonestyLine /></div>
      </main>
    </div>
  );
}

const ROLES: { r: UserRole; icon: typeof UserRound; label: DictKey }[] = [
  { r: "individual", icon: UserRound, label: "role.individual" },
  { r: "hr", icon: Building2, label: "role.hr" },
  { r: "tvet", icon: School, label: "role.tvet" },
];

export function Login() {
  const { t } = useT();
  const search = useSearch();
  const [, nav] = useLocation();
  const { signIn } = useAuth();
  const sp = new URLSearchParams(search);
  const initialRole = sp.get("role");
  const next = safeNext(sp.get("next"));
  const [role, setRole] = useState<UserRole>(initialRole === "hr" || initialRole === "tvet" ? initialRole : "individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const demos = useListDemoAccounts();
  const login = useLogin();
  useEffect(() => setErr(null), [role]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    login.mutate({ data: { email: email.trim(), password, role } }, {
      onSuccess: async (s) => { if (s.user.role === "individual") moveGuestObToUser(s.user.id); await signIn(s); nav(s.user.role === "individual" && next ? next : portalHome(s.user.role)); },
      onError: (e) => {
        const c = errCode(e);
        if (c === "wrong_role") {
          const actual = (e as { data?: { role?: string } }).data?.role;
          setErr(actual ? t("auth.wrongRoleKnown", { portal: t(`role.${actual}` as DictKey) }) : t("auth.wrongRole"));
        } else if (c === "invalid_credentials") setErr(t("auth.invalid"));
        else setErr(t("err.generic"));
      },
    });
  };
  const roleDemos = (demos.data ?? []).filter((d) => d.role === role);

  return (
    <AuthFrame title={t("auth.loginTitle")} sub={t("auth.loginSub")}>
      {!next?.startsWith("/onboarding/") && <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {ROLES.map(({ r, icon: Icon, label }) => (
          <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)} data-testid={`button-role-${r}`}
            className={cn("flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-semibold transition-colors", role === r ? "bg-card text-primary shadow-xs" : "text-muted-foreground")}>
            <Icon className="h-4 w-4" /><span className="w-full truncate whitespace-nowrap text-center">{t(label)}</span>
          </button>
        ))}
      </div>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-11" placeholder={t("auth.emailPh")} data-testid="input-email" /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">{t("auth.password")}</Label>
          <Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-11" data-testid="input-password" /></div>
        {err && <ErrorBox message={err} />}
        <Button type="submit" className="min-h-11 w-full text-sm font-semibold" disabled={login.isPending} data-testid="button-login">
          {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("auth.login")}
        </Button>
      </form>

      {role !== "individual" && (
        <div className="mt-6 rounded-2xl border border-accent/40 bg-[hsl(var(--gold-soft))]/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">{t("auth.demoTitle")}<span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-accent-foreground" data-testid="badge-demo">{t("auth.demoBadge")}</span></div>
          <p className="text-xs text-muted-foreground">{t("auth.demoSub")}</p>
          <p className="mt-1 text-[11px] font-medium text-foreground/80">{t("auth.demoLabel")}</p>
          <div className="mt-3 space-y-2">
            {demos.isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {!demos.isLoading && !roleDemos.length && <div className="text-xs text-muted-foreground">{t("auth.demoNone")}</div>}
            {roleDemos.map((d) => (
              <div key={d.email} className="flex items-center justify-between gap-2 rounded-xl bg-card p-2.5">
                <div className="min-w-0"><div title={d.organization} className="flex min-w-0 items-center gap-1.5 text-sm font-medium"><span className="shrink-0 rounded bg-[hsl(var(--gold-soft))] px-1 text-[9px] font-bold text-accent">{t("auth.demoBadge")}</span><span className="truncate whitespace-nowrap">{d.organization}</span></div><div className="truncate text-[11px] text-muted-foreground">{d.email}</div></div>
                <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={() => { setEmail(d.email); setPassword(d.password); }} data-testid={`button-demo-${d.email}`}>{t("auth.useDemo")}</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {role === "individual" && (
        <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
          <Link href={next ?? "/me"} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border font-medium hover:border-primary hover:text-primary" data-testid="link-continue-guest">{t("auth.continueGuest")}<ArrowRight className="h-4 w-4" /></Link>
          <p className="text-center text-muted-foreground">{t("auth.noAccount")} <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-primary underline-offset-2 hover:underline">{t("auth.register")}</Link></p>
        </div>
      )}
    </AuthFrame>
  );
}

function dummySuffix() {
  const b = new Uint8Array(5);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function Register() {
  const { t } = useT();
  const search = useSearch();
  const sp = new URLSearchParams(search);
  const next = safeNext(sp.get("next"));
  const kind = sp.get("seg") === "student" ? "student" : "worker";
  const [, nav] = useLocation();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const reg = useRegister();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr(t("auth.pwShort")); return; }
    reg.mutate({ data: { email: email.trim(), password } }, {
      onSuccess: async (s) => {
        moveGuestObToUser(s.user.id);
        await signIn(s);
        toast({ title: t("auth.welcome", { name: s.user.name }), description: s.claimedProfiles > 0 ? t("auth.claimed", { n: s.claimedProfiles }) : undefined });
        nav(next ?? "/me");
      },
      onError: (e) => setErr(errCode(e) === "email_taken" ? t("auth.emailTaken") : errCode(e) === "invalid_input" ? t("err.invalid_input") : t("err.generic")),
    });
  };
  return (
    <AuthFrame title={t("auth.registerTitle")} sub={t("auth.registerSub")}>
      <form onSubmit={submit} className="space-y-4">
        {next && <p className="rounded-xl bg-[hsl(var(--gold-soft))]/60 px-3 py-2 text-xs" data-testid="text-keep-guest">{t("auth.keepGuest")}</p>}
        <div className="rounded-xl border border-dashed border-accent/60 p-3">
          <Button type="button" variant="outline" className="min-h-11 w-full" data-testid="button-fill-dummy" onClick={() => {
            const sfx = dummySuffix();
            setEmail(`${kind}-${sfx}@example.invalid`);
            setPassword(`demo-${sfx}`);
          }}>{t("auth.fillDummy")}</Button>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t("auth.dummyNote")}</p>
        </div>
        <div className="space-y-1.5"><Label htmlFor="email">{t("auth.email")}</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-11" autoComplete="email" placeholder={t("auth.emailPh")} data-testid="input-email" /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">{t("auth.password")}</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-11" autoComplete="new-password" data-testid="input-password" />
          <p className="text-[11px] text-muted-foreground">{t("auth.pwHint")}</p></div>
        {err && <ErrorBox message={err} />}
        <Button type="submit" className="min-h-11 w-full font-semibold" disabled={reg.isPending} data-testid="button-register">{reg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("auth.register")}</Button>
        <p className="text-xs text-muted-foreground">{t("auth.claimNote")}</p>
        <p className="text-center text-sm text-muted-foreground">{t("auth.haveAccount")} <Link href={next ? `/login?role=individual&next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">{t("auth.login")}</Link></p>
      </form>
    </AuthFrame>
  );
}

export function NotFound() {
  const { t } = useT();
  return (
    <div className="dotgrid flex min-h-[60vh] flex-col items-center justify-center rounded-3xl px-4 text-center">
      <div className="tnum text-sm font-bold text-accent">404</div>
      <h1 className="mt-2 text-3xl font-bold">{t("nf.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("nf.body")}</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground" data-testid="link-404-home">{t("nf.home")}</Link>
    </div>
  );
}
