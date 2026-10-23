import { PageGuide, guides } from "./page-guide";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Medal,
  ArrowRight,
} from "lucide-react";
import { useT } from "@/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

const words = {
  en: {
    title: "We did it! Your plan is ready.",
    body: "You chose your next direction. Now take it one course at a time.",
    confirm: "Let’s go to my workspace",
    welcome: "Your next small steps",
    intro: "Everything you need to keep learning is here.",
    tips: [
      [
        "Start a course",
        "Open your course and learn on the provider’s website.",
      ],
      [
        "Keep an eye on dates",
        "Your deadlines are highlighted. Save all study dates to your calendar.",
      ],
      [
        "Celebrate your progress",
        "Mark a course as complete to earn badges. Finish your plan to unlock your Skilytics certificate.",
      ],
    ],
    done: "Got it, let’s learn",
    help: "Show workspace guide",
    later: "Close guide",
  },
  ms: {
    title: "Kita berjaya! Pelan anda sudah siap.",
    body: "Anda sudah pilih hala tuju. Sekarang, belajar satu kursus pada satu masa.",
    confirm: "Teruskan ke ruang kerja saya",
    welcome: "Langkah kecil anda seterusnya",
    intro: "Semua yang anda perlukan untuk terus belajar ada di sini.",
    tips: [
      ["Mulakan kursus", "Buka kursus dan belajar di laman web penyedia."],
      [
        "Lihat tarikh penting",
        "Tarikh akhir ditonjolkan. Simpan semua tarikh belajar ke kalendar anda.",
      ],
      [
        "Raikan kemajuan anda",
        "Tandakan kursus yang selesai untuk mendapat lencana. Lengkapkan pelan untuk membuka sijil Skilytics anda.",
      ],
    ],
    done: "Faham, jom belajar",
    help: "Lihat panduan ruang kerja",
    later: "Tutup panduan",
  },
  zh: {
    title: "我们做到了！你的计划已就绪。",
    body: "你已选好方向。接下来，一次学一门课。",
    confirm: "进入我的工作区",
    welcome: "接下来的小步骤",
    intro: "继续学习所需的内容都在这里。",
    tips: [
      ["开始一门课程", "打开课程，在课程机构的网站上学习。"],
      ["留意重要日期", "截止日期已突出显示。把所有学习日期存入你的日历。"],
      [
        "庆祝你的进步",
        "完成后勾选课程即可获得徽章。完成计划后，可领取 Skilytics 证书。",
      ],
    ],
    done: "明白，开始学习",
    help: "查看工作区指南",
    later: "关闭指南",
  },
};

export function JourneyReady() {
  const { lang } = useT();
  const w = words[lang];
  const reduced = useReducedMotion();
  return (
    <section
      className="mx-auto flex min-h-[65dvh] max-w-lg flex-col items-center justify-center gap-5 text-center"
      data-testid="journey-ready"
    >
      <motion.div
        initial={reduced ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 16 }}
        className="rounded-full bg-emerald-100 p-6 text-emerald-700"
      >
        <CheckCircle2 className="h-16 w-16" />
      </motion.div>
      <h1 className="text-2xl font-bold sm:text-3xl">{w.title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{w.body}</p>
      <Link
        href="/me?welcome=1"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        {w.confirm}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
    </section>
  );
}

export function WorkspaceWelcome() {
  const { lang } = useT();
  const { user, loading } = useAuth();
  const w = guides[lang];
  const hrefs = ["/me", "/roles", "/courses", "/market", "/sources"];
  return (
    <PageGuide
      title={w.workspaceTitle}
      steps={w.workspace.map(([title, body], i) => ({
        title,
        body,
        href: hrefs[i],
      }))}
      storageKey={`skilytics.workspace-tour.v2.${user?.id ?? "guest"}`}
      enabled={!loading && (!user || user.role === "individual")}
    />
  );
}
