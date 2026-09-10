import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  firstOfMonth,
  formatMonthYear,
  mondayOfWeek,
  todayInBucharest,
} from "@/lib/date";
import { enrichSessions, SESSION_COLUMNS, type SessionRow } from "@/lib/calendar-data";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";

function formatWeekRangeLabel(weekStart: string, weekEnd: string): string {
  const [, ms, ds] = weekStart.split("-");
  const [ye, me, de] = weekEnd.split("-");
  const MONTHS = [
    "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
  ];
  const startDay = `${Number(ds)}`;
  const endLabel = `${Number(de)} ${MONTHS[Number(me) - 1]} ${ye}`;
  if (ms === me) return `${startDay} – ${endLabel}`;
  return `${startDay} ${MONTHS[Number(ms) - 1]} – ${endLabel}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view = viewParam === "month" ? "month" : "week";
  const today = todayInBucharest();
  const anchor = dateParam ?? today;

  const supabase = await createClient();

  // "De completat" e o alertă globală, nu legată de săptămâna vizualizată --
  // rămâne vizibilă până Rebecca completează prezența, oricât ar naviga.
  const { data: pastCandidatesRaw } = await supabase
    .from("sessions")
    .select(SESSION_COLUMNS)
    .lt("date", today)
    .neq("status", "cancelled")
    .gte("date", addDays(today, -120))
    .order("date", { ascending: false })
    .limit(50);
  const pastCards = await enrichSessions(
    supabase,
    (pastCandidatesRaw ?? []) as unknown as SessionRow[],
  );
  const pastUnchecked = pastCards.filter((c) => !c.completed);

  if (view === "month") {
    const monthStart = firstOfMonth(anchor);
    const monthEnd = addDays(addMonths(monthStart, 1), -1);

    const { data: monthRaw } = await supabase
      .from("sessions")
      .select(SESSION_COLUMNS)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .neq("status", "cancelled")
      .order("date");
    const monthCards = await enrichSessions(supabase, (monthRaw ?? []) as unknown as SessionRow[]);

    return (
      <div className="mx-auto max-w-md space-y-6">
        <CalendarHeader
          view={view}
          label={formatMonthYear(monthStart)}
          prevHref={`/dashboard?view=month&date=${addMonths(monthStart, -1)}`}
          nextHref={`/dashboard?view=month&date=${addMonths(monthStart, 1)}`}
        />
        <MonthView monthStart={monthStart} today={today} monthCards={monthCards} />
        {pastUnchecked.length > 0 && (
          <p className="text-sm text-amber-800">
            {pastUnchecked.length === 1
              ? "O ședință de completat"
              : `${pastUnchecked.length} ședințe de completat`}
            {" — "}
            <Link href="/dashboard?view=week" className="underline">
              vezi în săptămână
            </Link>
          </p>
        )}
        <BottomActions weekStart={mondayOfWeek(anchor)} />
      </div>
    );
  }

  const weekStart = mondayOfWeek(anchor);
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = weekStart <= today && today <= weekEnd;

  const { data: weekRaw } = await supabase
    .from("sessions")
    .select(SESSION_COLUMNS)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .neq("status", "cancelled")
    .order("date")
    .order("start_time");
  const weekCards = await enrichSessions(supabase, (weekRaw ?? []) as unknown as SessionRow[]);

  let nextUpcoming = null;
  if (isCurrentWeek && !weekCards.some((c) => c.date === today)) {
    const { data: upcomingRaw } = await supabase
      .from("sessions")
      .select(SESSION_COLUMNS)
      .gt("date", today)
      .neq("status", "cancelled")
      .order("date")
      .order("start_time")
      .limit(1);
    const upcomingCards = await enrichSessions(
      supabase,
      (upcomingRaw ?? []) as unknown as SessionRow[],
    );
    nextUpcoming = upcomingCards[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <CalendarHeader
        view={view}
        label={formatWeekRangeLabel(weekStart, weekEnd)}
        prevHref={`/dashboard?view=week&date=${addDays(weekStart, -7)}`}
        nextHref={`/dashboard?view=week&date=${addDays(weekStart, 7)}`}
      />
      <WeekView
        weekStart={weekStart}
        today={today}
        isCurrentWeek={isCurrentWeek}
        weekCards={weekCards}
        pastUnchecked={pastUnchecked}
        nextUpcoming={nextUpcoming}
      />
      <BottomActions weekStart={weekStart} />
    </div>
  );
}

function CalendarHeader({
  view,
  label,
  prevHref,
  nextHref,
}: {
  view: "week" | "month";
  label: string;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          aria-label="Înapoi"
        >
          ←
        </Link>
        <p className="text-sm font-medium">{label}</p>
        <Link
          href={nextHref}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          aria-label="Înainte"
        >
          →
        </Link>
      </div>
      <div className="flex overflow-hidden rounded-md border border-neutral-300 text-sm">
        <Link
          href="/dashboard?view=week"
          className={cn(
            "px-3 py-1.5 font-medium",
            view === "week" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100",
          )}
        >
          Săptămână
        </Link>
        <Link
          href="/dashboard?view=month"
          className={cn(
            "px-3 py-1.5 font-medium",
            view === "month" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100",
          )}
        >
          Lună
        </Link>
      </div>
    </div>
  );
}

function BottomActions({ weekStart }: { weekStart: string }) {
  return (
    <Link href={`/dashboard/sessions/add?week=${weekStart}`} className="block">
      <Button className="w-full">+ Adaugă ședințe</Button>
    </Link>
  );
}
