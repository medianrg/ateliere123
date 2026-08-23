import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { proposeSessionDates } from "@/lib/workshop-schedule";
import { GenerateSessionsList } from "./generate-list";

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total / 60) % 24)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function GenerateSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ workshop_id?: string; month?: string; session_type_id?: string }>;
}) {
  const { workshop_id, month, session_type_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: workshops }, { data: sessionTypes }] = await Promise.all([
    supabase
      .from("workshops")
      .select("id, name, frequency, weekday, month_week, start_time, duration_min")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("session_types").select("id, name").eq("is_active", true).order("name"),
  ]);

  const defaultSessionType =
    sessionTypes?.find((t) => t.name === "Obișnuit")?.id ?? sessionTypes?.[0]?.id ?? "";

  const selectedWorkshop = workshops?.find((w) => w.id === workshop_id);

  let proposedDates: string[] = [];
  let startTime = "17:00";
  let endTime = "19:00";
  let alreadyExistingCount = 0;

  if (selectedWorkshop && month) {
    const [year, monthNum] = month.split("-").map(Number);
    const allProposed = proposeSessionDates({
      year,
      month: monthNum,
      frequency: selectedWorkshop.frequency,
      weekday: selectedWorkshop.weekday,
      monthWeek: selectedWorkshop.month_week,
    });

    startTime = selectedWorkshop.start_time?.slice(0, 5) ?? "17:00";
    endTime = addMinutes(startTime, selectedWorkshop.duration_min ?? 120);

    const { data: existing } = await supabase
      .from("sessions")
      .select("date")
      .eq("workshop_id", selectedWorkshop.id)
      .in("date", allProposed);

    const existingDates = new Set((existing ?? []).map((s) => s.date));
    alreadyExistingCount = allProposed.filter((d) => existingDates.has(d)).length;
    proposedDates = allProposed.filter((d) => !existingDates.has(d));
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
        ← Calendar
      </Link>
      <h1 className="text-xl font-semibold">Generează ședințe</h1>

      <form method="get" className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="space-y-1.5">
          <Label htmlFor="workshop_id">Atelier</Label>
          <Select id="workshop_id" name="workshop_id" defaultValue={workshop_id ?? ""} required>
            <option value="" disabled>
              alege atelierul
            </option>
            {(workshops ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="month">Luna</Label>
          <input
            id="month"
            name="month"
            type="month"
            required
            defaultValue={month ?? currentMonthValue()}
            className="h-11 w-full rounded-md border border-neutral-300 px-3 text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="session_type_id">Tip ședință</Label>
          <Select
            id="session_type_id"
            name="session_type_id"
            defaultValue={session_type_id ?? defaultSessionType}
          >
            {(sessionTypes ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" variant="outline" className="w-full">
          Calculează propunerea
        </Button>
      </form>

      {selectedWorkshop && month && (
        <div className="space-y-3">
          {selectedWorkshop.frequency === "none" || !selectedWorkshop.weekday ? (
            <p className="text-sm text-neutral-500">
              Acest atelier nu are un ritm fix setat. Adaugă ședințele individual din{" "}
              <Link href={`/dashboard/sessions/new?workshop=${selectedWorkshop.id}`} className="underline">
                + Ședință nouă
              </Link>
              , sau setează ritmul din fișa atelierului.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500">
                Propunere pe baza ritmului atelierului — mută o dată dacă pică prost
                (vacanță, sărbătoare), șterge ce nu vrei, apoi confirmă.
                {alreadyExistingCount > 0 &&
                  ` ${alreadyExistingCount} ședințe există deja în luna asta și nu sunt propuse din nou.`}
              </p>
              <GenerateSessionsList
                workshopId={selectedWorkshop.id}
                sessionTypeId={session_type_id ?? defaultSessionType}
                startTime={startTime}
                endTime={endTime}
                sessionsUsedDefault="1"
                initialDates={proposedDates}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
