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

/** "2026-08-26" -> "marți, 26 august" — explicit, nu doar "azi". */
export function formatWeekdayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const label = new Intl.DateTimeFormat("ro-RO", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return label;
}

/** Data (YYYY-MM-DD) a zilei de Luni din săptămâna care conține `dateStr`. */
export function mondayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  const isoWeekday = ((d.getUTCDay() + 6) % 7) + 1; // 1=Luni...7=Duminică
  d.setUTCDate(d.getUTCDate() - (isoWeekday - 1));
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
}

/** Adaugă `days` zile la o dată "YYYY-MM-DD", fără dependențe de timezone. */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  d.setUTCDate(d.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
}

/** 1=Luni ... 7=Duminică pentru o dată "YYYY-MM-DD". */
export function isoWeekday(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  return ((d.getUTCDay() + 6) % 7) + 1;
}

/** Prima zi a lunii care conține `dateStr`, ca "YYYY-MM-DD". */
export function firstOfMonth(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${year}-${month}-01`;
}

/** Adaugă `months` luni la o dată "YYYY-MM-DD" (rămâne pe ziua 1). */
export function addMonths(dateStr: string, months: number): string {
  const [year, month] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
}

/** Câte zile are luna care conține `dateStr`. */
export function daysInMonth(dateStr: string): number {
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

/** "2026-08-01" -> "august 2026" */
export function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("ro-RO", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}
