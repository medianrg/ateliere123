"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setAttendance(
  sessionId: string,
  childId: string,
  status: "present" | "absent" | "late",
) {
  const supabase = await createClient();

  const [{ data: session }, { data: userRes }] = await Promise.all([
    supabase.from("sessions").select("sessions_used_default").eq("id", sessionId).single(),
    supabase.auth.getUser(),
  ]);

  const { error } = await supabase.from("attendance").upsert(
    {
      session_id: sessionId,
      child_id: childId,
      status,
      sessions_used: session?.sessions_used_default ?? "1",
      marked_by: userRes.user?.id,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "session_id,child_id" },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/sessions/${sessionId}/attendance`);
}

export async function toggleWaiveCredit(
  sessionId: string,
  childId: string,
  waive: boolean,
) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("sessions_used_default")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("attendance")
    .update({ sessions_used: waive ? 0 : session?.sessions_used_default ?? "1" })
    .eq("session_id", sessionId)
    .eq("child_id", childId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/sessions/${sessionId}/attendance`);
}

export async function addParticipant(sessionId: string, childId: string) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();

  const { error } = await supabase.from("session_participants").upsert(
    {
      session_id: sessionId,
      child_id: childId,
      added_by: userRes.user?.id,
    },
    { onConflict: "session_id,child_id" },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/sessions/${sessionId}/attendance`);
}
