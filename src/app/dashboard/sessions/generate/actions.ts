"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function confirmGeneratedSessions(
  workshopId: string,
  sessionTypeId: string,
  startTime: string,
  endTime: string,
  sessionsUsedDefault: string,
  dates: string[],
) {
  const supabase = await createClient();

  // Regenerarea nu suprascrie și nu șterge nimic: sesiunile care există deja
  // (aceeași dată, la același atelier) sunt sărite.
  const { data: existing } = await supabase
    .from("sessions")
    .select("date")
    .eq("workshop_id", workshopId)
    .in("date", dates);

  const existingDates = new Set((existing ?? []).map((s) => s.date));
  const toInsert = dates
    .filter((date) => !existingDates.has(date))
    .map((date) => ({
      workshop_id: workshopId,
      session_type_id: sessionTypeId,
      date,
      start_time: startTime,
      end_time: endTime,
      sessions_used_default: sessionsUsedDefault,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("sessions").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  redirect("/dashboard");
}
