"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SessionTypeFormValues = {
  name?: string;
  suggested_credit_cost?: string | null;
  counts_in_stats?: boolean;
};

export function SessionTypeForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: SessionTypeFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nume</Label>
        <Input id="name" name="name" required defaultValue={initial?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="suggested_credit_cost">
          Cost sugerat (ședințe) — doar pre-completează formularul sesiunii
        </Label>
        <Input
          id="suggested_credit_cost"
          name="suggested_credit_cost"
          type="number"
          step="0.5"
          min="0"
          defaultValue={initial?.suggested_credit_cost ?? undefined}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="counts_in_stats"
          defaultChecked={initial?.counts_in_stats ?? true}
          className="h-5 w-5"
        />
        Intră în rata de prezență (statistici)
      </label>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
