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
      group_id: str(formData, "group_id"),
      title: str(formData, "title"),
      date: str(formData, "date"),
      start_time: str(formData, "start_time"),
      end_time: str(formData, "end_time"),
      credit_cost: str(formData, "credit_cost") ?? "1",
      topic: str(formData, "topic"),
      capacity: str(formData, "capacity"),
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/sessions");
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

  // A cancelled session never consumes credits, no matter what was marked
  // before it was cancelled.
  const { error: attendanceError } = await supabase
    .from("attendance")
    .update({ credits_used: 0 })
    .eq("session_id", sessionId);
  if (attendanceError) throw new Error(attendanceError.message);

  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard");
}

export async function reopenSession(sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sessions")
    .update({ status: "scheduled" })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard");
}
