"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GroupFormValues = {
  name?: string;
  min_age?: number | null;
  max_age?: number | null;
  color?: string | null;
  default_day?: string | null;
  default_time?: string | null;
  sort_order?: number;
};

export function GroupForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: GroupFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nume grupă</Label>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="default_day">Zi implicită</Label>
          <Input
            id="default_day"
            name="default_day"
            placeholder="ex. Marți"
            defaultValue={initial?.default_day ?? undefined}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="default_time">Oră implicită</Label>
          <Input
            id="default_time"
            name="default_time"
            type="time"
            defaultValue={initial?.default_time ?? undefined}
          />
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
