import Link from "next/link";
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
  const supabase = await createClient();

  const [{ data: child }, { data: childOptions }, { data: workshops }] = await Promise.all([
    childId
      ? supabase.from("children").select("id, first_name, last_name").eq("id", childId).single()
      : Promise.resolve({ data: null }),
    childId
      ? Promise.resolve({ data: [] })
      : supabase
          .from("children")
          .select("id, first_name, last_name")
          .eq("is_active", true)
          .order("last_name"),
    supabase
      .from("workshops")
      .select("id, name, price_per_session")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (childId && !child) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href={childId ? `/dashboard/children/${childId}/financiar` : "/dashboard/subscriptions"}
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Înapoi
      </Link>

      <h1 className="text-xl font-semibold">
        {child ? `Abonament nou — ${child.first_name} ${child.last_name}` : "Abonament nou"}
      </h1>

      <SubscriptionForm
        action={createSubscription}
        childId={childId}
        childOptions={childOptions ?? []}
        workshops={workshops ?? []}
        submitLabel="Creează abonamentul"
      />
    </div>
  );
}
