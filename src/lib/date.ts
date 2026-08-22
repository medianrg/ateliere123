const TIME_ZONE = "Europe/Bucharest";

/** "2026-08-22" -> "22.08.2026" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

/** "14:30:00" -> "14:30" */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "—";
  return timeStr.slice(0, 5);
}

/** Today's date in Europe/Bucharest, as "YYYY-MM-DD" (for <input type="date"> and queries). */
export function todayInBucharest(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date(),
  );
}
