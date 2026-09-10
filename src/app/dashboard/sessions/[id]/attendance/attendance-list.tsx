"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  setAttendance,
  toggleWaiveCredit,
  clearAttendance,
  removeParticipant,
} from "./actions";

type AttendanceStatus = "present" | "absent" | null;
type PhotoStatus = "full" | "masked" | "none";
type TrafficLight = "green" | "yellow" | "red";

export type RosterChild = {
  id: string;
  first_name: string;
  last_name: string;
  status: AttendanceStatus;
  waived: boolean;
  photoStatus: PhotoStatus;
  /** Adăugat manual la ședința asta (recuperare, frate, copil de probă),
   * deci poate fi și scos din ea. */
  isExtra: boolean;
  /** null = ședință specială, fără atelier -> fără concept de abonament. */
  subscriptionStatus: { color: TrafficLight; remaining: number } | null;
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

const SUBSCRIPTION_DOT: Record<TrafficLight, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

export function AttendanceList({
  sessionId,
  initialRoster,
  dropInPrice,
}: {
  sessionId: string;
  initialRoster: RosterChild[];
  dropInPrice?: string;
}) {
  const [roster, setRoster] = useState(initialRoster);

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {roster.map((child) => (
        <AttendanceRow
          key={child.id}
          sessionId={sessionId}
          child={child}
          dropInPrice={dropInPrice}
          onChange={(patch) =>
            setRoster((prev) =>
              prev.map((c) => (c.id === child.id ? { ...c, ...patch } : c)),
            )
          }
          onRemove={() =>
            setRoster((prev) => prev.filter((c) => c.id !== child.id))
          }
        />
      ))}
    </ul>
  );
}

function AttendanceRow({
  sessionId,
  child,
  dropInPrice,
  onChange,
  onRemove,
}: {
  sessionId: string;
  child: RosterChild;
  dropInPrice?: string;
  onChange: (patch: Partial<RosterChild>) => void;
  onRemove: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function mark(status: "present" | "absent") {
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

  function clear() {
    onChange({ status: null, waived: false });
    startTransition(async () => {
      await clearAttendance(sessionId, child.id);
    });
  }

  function remove() {
    onRemove();
    startTransition(async () => {
      await removeParticipant(sessionId, child.id);
    });
  }

  const needsDropIn = child.subscriptionStatus?.color === "red";

  return (
    <li className={cn("space-y-2 p-4", isPending && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {child.subscriptionStatus && (
            <span
              className={cn(
                "h-3 w-3 shrink-0 rounded-full",
                SUBSCRIPTION_DOT[child.subscriptionStatus.color],
              )}
              title={
                child.subscriptionStatus.color === "red"
                  ? "fără abonament valid"
                  : `${child.subscriptionStatus.remaining} ședințe rămase`
              }
            />
          )}
          <span
            className={cn("h-3 w-3 shrink-0 rounded-full", PHOTO_DOT[child.photoStatus])}
            title={PHOTO_LABEL[child.photoStatus]}
          />
          <span className="truncate font-medium">
            {child.first_name} {child.last_name}
          </span>
          {child.isExtra && (
            <span className="shrink-0 text-xs text-neutral-400">în plus</span>
          )}
        </div>
        {needsDropIn && child.status === "present" && dropInPrice && (
          <Link
            href={`/dashboard/payments/new?child=${child.id}&amount=${dropInPrice}&note=${encodeURIComponent(
              "drop-in",
            )}`}
            className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
          >
            Plată drop-in {dropInPrice} lei
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
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

      <div className="flex gap-4 text-sm">
        {child.status !== null && (
          <button type="button" onClick={clear} className="text-neutral-500 underline">
            Șterge bifa
          </button>
        )}
        {child.isExtra && (
          <button type="button" onClick={remove} className="text-neutral-500 underline">
            Scoate din listă
          </button>
        )}
      </div>
    </li>
  );
}
