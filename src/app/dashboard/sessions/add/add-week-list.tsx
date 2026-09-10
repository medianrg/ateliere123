"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addWeekSessions } from "./actions";

export type WeekRow = {
  workshopId: string;
  name: string;
  color: string | null;
  date: string;
  startTime: string;
  checked: boolean;
  note: string | null;
  alreadyExists: boolean;
};

export function AddWeekList({
  weekStart,
  initialRows,
}: {
  weekStart: string;
  initialRows: WeekRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();

  function patch(index: number, changes: Partial<WeekRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...changes } : r)));
  }

  const selected = rows.filter((r) => r.checked && r.date !== "");

  function submit() {
    startTransition(async () => {
      await addWeekSessions(
        weekStart,
        selected.map((r) => ({
          workshopId: r.workshopId,
          date: r.date,
          startTime: r.startTime,
        })),
      );
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {rows.map((row, i) => (
          <li key={row.workshopId} className={cn("space-y-2 p-4", row.alreadyExists && "opacity-60")}>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0"
                checked={row.checked}
                disabled={row.alreadyExists}
                onChange={(e) => patch(i, { checked: e.target.checked })}
              />
              {row.color && (
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              <span className="min-w-0 truncate font-medium">{row.name}</span>
            </label>

            <div className="grid grid-cols-2 gap-2 pl-8">
              <Input
                type="date"
                value={row.date}
                disabled={row.alreadyExists}
                onChange={(e) => patch(i, { date: e.target.value, checked: true })}
                aria-label={`Data pentru ${row.name}`}
              />
              <Input
                type="time"
                value={row.startTime}
                disabled={row.alreadyExists}
                onChange={(e) => patch(i, { startTime: e.target.value })}
                aria-label={`Ora pentru ${row.name}`}
              />
            </div>

            {row.note && <p className="pl-8 text-sm text-neutral-500">{row.note}</p>}
          </li>
        ))}
      </ul>

      <Button
        type="button"
        onClick={submit}
        disabled={isPending || selected.length === 0}
        className="w-full"
      >
        {isPending
          ? "Se adaugă..."
          : selected.length === 0
            ? "Bifează ce vrei să adaugi"
            : selected.length === 1
              ? "Adaugă o ședință"
              : `Adaugă ${selected.length} ședințe`}
      </Button>
    </div>
  );
}
