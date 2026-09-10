"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayInBucharest } from "@/lib/date";

type Workshop = { id: string; name: string; price_per_session: string };

export type SubscriptionInitial = {
  workshop_id: string | null;
  name: string;
  total_sessions: number;
  price_per_session: string;
  price: string;
  price_note: string | null;
  start_date: string;
  end_date: string;
};

export function SubscriptionForm({
  action,
  childId,
  childOptions,
  workshops,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  /** Fixat când vii de pe fișa unui copil; altfel se alege din listă. */
  childId?: string;
  childOptions?: { id: string; first_name: string; last_name: string }[];
  workshops: Workshop[];
  initial?: SubscriptionInitial;
  submitLabel: string;
}) {
  const pricePerSessionRef = useRef<HTMLInputElement>(null);
  const totalSessionsRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  function recomputePrice() {
    const perSession = Number(pricePerSessionRef.current?.value ?? 0);
    const total = Number(totalSessionsRef.current?.value ?? 0);
    if (priceRef.current) {
      priceRef.current.value = (perSession * total).toString();
    }
  }

  function handleWorkshopChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const workshop = workshops.find((w) => w.id === e.target.value);
    if (workshop && pricePerSessionRef.current) {
      pricePerSessionRef.current.value = workshop.price_per_session;
      recomputePrice();
    }
  }

  const today = todayInBucharest();
  const inThreeMonths = (() => {
    const [y, m, d] = today.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCMonth(date.getUTCMonth() + 3);
    return date.toISOString().slice(0, 10);
  })();

  return (
    <form action={action} className="space-y-4">
      {childId ? (
        <input type="hidden" name="child_id" value={childId} />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="child_id">Copilul</Label>
          <Select id="child_id" name="child_id" required defaultValue="">
            <option value="" disabled>
              alege copilul
            </option>
            {(childOptions ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="workshop_id">Atelier</Label>
        <Select
          id="workshop_id"
          name="workshop_id"
          required
          defaultValue={initial?.workshop_id ?? ""}
          onChange={handleWorkshopChange}
        >
          <option value="">alege atelierul</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nume abonament</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="ex. 8 ședințe septembrie"
          defaultValue={initial?.name}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="total_sessions">Ședințe incluse</Label>
          <Input
            ref={totalSessionsRef}
            id="total_sessions"
            name="total_sessions"
            type="number"
            min="1"
            required
            defaultValue={initial?.total_sessions ?? 8}
            onChange={recomputePrice}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price_per_session">Preț / ședință</Label>
          <Input
            ref={pricePerSessionRef}
            id="price_per_session"
            name="price_per_session"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.price_per_session ?? "0"}
            onChange={recomputePrice}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price">Preț total (editabil — reduceri, gratuități)</Label>
        <Input
          ref={priceRef}
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initial?.price ?? "0"}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price_note">Motivul reducerii (opțional, strict intern)</Label>
        <Textarea
          id="price_note"
          name="price_note"
          rows={2}
          defaultValue={initial?.price_note ?? undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Data început</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={initial?.start_date ?? today}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">Data expirării</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={initial?.end_date ?? inThreeMonths}
          />
        </div>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
