"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscriptionsWithUsage, pickCurrentSubscription } from "@/lib/finance";

export async function setAttendance(
  sessionId: string,
  childId: string,
  status: "present" | "absent",
) {
  const supabase = await createClient();

  const [{ data: session }, { data: userRes }] = await Promise.all([
    supabase
      .from("sessions")
      .select("date, sessions_used_default, workshop_id")
      .eq("id", sessionId)
      .single(),
    supabase.auth.getUser(),
  ]);

  let subscriptionId: string | null = null;
  let sessionsUsed = session?.sessions_used_default ?? "1";
  let isDropIn = false;

  if (session?.workshop_id) {
    const subsByChild = await fetchSubscriptionsWithUsage(supabase, [childId]);
    // Abonamentul se alege după data ședinței, nu după ziua de azi: altfel o
    // prezență completată retroactiv s-ar scădea din abonamentul greșit.
    const current = pickCurrentSubscription(
      subsByChild.get(childId) ?? [],
      session.workshop_id,
      session.date,
    );
    if (current) {
      subscriptionId = current.id;
    } else {
      isDropIn = true;
      sessionsUsed = "0";
    }
  } else {
    // Ședință specială, fără atelier -> fără concept de abonament.
    isDropIn = true;
    sessionsUsed = "0";
  }

  const { error } = await supabase.from("attendance").upsert(
    {
      session_id: sessionId,
      child_id: childId,
      status,
      sessions_used: sessionsUsed,
      subscription_id: subscriptionId,
      is_drop_in: isDropIn,
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

/** Șterge bifa unui copil, readucând rândul la starea „necompletat".
 *
 * E singura ștergere reală din aplicație și e intenționată: o prezență pusă
 * din greșeală nu se poate corecta comutând între prezent și absent -- ambele
 * sunt afirmații despre copil. PLAN.md o prevede explicit în `audit_log`. */
export async function clearAttendance(sessionId: string, childId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("session_id", sessionId)
    .eq("child_id", childId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/sessions/${sessionId}/attendance`);
  revalidatePath("/dashboard");
}

/** Scoate din ședință un copil adăugat manual (recuperare, frate, copil de
 * probă). Nu atinge copiii înscriși la atelier -- aceia pleacă din fișa lor,
 * prin „Părăsește atelierul". */
export async function removeParticipant(sessionId: string, childId: string) {
  const supabase = await createClient();

  await clearAttendance(sessionId, childId);

  const { error } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", sessionId)
    .eq("child_id", childId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/sessions/${sessionId}/attendance`);
}
