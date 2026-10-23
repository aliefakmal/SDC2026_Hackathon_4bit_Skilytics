import { customFetch, type PlanItem } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
export type LearningJourney = {
  stage: "intake" | "matcher" | "pathway" | "active";
  planId?: number;
  startDate?: string;
  durationWeeks?: Record<string, number>;
  completed: Record<string, string>;
  finishedAt?: string;
  complete: boolean;
  certificateId: string | null;
  roleTitle?: string;
  roleTitleMs?: string;
  roleTitleZh?: string;
  items: (Omit<PlanItem, "sdgTargets"> & {
    startDate: string | null;
    deadline: string | null;
    estimated: boolean;
    sdgCodes: string[];
  })[];
  recommendations: {
    id: number;
    title: string;
    provider: string;
    url: string;
    sdgCodes: string[];
  }[];
};
export function useLearning(id: number) {
  return useQuery({
    queryKey: ["learning", id],
    queryFn: () => customFetch<LearningJourney>(`/api/profiles/${id}/journey`),
    retry: false,
  });
}
export function useLearningAction(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      customFetch(`/api/profiles/${id}/journey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["learning", id] }); await qc.invalidateQueries({queryKey:["enterprise"]}); },
  });
}
export function datedLearning(
  items: PlanItem[],
  start: string,
  estimates: Record<string, number>,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(Date.parse(`${start}T12:00:00Z`))
  )
    return items.map((i) => ({ ...i, startDate: null, deadline: null }));
  let next = Math.max(
    1,
    ...items.map((i) => (i.startWeek ?? 1) + (i.durationWeeks ?? 0)),
  );
  const at = (n: number) => {
    const d = new Date(`${start}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  return items.map((i) => {
    const proposed = i.durationWeeks ?? estimates[String(i.courseId)];
    const weeks =
      Number.isInteger(proposed) &&
      proposed > 0 &&
      (i.durationWeeks != null || proposed <= 520)
        ? proposed
        : null;
    const week = i.startWeek ?? next;
    if (weeks && i.startWeek == null) next += weeks;
    return {
      ...i,
      startDate: weeks ? at((week - 1) * 7) : null,
      deadline: weeks ? at((week - 1 + weeks) * 7 - 1) : null,
    };
  });
}
type CalendarItem = {
  courseId: number;
  title: string;
  provider: string;
  url: string;
  startDate: string | null;
  deadline: string | null;
};
export function learningCalendarText(
  items: CalendarItem[],
  pid: number,
  role: string,
) {
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z/, "Z");
  // Fold content lines by UTF-8 byte length (RFC 5545), including Mandarin.
  const fold = (line: string) => {
    let result = "",
      n = 0;
    for (const ch of line) {
      const bytes = new TextEncoder().encode(ch).length;
      if (n + bytes > 73) {
        result += "\r\n ";
        n = 1;
      }
      result += ch;
      n += bytes;
    }
    return result;
  };
  const events = items
    .filter((i) => i.startDate && i.deadline)
    .map((i) => {
      const end = new Date(`${i.deadline}T12:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      return [
        "BEGIN:VEVENT",
        `UID:skilytics-${pid}-${i.courseId}-${i.startDate}@skilytics`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${i.startDate!.replaceAll("-", "")}`,
        `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll("-", "")}`,
        `SUMMARY:${escape(i.title)}`,
        `DESCRIPTION:${escape(`${role}\n${i.provider}\nDeadline: ${i.deadline}\n${i.url}`)}`,
        `URL:${i.url}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escape(i.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ]
        .map(fold)
        .join("\r\n");
    });
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Skilytics//Learning Path//EN\r\nCALSCALE:GREGORIAN\r\n${events.join("\r\n")}\r\nEND:VCALENDAR\r\n`;
}
export function learningCalendar(
  items: CalendarItem[],
  pid: number,
  role: string,
  google = false,
) {
  const url = URL.createObjectURL(
    new Blob([learningCalendarText(items, pid, role)], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "skilytics-learning-calendar.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (google)
    window.open(
      "https://calendar.google.com/calendar/u/0/r/settings/export",
      "_blank",
      "noopener,noreferrer",
    );
}
