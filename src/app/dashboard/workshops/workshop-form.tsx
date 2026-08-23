"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type WorkshopFormValues = {
  name?: string;
  min_age?: number | null;
  max_age?: number | null;
  price_per_session?: string | null;
  drop_in_price?: string | null;
  color?: string | null;
  frequency?: string;
  weekday?: number | null;
  start_time?: string | null;
  duration_min?: number | null;
  month_week?: number | null;
  sessions_per_month?: number | null;
  sort_order?: number;
};

const WEEKDAYS = [
  { value: 1, label: "Luni" },
  { value: 2, label: "Marți" },
  { value: 3, label: "Miercuri" },
  { value: 4, label: "Joi" },
  { value: 5, label: "Vineri" },
  { value: 6, label: "Sâmbătă" },
  { value: 7, label: "Duminică" },
];

export function WorkshopForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: WorkshopFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nume atelier</Label>
        <Input id="name" name="name" required defaultValue={initial?.name} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="min_age">Vârstă minimă (etichetă)</Label>
          <Input
            id="min_age"
            name="min_age"
            type="number"
            defaultValue={initial?.min_age ?? undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max_age">Vârstă maximă (etichetă)</Label>
          <Input
            id="max_age"
            name="max_age"
            type="number"
            defaultValue={initial?.max_age ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-1.5 rounded-md border border-neutral-200 p-3">
        <p className="text-sm font-medium text-neutral-700">Ritm</p>
        <div className="space-y-1.5">
          <Label htmlFor="frequency">Frecvență</Label>
          <Select id="frequency" name="frequency" defaultValue={initial?.frequency ?? "weekly"}>
            <option value="weekly">Săptămânal</option>
            <option value="biweekly">La două săptămâni</option>
            <option value="monthly">Lunar</option>
            <option value="none">Fără program fix</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weekday">Ziua săptămânii</Label>
            <Select id="weekday" name="weekday" defaultValue={initial?.weekday ?? ""}>
              <option value="">—</option>
              {WEEKDAYS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_time">Ora de start</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={initial?.start_time ?? undefined}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="month_week">
            A câta săptămână din lună (doar pentru „Lunar”)
          </Label>
          <Select id="month_week" name="month_week" defaultValue={initial?.month_week ?? ""}>
            <option value="">—</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="duration_min">
              Durata (minute) — doar informativ
            </Label>
            <Input
              id="duration_min"
              name="duration_min"
              type="number"
              min="0"
              defaultValue={initial?.duration_min ?? undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sessions_per_month">Ședințe pe lună (informativ)</Label>
            <Input
              id="sessions_per_month"
              name="sessions_per_month"
              type="number"
              min="0"
              defaultValue={initial?.sessions_per_month ?? undefined}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 rounded-md border border-neutral-200 p-3">
        <p className="text-sm font-medium text-neutral-700">Prețuri</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price_per_session">Preț / ședință în abonament</Label>
            <Input
              id="price_per_session"
              name="price_per_session"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial?.price_per_session ?? "0"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drop_in_price">Preț la bucată (drop-in)</Label>
            <Input
              id="drop_in_price"
              name="drop_in_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial?.drop_in_price ?? "0"}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="color">Culoare (pentru calendar)</Label>
        <Input
          id="color"
          name="color"
          type="color"
          className="h-11 w-20 px-1"
          defaultValue={initial?.color ?? "#a3a3a3"}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sort_order">Ordine de afișare</Label>
        <Input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order ?? 0}
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
