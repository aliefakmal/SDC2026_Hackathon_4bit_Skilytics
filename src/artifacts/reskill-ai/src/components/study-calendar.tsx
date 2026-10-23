import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useT } from "@/i18n";
import { Button } from "./ui/button";
import {
  coursesOnDay,
  monthCells,
  studyColors,
  studyWords,
  type StudyCourse,
} from "@/lib/study-calendar";

export function StudyCalendar({
  courses,
  start,
  selected,
  onSelect,
}: {
  courses: StudyCourse[];
  start: string;
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const { lang } = useT(),
    w = studyWords[lang];
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(start) && Number.isFinite(Date.parse(start));
  const initial = valid ? start : new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(initial.slice(0, 7));
  const [day, setDay] = useState(initial);
  useEffect(() => {
    setMonth(initial.slice(0, 7));
    setDay(initial);
  }, [initial]);
  const locale = { en: "en-GB", ms: "ms-MY", zh: "zh-CN" }[lang];
  const date = (value: string) => new Date(`${value}T12:00:00Z`);
  const full = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });
  const shift = (n: number) => {
    const d = date(month + "-01");
    d.setUTCMonth(d.getUTCMonth() + n);
    const next = d.toISOString().slice(0, 7);
    setMonth(next);
    setDay(next + "-01");
  };
  const active = coursesOnDay(courses, day);
  return (
    <section
      className="rounded-2xl border bg-card p-3 sm:p-5"
      aria-label={w.calendar}
      data-testid="study-calendar"
    >
      <h3 className="flex items-center gap-2 text-base font-bold">
        <CalendarDays className="h-5 w-5 text-primary" />
        {w.calendar}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{w.select}</p>
      <div className="my-3 flex items-center justify-between gap-1">
        <Button
          variant="outline"
          className="h-11 w-11 shrink-0 p-0"
          aria-label={w.previous}
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-center text-sm font-bold" aria-live="polite">
          {new Intl.DateTimeFormat(locale, {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(date(month + "-01"))}
        </span>
        <Button
          variant="outline"
          className="h-11 w-11 shrink-0 p-0"
          aria-label={w.next}
          onClick={() => shift(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.UTC(2024, 0, 1 + i, 12));
          return (
            <span
              key={i}
              className="py-1 text-[10px] font-semibold text-muted-foreground"
            >
              {new Intl.DateTimeFormat(locale, {
                weekday: "short",
                timeZone: "UTC",
              }).format(d)}
            </span>
          );
        })}
        {monthCells(month).map((value, i) => {
          if (!value) return <span key={`blank-${i}`} />;
          const list = coursesOnDay(courses, value);
          const focus = list.find((c) => c.courseId === selected) ?? list[0];
          const color = focus
            ? studyColors[courses.indexOf(focus) % studyColors.length]
            : undefined;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${full.format(date(value))} · ${list.length} ${w.courses}`}
              aria-pressed={day === value}
              onClick={() => setDay(value)}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border text-xs transition-colors sm:min-h-14 ${day === value ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-primary/40"}`}
              style={{ backgroundColor: color ? color + "18" : undefined }}
            >
              <span
                className={
                  day === value ? "font-extrabold text-primary" : "font-medium"
                }
              >
                {Number(value.slice(-2))}
              </span>
              <span
                className="flex h-1.5 items-center gap-0.5"
                aria-hidden="true"
              >
                {list.slice(0, 3).map((c) => (
                  <span
                    key={c.courseId}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background:
                        studyColors[courses.indexOf(c) % studyColors.length],
                    }}
                  />
                ))}
                {list.length > 3 && <span className="text-[8px]">+</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="mt-3 flex flex-wrap items-center gap-1.5"
        aria-label={w.courses}
      >
        {courses.map((c, i) => (
          <button
            key={c.courseId}
            title={c.title}
            aria-label={`${i + 1} · ${c.title}`}
            aria-pressed={selected === c.courseId}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${selected === c.courseId ? "border-primary bg-primary/5" : ""}`}
            onClick={() => {
              onSelect(c.courseId);
              if (c.startDate) {
                setMonth(c.startDate.slice(0, 7));
                setDay(c.startDate);
              }
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: studyColors[i % studyColors.length] }}
            />
            {i + 1}
          </button>
        ))}
        <Button
          variant="ghost"
          className="min-h-11 text-xs"
          onClick={() => {
            setMonth(initial.slice(0, 7));
            setDay(initial);
          }}
        >
          {w.today}
        </Button>
      </div>
      <div className="mt-3 rounded-xl bg-muted/40 p-3" aria-live="polite">
        <p className="text-xs font-semibold">{full.format(date(day))}</p>
        {active.length ? (
          <ul className="mt-2 space-y-2">
            {active.map((c) => (
              <li key={c.courseId}>
                <a
                  href={`#course-${c.courseId}`}
                  onClick={() => onSelect(c.courseId)}
                  className="flex min-h-11 items-center gap-2 text-xs font-medium underline decoration-primary/30"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        studyColors[courses.indexOf(c) % studyColors.length],
                    }}
                  />
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{w.empty}</p>
        )}
      </div>
      {courses.some((c) => !c.deadline) && (
        <p className="mt-2 text-xs text-muted-foreground">{w.missing}</p>
      )}
    </section>
  );
}
