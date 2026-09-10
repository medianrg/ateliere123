"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addMinutesToTime } from "@/lib/workshop-schedule";

type NewSlot = { workshopId: string; date: string; startTime: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export async function addWeekSessions(weekStart: string, slots: NewSlot[]) {
  const valid = slots.filter(
    (s) => DATE_RE.test(s.date) && TIME_RE.test(s.startTime) && s.workshopId,
  );
  if (valid.length === 0) redirect(`/dashboard?view=week&date=${weekStart}`);

  const supabase = await createClient();

  const workshopIds = [...new Set(valid.map((s) => s.workshopId))];
  const dates = [...new Set(valid.map((s) => s.date))];

  const [{ data: workshops }, { data: sessionTypes }, { data: existing }] =
    await Promise.all([
      supabase
        .from("workshops")
        .select("id, duration_min")
        .in("id", workshopIds)
        .eq("is_active", true),
      supabase.from("session_types").select("id, name").eq("is_active", true).order("name"),
      supabase.from("sessions").select("workshop_id, date").in("date", dates),
    ]);

  const sessionTypeId =
    sessionTypes?.find((t) => t.name === "Obișnuit")?.id ?? sessionTypes?.[0]?.id;
  if (!sessionTypeId) {
    throw new Error(
      "Nu există niciun tip de ședință. Adaugă unul din Setări → Tipuri de ședință.",
    );
  }

  const durationByWorkshop = new Map(
    (workshops ?? []).map((w) => [w.id as string, (w.duration_min as number | null) ?? 120]),
  );
  const taken = new Set((existing ?? []).map((s) => `${s.workshop_id}|${s.date}`));

  const toInsert = valid
    .filter((s) => durationByWorkshop.has(s.workshopId))
    .filter((s) => !taken.has(`${s.workshopId}|${s.date}`))
    .map((s) => ({
      workshop_id: s.workshopId,
      session_type_id: sessionTypeId,
      date: s.date,
      start_time: s.startTime,
      end_time: addMinutesToTime(s.startTime, durationByWorkshop.get(s.workshopId)!),
      sessions_used_default: "1",
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("sessions").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?view=week&date=${weekStart}`);
}
