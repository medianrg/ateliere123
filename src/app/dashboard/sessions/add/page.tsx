import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatWeekdayDate, mondayOfWeek, todayInBucharest } from "@/lib/date";
import { proposeWeekSlot } from "@/lib/workshop-schedule";
import { AddWeekList, type WeekRow } from "./add-week-list";

type Workshop = {
  id: string;
  name: string;
  color: string | null;
  frequency: "weekly" | "biweekly" | "monthly" | "none";
  weekday: number | null;
  start_time: string | null;
  month_week: number | null;
};

export default async function AddSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = mondayOfWeek(week ?? todayInBucharest());
  const weekEnd = addDays(weekStart, 6);

  const supabase = await createClient();

  const [{ data: workshops }, { data: existing }] = await Promise.all([
    supabase
      .from("workshops")
      .select("id, name, color, frequency, weekday, start_time, month_week")
      .eq("is_active", true)
      .order("name")
      .returns<Workshop[]>(),
    supabase
      .from("sessions")
      .select("workshop_id, date")
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .neq("status", "cancelled"),
  ]);

  const takenSlots = new Set(
    (existing ?? []).map((s) => `${s.workshop_id}|${s.date}`),
  );

  const rows: WeekRow[] = (workshops ?? []).map((w) => {
    const slot = proposeWeekSlot({
      weekStart,
      frequency: w.frequency,
      weekday: w.weekday,
      monthWeek: w.month_week,
    });
    const alreadyExists = slot.date !== "" && takenSlots.has(`${w.id}|${slot.date}`);
    return {
      workshopId: w.id,
      name: w.name,
      color: w.color,
      date: slot.date,
      startTime: w.start_time?.slice(0, 5) ?? "17:00",
      checked: slot.suggested && !alreadyExists,
      note: alreadyExists ? "e deja în calendar săptămâna asta" : slot.note,
      alreadyExists,
    };
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href={`/dashboard?view=week&date=${weekStart}`}
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Calendar
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Adaugă ședințe</h1>
        <p className="text-sm text-neutral-500">
          Săptămâna {formatWeekdayDate(weekStart)} – {formatWeekdayDate(weekEnd)}.
          Bifează ce ai săptămâna asta. Poți schimba ziua și ora aici, sau muta
          ședința mai târziu direct din calendar.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
          <p>Niciun atelier activ.</p>
          <Link href="/dashboard/workshops/new" className="mt-2 inline-block underline">
            + Atelier nou
          </Link>
        </div>
      ) : (
        <AddWeekList weekStart={weekStart} initialRows={rows} />
      )}

      <p className="border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        Ai ceva care nu ține de un atelier — o zi de vacanță, o recuperare, un
        eveniment?{" "}
        <Link href="/dashboard/sessions/new" className="underline">
          Adaugă o ședință separată
        </Link>
      </p>
    </div>
  );
}
