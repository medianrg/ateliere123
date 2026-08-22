"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ConsentFormValues = {
  photo_status?: string;
  tag_parent_social?: boolean;
  gdpr_signed_at?: string | null;
  paper_reference?: string | null;
};

export function ConsentForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void;
  initial?: ConsentFormValues;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="photo_status">Statut foto</Label>
        <Select
          id="photo_status"
          name="photo_status"
          defaultValue={initial?.photo_status ?? "none"}
        >
          <option value="full">🟢 Poză completă permisă</option>
          <option value="masked">🟡 Poză cu fața acoperită</option>
          <option value="none">🔴 Fără poze</option>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="tag_parent_social"
          defaultChecked={initial?.tag_parent_social ?? false}
          className="h-5 w-5"
        />
        Poate fi etichetat părintele pe rețele sociale
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="gdpr_signed_at">Data semnării acordului GDPR</Label>
        <Input
          id="gdpr_signed_at"
          name="gdpr_signed_at"
          type="date"
          defaultValue={initial?.gdpr_signed_at ?? undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paper_reference">Unde e hârtia semnată</Label>
        <Input
          id="paper_reference"
          name="paper_reference"
          placeholder="ex. dosar 2026, fila 4"
          defaultValue={initial?.paper_reference ?? undefined}
        />
      </div>

      <Button type="submit" variant="outline">
        Salvează acordul GDPR
      </Button>
    </form>
  );
}
