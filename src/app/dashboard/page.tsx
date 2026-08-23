import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatTime,
  formatWeekdayDate,
  mondayOfWeek,
  todayInBucharest,
} from "@/lib/date";

type SessionRow = {
  id: string;
  date: string;
  start_time: string;
  workshop_id: string | null;
  title: string | null;
  workshops: { name: string } | null;
};

type SessionCard = {
  id: string;
  date: string;
  startTime: string;
  label: string;
  childCount: number;
  checked: boolean;
};

async function enrichSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessions: SessionRow[],
): Promise<SessionCard[]> {
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const workshopIds = [...new Set(sessions.map((s) => s.workshop_id).filter(Boolean))] as string[];
  const noWorkshopIds = sessions.filter((s) => !s.workshop_id).map((s) => s.id);

  const [attendanceRes, workshopChildrenRes, participantsRes] = await Promise.all([
    supabase.from("attendance").select("session_id").in("session_id", sessionIds),
    workshopIds.length
      ? supabase
          .from("child_workshops")
          .select("workshop_id, children!inner(is_active)")
          .in("workshop_id", workshopIds)
          .is("left_at", null)
          .eq("children.is_active", true)
      : Promise.resolve({ data: [] }),
    noWorkshopIds.length
      ? supabase.from("session_participants").select("session_id").in("session_id", noWorkshopIds)
      : Promise.resolve({ data: [] }),
  ]);

  const checkedSessionIds = new Set((attendanceRes.data ?? []).map((a) => a.session_id));

  const childCountByWorkshop = new Map<string, number>();
  for (const row of workshopChildrenRes.data ?? []) {
    childCountByWorkshop.set(
      row.workshop_id,
      (childCountByWorkshop.get(row.workshop_id) ?? 0) + 1,
    );
  }

  const participantCountBySession = new Map<string, number>();
  for (const row of participantsRes.data ?? []) {
    participantCountBySession.set(
      row.session_id,
      (participantCountBySession.get(row.session_id) ?? 0) + 1,
    );
  }

  return sessions.map((s) => ({
    id: s.id,
    date: s.date,
    startTime: s.start_time,
    label: s.workshops?.name ?? s.title ?? "Ședință specială",
    childCount: s.workshop_id
      ? (childCountByWorkshop.get(s.workshop_id) ?? 0)
      : (participantCountBySession.get(s.id) ?? 0),
    checked: checkedSessionIds.has(s.id),
  }));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Number.parseInt(offsetParam ?? "0", 10) || 0;

  const supabase = await createClient();
  const today = todayInBucharest();

  const thisWeekStart = addDays(mondayOfWeek(today), offset * 7);
  const nextWeekStart = addDays(thisWeekStart, 7);
  const windowEnd = addDays(nextWeekStart, 6);

  const sessionColumns =
    "id, date, start_time, workshop_id, title, workshops(name), status";

  const [pastUncheckedRes, windowRes] = await Promise.all([
    offset === 0
      ? supabase
          .from("sessions")
          .select(sessionColumns)
          .lt("date", today)
          .neq("status", "cancelled")
          .gte("date", addDays(today, -60))
          .order("date", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    supabase
      .from("sessions")
      .select(sessionColumns)
      .gte("date", thisWeekStart)
      .lte("date", windowEnd)
      .neq("status", "cancelled")
      .order("date")
      .order("start_time"),
  ]);

  const pastCandidates = (pastUncheckedRes.data ?? []) as unknown as SessionRow[];
  const windowSessions = (windowRes.data ?? []) as unknown as SessionRow[];

  const [pastCards, windowCards] = await Promise.all([
    enrichSessions(supabase, pastCandidates),
    enrichSessions(supabase, windowSessions),
  ]);

  const pastUnchecked = pastCards.filter((c) => !c.checked);

  const todayCards = offset === 0 ? windowCards.filter((c) => c.date === today) : [];
  const restOfThisWeek = windowCards.filter(
    (c) => c.date >= thisWeekStart && c.date < nextWeekStart && c.date !== today,
  );
  const nextWeekCards = windowCards.filter((c) => c.date >= nextWeekStart);

  const nextUpcoming = offset === 0 && todayCards.length === 0
    ? [...restOfThisWeek, ...nextWeekCards].find((c) => c.date > today)
    : null;

  return (
    <div className="mx-auto max-w-md space-y-8">
      {pastUnchecked.length > 0 && (
        <section className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-800">
            {pastUnchecked.length === 1
              ? "O ședință nebifată"
              : `${pastUnchecked.length} ședințe nebifate`}
          </h2>
          <ul className="space-y-1">
            {pastUnchecked.map((card) => (
              <SessionCardLink key={card.id} card={card} tone="red" />
            ))}
          </ul>
        </section>
      )}

      {offset === 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Astăzi</h2>
          {todayCards.length > 0 ? (
            <ul className="space-y-2">
              {todayCards.map((card) => (
                <SessionCardLink key={card.id} card={card} />
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
              <p>Niciun atelier astăzi.</p>
              {nextUpcoming && (
                <p className="mt-2">
                  Următorul:{" "}
                  <Link
                    href={`/dashboard/sessions/${nextUpcoming.id}/attendance`}
                    className="font-medium text-neutral-900 underline"
                  >
                    {formatWeekdayDate(nextUpcoming.date)}, {formatTime(nextUpcoming.startTime)} —{" "}
                    {nextUpcoming.label}
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {offset === 0 ? "Săptămâna aceasta" : `Săptămâna din ${formatWeekdayDate(thisWeekStart)}`}
        </h2>
        {restOfThisWeek.length > 0 ? (
          <ul className="space-y-2">
            {restOfThisWeek.map((card) => (
              <SessionCardLink key={card.id} card={card} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Nimic altceva săptămâna asta.</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {offset === 0 ? "Săptămâna viitoare" : `Săptămâna din ${formatWeekdayDate(nextWeekStart)}`}
        </h2>
        {nextWeekCards.length > 0 ? (
          <ul className="space-y-2">
            {nextWeekCards.map((card) => (
              <SessionCardLink key={card.id} card={card} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Nimic programat.</p>
        )}
      </section>

      <div className="flex items-center justify-between text-sm">
        <Link href={`/dashboard?offset=${offset - 2}`} className="text-neutral-500 hover:underline">
          ‹ Mai devreme
        </Link>
        <Link href={`/dashboard?offset=${offset + 2}`} className="text-neutral-500 hover:underline">
          Mai târziu ›
        </Link>
      </div>

      <div className="flex gap-2">
        <Link href="/dashboard/workshops/new" className="flex-1">
          <Button variant="outline" className="w-full">
            + Atelier nou
          </Button>
        </Link>
        <Link href="/dashboard/sessions/generate" className="flex-1">
          <Button variant="outline" className="w-full">
            Generează ședințe
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SessionCardLink({
  card,
  tone = "default",
}: {
  card: SessionCard;
  tone?: "default" | "red";
}) {
  return (
    <li>
      <Link
        href={`/dashboard/sessions/${card.id}/attendance`}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-neutral-50",
          tone === "red"
            ? "border-red-300 bg-white"
            : "border-neutral-200 bg-white",
        )}
      >
        <div className="min-w-0">
          <p className={cn("font-medium", tone === "red" && "text-red-700")}>{card.label}</p>
          <p className="text-sm text-neutral-500">
            {formatWeekdayDate(card.date)} · {formatTime(card.startTime)} · {card.childCount} copii
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-sm font-medium",
            card.checked ? "text-green-600" : tone === "red" ? "text-red-600" : "text-neutral-400",
          )}
        >
          {card.checked ? "✓ bifat" : "— nebifat"}
        </span>
      </Link>
    </li>
  );
}
