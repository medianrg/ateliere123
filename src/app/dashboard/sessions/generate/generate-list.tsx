"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmGeneratedSessions } from "./actions";

export function GenerateSessionsList({
  workshopId,
  sessionTypeId,
  startTime,
  endTime,
  sessionsUsedDefault,
  initialDates,
}: {
  workshopId: string;
  sessionTypeId: string;
  startTime: string;
  endTime: string;
  sessionsUsedDefault: string;
  initialDates: string[];
}) {
  const [dates, setDates] = useState(initialDates);
  const [isPending, startTransition] = useTransition();

  function updateDate(index: number, value: string) {
    setDates((prev) => prev.map((d, i) => (i === index ? value : d)));
  }

  function removeDate(index: number) {
    setDates((prev) => prev.filter((_, i) => i !== index));
  }

  function confirm() {
    startTransition(async () => {
      await confirmGeneratedSessions(
        workshopId,
        sessionTypeId,
        startTime,
        endTime,
        sessionsUsedDefault,
        dates,
      );
    });
  }

  if (dates.length === 0) {
    return <p className="text-sm text-neutral-500">Nicio ședință propusă în lista rămasă.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {dates.map((date, i) => (
          <li key={i} className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => updateDate(i, e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeDate(i)}>
              Șterge
            </Button>
          </li>
        ))}
      </ul>

      <Button type="button" onClick={confirm} disabled={isPending} className="w-full">
        {isPending ? "Se creează..." : `Confirmă ${dates.length} ședințe`}
      </Button>
    </div>
  );
}
