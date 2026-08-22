"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ChildFormValues = {
  first_name?: string;
  last_name?: string;
  birth_date?: string | null;
  group_id?: string | null;
  payment_status?: string;
  notes?: string | null;
};

export function ChildForm({
  action,
  initial,
  groups,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: ChildFormValues;
  groups: { id: string; name: string }[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">Prenume</Label>
          <Input id="first_name" name="first_name" required defaultValue={initial?.first_name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Nume</Label>
          <Input id="last_name" name="last_name" required defaultValue={initial?.last_name} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birth_date">Data nașterii</Label>
        <Input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={initial?.birth_date ?? undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="group_id">Grupă</Label>
        <Select id="group_id" name="group_id" defaultValue={initial?.group_id ?? ""}>
          <option value="">fără grupă</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payment_status">Statut plată</Label>
        <Select
          id="payment_status"
          name="payment_status"
          defaultValue={initial?.payment_status ?? "standard"}
        >
          <option value="standard">Standard</option>
          <option value="partial">Parțial</option>
          <option value="exempt">Scutit</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notițe interne</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? undefined}
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
