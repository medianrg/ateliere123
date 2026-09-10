import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/date";
import { fetchSubscriptionsWithUsage, pickCurrentSubscription, trafficLight } from "@/lib/finance";
import { AttendanceList, type RosterChild } from "./attendance-list";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  type SessionResult = {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    sessions_used_default: string;
    workshop_id: string | null;
    title: string | null;
    workshops: { name: string; drop_in_price: string } | null;
    session_types: { name: string } | null;
  };

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, date, start_time, end_time, sessions_used_default, workshop_id, title, workshops(name, drop_in_price), session_types(name)",
    )
    .eq("id", sessionId)
    .returns<SessionResult[]>()
    .single();

  if (!session) notFound();

  const [workshopChildrenRes, participantsRes, attendanceRes] = await Promise.all([
    session.workshop_id
      ? supabase
          .from("child_workshops")
          .select("children(id, first_name, last_name, is_active)")
          .eq("workshop_id", session.workshop_id)
          .is("left_at", null)
      : Promise.resolve({ data: [] }),
    supabase
      .from("session_participants")
      .select("children(id, first_name, last_name)")
      .eq("session_id", sessionId),
    supabase.from("attendance").select("child_id, status, sessions_used").eq("session_id", sessionId),
  ]);

  type ChildRef = { id: string; first_name: string; last_name: string; is_active?: boolean };

  const byId = new Map<string, ChildRef>();
  const fromWorkshop = new Set<string>();
  for (const row of workshopChildrenRes.data ?? []) {
    const c = row.children as unknown as ChildRef | null;
    if (c && c.is_active !== false) {
      byId.set(c.id, c);
      fromWorkshop.add(c.id);
    }
  }
  for (const p of participantsRes.data ?? []) {
    const c = p.children as unknown as ChildRef | null;
    if (c) byId.set(c.id, c);
  }

  const childIds = [...byId.keys()];
  const { data: consents } = childIds.length
    ? await supabase.from("consents").select("child_id, photo_status").in("child_id", childIds)
    : { data: [] };

  const attendanceByChild = new Map(
    (attendanceRes.data ?? []).map((a) => [a.child_id, a]),
  );
  const consentByChild = new Map((consents ?? []).map((c) => [c.child_id, c.photo_status]));

  // Totul se raportează la data ședinței, nu la ziua de azi -- indicatorul
  // arată exact abonamentul care se va scădea, inclusiv la completări
  // retroactive.
  const subsByChild = session.workshop_id
    ? await fetchSubscriptionsWithUsage(supabase, childIds)
    : new Map();

  const roster: RosterChild[] = [...byId.values()]
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "ro"))
    .map((c) => {
      const attendance = attendanceByChild.get(c.id);
      const sessionsUsedDefault = Number(session.sessions_used_default);

      const currentSub = session.workshop_id
        ? pickCurrentSubscription(subsByChild.get(c.id) ?? [], session.workshop_id, session.date)
        : null;

      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        status: (attendance?.status as RosterChild["status"]) ?? null,
        waived: attendance != null && Number(attendance.sessions_used) < sessionsUsedDefault,
        photoStatus: (consentByChild.get(c.id) as RosterChild["photoStatus"]) ?? "none",
        isExtra: !fromWorkshop.has(c.id),
        subscriptionStatus: session.workshop_id
          ? currentSub
            ? { color: trafficLight(currentSub, session.date), remaining: currentSub.remaining }
            : { color: "red" as const, remaining: 0 }
          : null,
      };
    });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          ← Calendar
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {session.workshops?.name ?? session.title ?? "Ședință specială"}
            </h1>
            <p className="text-sm text-neutral-500">
              {formatDate(session.date)} · {formatTime(session.start_time)}–{formatTime(session.end_time)}
              {session.session_types?.name && session.session_types.name !== "Obișnuit" && (
                <> · {session.session_types.name}</>
              )}
            </p>
          </div>
          <Link
            href={`/dashboard/sessions/${sessionId}/move`}
            className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Mută
          </Link>
        </div>
      </div>

      {Number(session.sessions_used_default) !== 1 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Această ședință consumă {session.sessions_used_default} din abonament.
        </div>
      )}

      {roster.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Niciun copil în listă încă — adaugă unul mai jos.
        </p>
      ) : (
        <AttendanceList
          sessionId={sessionId}
          initialRoster={roster}
          dropInPrice={session.workshops?.drop_in_price}
        />
      )}

      <Link href={`/dashboard/sessions/${sessionId}/attendance/add`}>
        <Button variant="outline" className="w-full">
          + Adaugă copil
        </Button>
      </Link>
    </div>
  );
}
