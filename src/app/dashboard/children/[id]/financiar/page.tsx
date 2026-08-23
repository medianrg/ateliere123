import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, todayInBucharest } from "@/lib/date";
import {
  fetchSubscriptionsWithUsage,
  fetchChildBalances,
  isCurrentlyValid,
  type SubscriptionWithUsage,
} from "@/lib/finance";
import { setSubscriptionStatus } from "../../../subscriptions/actions";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  transfer: "Transfer",
  card: "Card",
};

export default async function ChildFinancialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: childId } = await params;
  const supabase = await createClient();
  const today = todayInBucharest();

  const { data: child } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("id", childId)
    .single();

  if (!child) notFound();

  const [subsByChild, balancesByChild, paymentsRes, attendanceRes] = await Promise.all([
    fetchSubscriptionsWithUsage(supabase, [childId]),
    fetchChildBalances(supabase, [childId]),
    supabase
      .from("payments")
      .select("id, amount, paid_at, method, note, users(full_name)")
      .eq("child_id", childId)
      .order("paid_at", { ascending: false }),
    supabase
      .from("attendance")
      .select("id, status, sessions_used, sessions(date, workshops(name), title)")
      .eq("child_id", childId)
      .order("marked_at", { ascending: false })
      .limit(50),
  ]);

  const subscriptions = subsByChild.get(childId) ?? [];
  const balance = balancesByChild.get(childId) ?? { totalDatorat: 0, totalAchitat: 0, sold: 0 };

  const currentSubs = subscriptions
    .filter((s) => isCurrentlyValid(s, today) && s.remaining > 0)
    .sort((a, b) => a.end_date.localeCompare(b.end_date));
  const mostUrgent = currentSubs[0] as SubscriptionWithUsage | undefined;

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <Link href={`/dashboard/children/${childId}`} className="text-sm text-neutral-500 hover:underline">
          ← {child.first_name} {child.last_name}
        </Link>
        <h1 className="text-xl font-semibold">Fișa financiară</h1>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">Ședințe rămase</p>
          {mostUrgent ? (
            <p className="font-medium">
              {mostUrgent.remaining} ședințe · expiră {formatDate(mostUrgent.end_date)}
              {currentSubs.length > 1 && ` · +${currentSubs.length - 1} alte abonamente valide`}
            </p>
          ) : (
            <p className="font-medium text-neutral-400">Niciun abonament valid</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-500">De plată / achitat</p>
            <p className="font-medium">
              {balance.totalDatorat.toFixed(2)} / {balance.totalAchitat.toFixed(2)} lei
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border p-4",
              balance.sold < 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50",
            )}
          >
            <p className="text-sm text-neutral-500">Sold</p>
            <p className={cn("font-medium", balance.sold < 0 ? "text-red-700" : "text-green-700")}>
              {balance.sold >= 0 ? "la zi" : `restanță ${Math.abs(balance.sold).toFixed(2)} lei`}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Abonamente</h2>
          <Link href={`/dashboard/subscriptions/new?child=${childId}`} className="text-sm underline">
            + Abonament nou
          </Link>
        </div>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-neutral-500">Niciun abonament încă.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {subscriptions
              .sort((a, b) => b.start_date.localeCompare(a.start_date))
              .map((sub) => {
                const valid = isCurrentlyValid(sub, today);
                return (
                  <li
                    key={sub.id}
                    className={cn("space-y-1 p-3", !valid && "opacity-50")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{sub.name}</p>
                      {sub.status === "active" && (
                        <form action={setSubscriptionStatus.bind(null, childId, sub.id, "cancelled")}>
                          <Button type="submit" variant="ghost" size="sm">
                            Anulează
                          </Button>
                        </form>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">
                      {formatDate(sub.start_date)} – {formatDate(sub.end_date)} · {sub.total_sessions}{" "}
                      ședințe · {sub.price} lei · {sub.used} consumate · {sub.remaining} rămase
                    </p>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">Plăți</h2>
        </div>
        <Link href={`/dashboard/payments/new?child=${childId}`}>
          <Button className="w-full">+ Adaugă plată</Button>
        </Link>
        {(paymentsRes.data ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Nicio plată înregistrată încă.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {(paymentsRes.data ?? []).map((p) => {
              const recordedBy = p.users as unknown as { full_name: string } | null;
              return (
                <li key={p.id} className="p-3">
                  <p className="font-medium">{Number(p.amount).toFixed(2)} lei</p>
                  <p className="text-sm text-neutral-500">
                    {formatDate(p.paid_at)}
                    {p.method && ` · ${PAYMENT_METHOD_LABEL[p.method] ?? p.method}`}
                    {recordedBy && ` · înregistrat de ${recordedBy.full_name}`}
                    {p.note && ` · ${p.note}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Istoric prezențe</h2>
        {(attendanceRes.data ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Nicio prezență înregistrată încă.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {(attendanceRes.data ?? []).map((a) => {
              const session = a.sessions as unknown as {
                date: string;
                title: string | null;
                workshops: { name: string } | null;
              } | null;
              return (
                <li key={a.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                  <span>
                    {session && formatDate(session.date)} ·{" "}
                    {session?.workshops?.name ?? session?.title ?? "—"}
                  </span>
                  <span className="text-neutral-500">
                    {a.status === "present" ? "prezent" : a.status === "absent" ? "absent" : "întârziat"}
                    {" · "}
                    {a.sessions_used} ședințe
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
