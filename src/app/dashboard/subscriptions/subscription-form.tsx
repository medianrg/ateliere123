"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayInBucharest } from "@/lib/date";

type Workshop = { id: string; name: string; price_per_session: string };

export function SubscriptionForm({
  action,
  childId,
  workshops,
}: {
  action: (formData: FormData) => void;
  childId: string;
  workshops: Workshop[];
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
      <input type="hidden" name="child_id" value={childId} />

      <div className="space-y-1.5">
        <Label htmlFor="workshop_id">Atelier</Label>
        <Select id="workshop_id" name="workshop_id" required onChange={handleWorkshopChange}>
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
        <Input id="name" name="name" required placeholder="ex. 8 ședințe septembrie" />
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
            defaultValue="8"
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
            defaultValue="0"
            onChange={recomputePrice}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price">Preț total (editabil — reduceri, gratuități)</Label>
        <Input ref={priceRef} id="price" name="price" type="number" step="0.01" min="0" defaultValue="0" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price_note">Motivul reducerii (opțional, strict intern)</Label>
        <Textarea id="price_note" name="price_note" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Data început</Label>
          <Input id="start_date" name="start_date" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">Data expirării</Label>
          <Input id="end_date" name="end_date" type="date" required defaultValue={inThreeMonths} />
        </div>
      </div>

      <Button type="submit">Creează abonamentul</Button>
    </form>
  );
}
