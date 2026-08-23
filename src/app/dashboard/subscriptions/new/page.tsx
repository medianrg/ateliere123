import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "../subscription-form";
import { createSubscription } from "../actions";

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const { child: childId } = await searchParams;
  if (!childId) notFound();

  const supabase = await createClient();
  const [{ data: child }, { data: workshops }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").eq("id", childId).single(),
    supabase
      .from("workshops")
      .select("id, name, price_per_session")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (!child) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">
        Abonament nou — {child.first_name} {child.last_name}
      </h1>
      <SubscriptionForm action={createSubscription} childId={childId} workshops={workshops ?? []} />
    </div>
  );
}
