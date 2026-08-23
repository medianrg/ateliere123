import Link from "next/link";
import { addDays, daysInMonth, isoWeekday } from "@/lib/date";
import type { SessionCard } from "@/lib/calendar-data";

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function MonthView({
  monthStart,
  today,
  monthCards,
}: {
  monthStart: string;
  today: string;
  monthCards: SessionCard[];
}) {
  const byDate = new Map<string, SessionCard[]>();
  for (const card of monthCards) {
    const list = byDate.get(card.date) ?? [];
    list.push(card);
    byDate.set(card.date, list);
  }

  const leadingBlanks = isoWeekday(monthStart) - 1;
  const totalDays = daysInMonth(monthStart);
  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => addDays(monthStart, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {DAY_LETTERS.map((letter, i) => (
          <div key={i}>{letter}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const cards = byDate.get(day) ?? [];
          const hasUnfinished = cards.some((c) => !c.completed && day < today);
          return (
            <Link
              key={day}
              href={`/dashboard?view=week&date=${day}`}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm hover:bg-neutral-100 ${
                day === today ? "bg-neutral-900 text-white hover:bg-neutral-800" : ""
              }`}
            >
              <span>{day.slice(8, 10)}</span>
              {cards.length > 0 && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasUnfinished
                      ? "bg-amber-500"
                      : day === today
                        ? "bg-white"
                        : "bg-neutral-900"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
