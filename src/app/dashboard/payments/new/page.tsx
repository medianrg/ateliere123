import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaymentForm } from "../payment-form";
import { createPayment } from "../actions";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; subscription?: string; amount?: string; note?: string }>;
}) {
  const { child: childId, subscription, amount, note } = await searchParams;
  if (!childId) notFound();

  const supabase = await createClient();
  const [{ data: child }, { data: subscriptions }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").eq("id", childId).single(),
    supabase
      .from("subscriptions")
      .select("id, name")
      .eq("child_id", childId)
      .order("start_date", { ascending: false }),
  ]);

  if (!child) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">
        Plată nouă — {child.first_name} {child.last_name}
      </h1>
      <PaymentForm
        action={createPayment}
        childId={childId}
        subscriptions={subscriptions ?? []}
        defaultSubscriptionId={subscription}
        defaultAmount={amount}
        defaultNote={note}
      />
    </div>
  );
}
