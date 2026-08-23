"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayInBucharest } from "@/lib/date";

export function PaymentForm({
  action,
  childId,
  subscriptions,
  defaultAmount,
  defaultSubscriptionId,
  defaultNote,
}: {
  action: (formData: FormData) => void;
  childId: string;
  subscriptions: { id: string; name: string }[];
  defaultAmount?: string;
  defaultSubscriptionId?: string;
  defaultNote?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="child_id" value={childId} />

      <div className="space-y-1.5">
        <Label htmlFor="subscription_id">Pentru ce abonament (opțional)</Label>
        <Select id="subscription_id" name="subscription_id" defaultValue={defaultSubscriptionId ?? ""}>
          <option value="">plată drop-in / fără abonament anume</option>
          {subscriptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Sumă (lei)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={defaultAmount ?? undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paid_at">Data</Label>
        <Input id="paid_at" name="paid_at" type="date" required defaultValue={todayInBucharest()} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="method">Metodă</Label>
        <Select id="method" name="method" defaultValue="cash">
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="card">Card</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Notă</Label>
        <Textarea id="note" name="note" rows={2} defaultValue={defaultNote ?? undefined} />
      </div>

      <Button type="submit" className="w-full">
        + Adaugă plată
      </Button>
    </form>
  );
}
