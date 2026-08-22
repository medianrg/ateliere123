import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/date";
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
    credit_cost: string;
    group_id: string | null;
    title: string | null;
    groups: { name: string } | null;
    session_types: { name: string } | null;
  };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, date, start_time, end_time, credit_cost, group_id, title, groups(name), session_types(name)")
    .eq("id", sessionId)
    .returns<SessionResult[]>()
    .single();

  if (!session) notFound();

  const [groupChildrenRes, participantsRes, attendanceRes] = await Promise.all([
    session.group_id
      ? supabase
          .from("children")
          .select("id, first_name, last_name")
          .eq("group_id", session.group_id)
          .eq("is_active", true)
      : Promise.resolve({ data: [] }),
    supabase
      .from("session_participants")
      .select("children(id, first_name, last_name)")
      .eq("session_id", sessionId),
    supabase.from("attendance").select("child_id, status, credits_used").eq("session_id", sessionId),
  ]);

  type ChildRef = { id: string; first_name: string; last_name: string };

  const byId = new Map<string, ChildRef>();
  for (const c of (groupChildrenRes.data ?? []) as ChildRef[]) byId.set(c.id, c);
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

  const roster: RosterChild[] = [...byId.values()]
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "ro"))
    .map((c) => {
      const attendance = attendanceByChild.get(c.id);
      const creditCost = Number(session.credit_cost);
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        status: (attendance?.status as RosterChild["status"]) ?? null,
        waived: attendance != null && Number(attendance.credits_used) < creditCost,
        photoStatus: (consentByChild.get(c.id) as RosterChild["photoStatus"]) ?? "none",
      };
    });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <Link href="/dashboard/sessions" className="text-sm text-neutral-500 hover:underline">
          ← Toate ședințele
        </Link>
        <h1 className="text-xl font-semibold">
          {session.groups?.name ?? session.title ?? "Atelier special"}
        </h1>
        <p className="text-sm text-neutral-500">
          {formatDate(session.date)} · {formatTime(session.start_time)}–{formatTime(session.end_time)}
          {" · "}
          {session.session_types?.name}
        </p>
      </div>

      {Number(session.credit_cost) !== 1 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Acest atelier consumă {session.credit_cost} ședințe.
        </div>
      )}

      {roster.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Niciun copil în listă încă — adaugă unul mai jos.
        </p>
      ) : (
        <AttendanceList sessionId={sessionId} initialRoster={roster} />
      )}

      <Link href={`/dashboard/sessions/${sessionId}/attendance/add`}>
        <Button variant="outline" className="w-full">
          + Adaugă copil
        </Button>
      </Link>
    </div>
  );
}
