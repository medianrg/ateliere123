import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatTime, formatWeekdayDate } from "@/lib/date";
import type { SessionCard } from "@/lib/calendar-data";

export function SessionCardLink({
  card,
  tone = "default",
  actionLabel,
}: {
  card: SessionCard;
  tone?: "default" | "warning";
  /** Text pe buton, ex. "Completează" pentru cardurile din "De completat". */
  actionLabel?: string;
}) {
  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-lg border",
        tone === "warning" ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-white",
      )}
    >
      {card.color && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: card.color }}
        />
      )}

      {/* Cardul întreg e apăsabil: linkul acoperă toată suprafața, iar
          acțiunile de deasupra își recapătă clickul. */}
      <Link
        href={`/dashboard/sessions/${card.id}/attendance`}
        className="absolute inset-0"
        aria-label={`${card.label} — ${formatWeekdayDate(card.date)}, ${formatTime(card.startTime)}`}
      />

      <div
        className={cn(
          "pointer-events-none relative flex items-center justify-between gap-3 p-4",
          card.color && "pl-5",
        )}
      >
        <div className="min-w-0">
          <p className={cn("font-medium", tone === "warning" && "text-amber-900")}>
            {tone === "warning" && "⚠ "}
            {card.label}
          </p>
          <p className="text-sm text-neutral-500">
            {formatWeekdayDate(card.date)} · {formatTime(card.startTime)} · {card.childCount} copii
          </p>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          {actionLabel ? (
            <span className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white">
              {actionLabel}
            </span>
          ) : (
            <span
              className={cn(
                "text-sm font-medium",
                card.completed ? "text-green-600" : "text-neutral-400",
              )}
            >
              {card.completed ? "Completat" : "De completat"}
            </span>
          )}
          <Link
            href={`/dashboard/sessions/${card.id}/move`}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Mută
          </Link>
        </div>
      </div>
    </li>
  );
}
