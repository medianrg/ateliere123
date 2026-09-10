import { addDays } from "@/lib/date";

export type WeekSlot = {
  /** Data propusă în săptămâna vizualizată, sau "" dacă atelierul n-are zi fixă. */
  date: string;
  /** Bifat din start — o sugestie, nu o regulă. */
  suggested: boolean;
  /** Explicație scurtă, afișată sub rând când ritmul nu e săptămânal. */
  note: string | null;
};

/**
 * Ce propune aplicația pentru un atelier, într-o săptămână anume.
 *
 * Rebecca alege în fiecare săptămână ce ședințe adaugă — asta e doar poziția
 * de pornire, calculată din ritmul atelierului. Nimic nu se creează fără ca ea
 * să bifeze și să confirme.
 */
export function proposeWeekSlot({
  weekStart,
  frequency,
  weekday,
  monthWeek,
}: {
  weekStart: string;
  frequency: "weekly" | "biweekly" | "monthly" | "none";
  weekday: number | null;
  monthWeek: number | null;
}): WeekSlot {
  if (!weekday || frequency === "none") {
    return { date: "", suggested: false, note: "fără zi fixă — alege data" };
  }

  const date = addDays(weekStart, weekday - 1);

  if (frequency === "weekly") {
    return { date, suggested: true, note: null };
  }

  if (frequency === "biweekly") {
    return {
      date,
      suggested: false,
      note: "la două săptămâni — bifează când e rândul lui",
    };
  }

  // Lunar: se propune doar în săptămâna în care cade a N-a apariție a zilei.
  const dayOfMonth = Number(date.slice(8, 10));
  const occurrence = Math.ceil(dayOfMonth / 7);
  const matches = monthWeek != null && occurrence === monthWeek;
  return {
    date,
    suggested: matches,
    note: matches ? null : "lunar — nu e săptămâna obișnuită",
  };
}

/** "17:00" + 120 -> "19:00". Trece peste miezul nopții fără să crape. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total / 60) % 24)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
