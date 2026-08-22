"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayInBucharest } from "@/lib/date";

type Group = { id: string; name: string };
type SessionType = { id: string; name: string; suggested_credit_cost: string | null };

export function SessionForm({
  action,
  groups,
  sessionTypes,
}: {
  action: (formData: FormData) => void;
  groups: Group[];
  sessionTypes: SessionType[];
}) {
  const creditCostRef = useRef<HTMLInputElement>(null);

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const type = sessionTypes.find((t) => t.id === e.target.value);
    if (type?.suggested_credit_cost != null && creditCostRef.current) {
      creditCostRef.current.value = type.suggested_credit_cost;
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="group_id">Grupă</Label>
        <Select id="group_id" name="group_id" defaultValue="">
          <option value="">fără grupă — atelier special (participanți manuali)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Titlu (opțional, util mai ales pentru ateliere speciale)</Label>
        <Input id="title" name="title" placeholder="ex. Atelier de vacanță — Crăciun" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="session_type_id">Tip atelier</Label>
        <Select id="session_type_id" name="session_type_id" required onChange={handleTypeChange}>
          <option value="">alege tipul</option>
          {sessionTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" required defaultValue={todayInBucharest()} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_time">Ora început</Label>
          <Input id="start_time" name="start_time" type="time" required defaultValue="17:00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_time">Ora sfârșit</Label>
          <Input id="end_time" name="end_time" type="time" required defaultValue="19:00" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="credit_cost">Câte ședințe consumă</Label>
        <Input
          ref={creditCostRef}
          id="credit_cost"
          name="credit_cost"
          type="number"
          step="0.5"
          min="0"
          defaultValue="1"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic">Temă</Label>
        <Input id="topic" name="topic" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacity">Capacitate (opțional)</Label>
        <Input id="capacity" name="capacity" type="number" min="0" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notițe</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <Button type="submit">Creează ședința</Button>
    </form>
  );
}
