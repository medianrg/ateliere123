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
    <li>
      <Link
        href={`/dashboard/sessions/${card.id}/attendance`}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-neutral-50",
          tone === "warning" ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-white",
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
        {actionLabel ? (
          <span className="shrink-0 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white">
            {actionLabel}
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 text-sm font-medium",
              card.completed ? "text-green-600" : "text-neutral-400",
            )}
          >
            {card.completed ? "Completat" : "De completat"}
          </span>
        )}
      </Link>
    </li>
  );
}
