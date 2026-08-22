"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setAttendance, toggleWaiveCredit } from "./actions";

type AttendanceStatus = "present" | "absent" | "late" | null;
type PhotoStatus = "full" | "masked" | "none";

export type RosterChild = {
  id: string;
  first_name: string;
  last_name: string;
  status: AttendanceStatus;
  waived: boolean;
  photoStatus: PhotoStatus;
};

const PHOTO_DOT: Record<PhotoStatus, string> = {
  full: "bg-green-500",
  masked: "bg-yellow-400",
  none: "bg-red-500",
};

const PHOTO_LABEL: Record<PhotoStatus, string> = {
  full: "poză completă permisă",
  masked: "poză cu fața acoperită",
  none: "fără poze",
};

export function AttendanceList({
  sessionId,
  initialRoster,
}: {
  sessionId: string;
  initialRoster: RosterChild[];
}) {
  const [roster, setRoster] = useState(initialRoster);

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {roster.map((child) => (
        <AttendanceRow
          key={child.id}
          sessionId={sessionId}
          child={child}
          onChange={(patch) =>
            setRoster((prev) =>
              prev.map((c) => (c.id === child.id ? { ...c, ...patch } : c)),
            )
          }
        />
      ))}
    </ul>
  );
}

function AttendanceRow({
  sessionId,
  child,
  onChange,
}: {
  sessionId: string;
  child: RosterChild;
  onChange: (patch: Partial<RosterChild>) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function mark(status: "present" | "absent" | "late") {
    onChange({ status, waived: false });
    startTransition(async () => {
      await setAttendance(sessionId, child.id, status);
    });
  }

  function waive(next: boolean) {
    onChange({ waived: next });
    startTransition(async () => {
      await toggleWaiveCredit(sessionId, child.id, next);
    });
  }

  return (
    <li className={cn("space-y-2 p-4", isPending && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("h-3 w-3 shrink-0 rounded-full", PHOTO_DOT[child.photoStatus])}
            title={PHOTO_LABEL[child.photoStatus]}
          />
          <span className="truncate font-medium">
            {child.first_name} {child.last_name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => mark("present")}
          className={cn(
            "h-11 rounded-md text-sm font-medium transition-colors",
            child.status === "present"
              ? "bg-green-600 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
          )}
        >
          Prezent
        </button>
        <button
          type="button"
          onClick={() => mark("absent")}
          className={cn(
            "h-11 rounded-md text-sm font-medium transition-colors",
            child.status === "absent"
              ? "bg-red-600 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
          )}
        >
          Absent
        </button>
        <button
          type="button"
          onClick={() => mark("late")}
          className={cn(
            "h-11 rounded-md text-sm font-medium transition-colors",
            child.status === "late"
              ? "bg-yellow-500 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
          )}
        >
          Întârziat
        </button>
      </div>

      {child.status === "absent" && (
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={child.waived}
            onChange={(e) => waive(e.target.checked)}
          />
          Nu scădea ședința (absență iertată)
        </label>
      )}
    </li>
  );
}
