import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "../subscription-form";
import { updateSubscription } from "../actions";

type SubscriptionResult = {
  id: string;
  child_id: string;
  workshop_id: string | null;
  name: string;
  total_sessions: number;
  price_per_session: string;
  price: string;
  price_note: string | null;
  start_date: string;
  end_date: string;
  children: { first_name: string; last_name: string } | null;
};

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: subscription }, { data: workshops }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, child_id, workshop_id, name, total_sessions, price_per_session, price, price_note, start_date, end_date, children(first_name, last_name)",
      )
      .eq("id", id)
      .returns<SubscriptionResult[]>()
      .single(),
    supabase
      .from("workshops")
      .select("id, name, price_per_session")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!subscription) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href={`/dashboard/children/${subscription.child_id}/financiar`}
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Fișa financiară
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Editează abonamentul</h1>
        <p className="text-sm text-neutral-500">
          {subscription.children?.first_name} {subscription.children?.last_name}
          {" · "}
          Ședințele consumate rămân legate de el — se recalculează singure.
        </p>
      </div>

      <SubscriptionForm
        action={updateSubscription.bind(null, id, subscription.child_id)}
        childId={subscription.child_id}
        workshops={workshops ?? []}
        initial={subscription}
        submitLabel="Salvează"
      />
    </div>
  );
}
