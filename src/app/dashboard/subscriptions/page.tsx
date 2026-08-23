import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchChildBalances } from "@/lib/finance";

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  // Copiii cu payment_status = exempt nu apar aici niciodată — la nivel de
  // query, nu ca filtru din interfață. Vezi CLAUDE.md.
  const { data: children } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .neq("payment_status", "exempt");

  const childIds = (children ?? []).map((c) => c.id);
  const balances = await fetchChildBalances(supabase, childIds);

  const withDebt = (children ?? [])
    .map((c) => ({ ...c, balance: balances.get(c.id) }))
    .filter((c) => c.balance && c.balance.sold < 0)
    .sort((a, b) => (a.balance!.sold - b.balance!.sold));

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Abonamente</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">
          {withDebt.length === 0 ? "Cine are restanțe" : `${withDebt.length} restanțe`}
        </h2>

        {withDebt.length === 0 ? (
          <p className="text-sm text-neutral-500">Nimeni nu are restanțe momentan.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-red-200 bg-white">
            {withDebt.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/children/${c.id}/financiar`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-neutral-50"
                >
                  <span className="font-medium">
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="font-medium text-red-600">
                    {Math.abs(c.balance!.sold).toFixed(2)} lei
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
