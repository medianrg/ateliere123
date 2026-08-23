import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionRow = {
  id: string;
  date: string;
  start_time: string;
  workshop_id: string | null;
  title: string | null;
  workshops: { name: string } | null;
};

export type SessionCard = {
  id: string;
  date: string;
  startTime: string;
  label: string;
  childCount: number;
  completed: boolean;
};

export const SESSION_COLUMNS =
  "id, date, start_time, workshop_id, title, workshops(name), status";

/** Câți copii are fiecare ședință și dacă prezența e completată -- niciodată
 * dintr-un contor, mereu derivat din child_workshops/session_participants
 * și attendance. */
export async function enrichSessions(
  supabase: SupabaseClient,
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

  const completedSessionIds = new Set((attendanceRes.data ?? []).map((a) => a.session_id));

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
    completed: completedSessionIds.has(s.id),
  }));
}
