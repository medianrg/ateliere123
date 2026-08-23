import Link from "next/link";
import { addDays, formatTime, formatWeekdayDate } from "@/lib/date";
import type { SessionCard } from "@/lib/calendar-data";
import { SessionCardLink } from "./session-card-link";

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function WeekView({
  weekStart,
  today,
  isCurrentWeek,
  weekCards,
  pastUnchecked,
  nextUpcoming,
}: {
  weekStart: string;
  today: string;
  isCurrentWeek: boolean;
  weekCards: SessionCard[];
  pastUnchecked: SessionCard[];
  nextUpcoming: SessionCard | null;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const cardsByDate = new Map<string, SessionCard[]>();
  for (const card of weekCards) {
    const list = cardsByDate.get(card.date) ?? [];
    list.push(card);
    cardsByDate.set(card.date, list);
  }

  const todayCards = isCurrentWeek ? (cardsByDate.get(today) ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, i) => (
          <div key={day} className="space-y-1">
            <p className="text-xs text-neutral-500">{DAY_LETTERS[i]}</p>
            <p className={day === today ? "font-semibold text-neutral-900" : "text-neutral-700"}>
              {day.slice(8, 10)}
            </p>
            <div className="flex justify-center">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  cardsByDate.has(day) ? "bg-neutral-900" : "bg-transparent"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {pastUnchecked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-amber-800">De completat</h2>
          <ul className="space-y-2">
            {pastUnchecked.map((card) => (
              <SessionCardLink key={card.id} card={card} tone="warning" actionLabel="Completează" />
            ))}
          </ul>
        </section>
      )}

      {isCurrentWeek && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">
            Astăzi · {formatWeekdayDate(today)}
          </h2>
          {todayCards.length > 0 ? (
            <ul className="space-y-2">
              {todayCards.map((card) => (
                <SessionCardLink key={card.id} card={card} />
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
              <p>Nicio ședință astăzi.</p>
              {nextUpcoming && (
                <p className="mt-2 flex items-center justify-between gap-2">
                  <span>
                    Următoarea: {formatWeekdayDate(nextUpcoming.date)},{" "}
                    {formatTime(nextUpcoming.startTime)}
                  </span>
                  <Link
                    href={`/dashboard/sessions/${nextUpcoming.id}/attendance`}
                    className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Deschide
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {isCurrentWeek ? "Săptămâna aceasta" : "Ședințele săptămânii"}
        </h2>
        {weekCards.length > 0 ? (
          <ul className="space-y-2">
            {weekCards
              .filter((c) => !isCurrentWeek || c.date !== today)
              .map((card) => (
                <SessionCardLink key={card.id} card={card} />
              ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Nicio ședință săptămâna asta.</p>
        )}
      </section>
    </div>
  );
}
