"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createSession(formData: FormData) {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      session_type_id: str(formData, "session_type_id"),
      workshop_id: str(formData, "workshop_id"),
      title: str(formData, "title"),
      date: str(formData, "date"),
      start_time: str(formData, "start_time"),
      end_time: str(formData, "end_time"),
      sessions_used_default: str(formData, "sessions_used_default") ?? "1",
      topic: str(formData, "topic"),
      capacity: str(formData, "capacity"),
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  redirect(`/dashboard/sessions/${session.id}/attendance`);
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  // O ședință anulată nu consumă nimic din abonamente, indiferent ce era
  // bifat înainte de anulare.
  const { error: attendanceError } = await supabase
    .from("attendance")
    .update({ sessions_used: 0 })
    .eq("session_id", sessionId);
  if (attendanceError) throw new Error(attendanceError.message);

  revalidatePath("/dashboard");
}

export async function reopenSession(sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({ status: "scheduled" })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
