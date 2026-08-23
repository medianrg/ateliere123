/** Zilele (1=Luni...7=Duminică) în care cade `weekday` în luna dată. */
function occurrencesOfWeekdayInMonth(
  year: number,
  month: number, // 1-12
  weekday: number, // 1-7 (ISO: Luni=1, Duminică=7)
): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const isoWeekday = ((d.getUTCDay() + 6) % 7) + 1; // JS getDay: 0=Duminică -> ISO 7
    if (isoWeekday === weekday) {
      dates.push(
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
  }

  return dates;
}

/**
 * Propune datele ședințelor pentru un atelier, într-o lună dată, pe baza
 * ritmului lui. E doar un punct de plecare — Rebecca poate muta sau șterge
 * orice dată din listă înainte să confirme.
 */
export function proposeSessionDates({
  year,
  month,
  frequency,
  weekday,
  monthWeek,
}: {
  year: number;
  month: number;
  frequency: "weekly" | "biweekly" | "monthly" | "none";
  weekday: number | null;
  monthWeek: number | null;
}): string[] {
  if (!weekday || frequency === "none") return [];

  const occurrences = occurrencesOfWeekdayInMonth(year, month, weekday);

  if (frequency === "weekly") return occurrences;

  if (frequency === "biweekly") {
    return occurrences.filter((_, i) => i % 2 === 0);
  }

  if (frequency === "monthly") {
    if (!monthWeek) return [];
    const picked = occurrences[monthWeek - 1];
    return picked ? [picked] : [];
  }

  return [];
}
