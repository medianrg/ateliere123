import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionRow = {
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
  status: "active" | "expired" | "cancelled";
};

export type SubscriptionWithUsage = SubscriptionRow & {
  used: number;
  remaining: number;
};

export type TrafficLight = "green" | "yellow" | "red";

/** Diferența în zile între două date "YYYY-MM-DD" (b − a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / msPerDay,
  );
}

export function isCurrentlyValid(
  sub: Pick<SubscriptionRow, "status" | "end_date">,
  today: string,
): boolean {
  return sub.status === "active" && sub.end_date >= today;
}

/**
 * 🟢 abonament valid, N ședințe rămase
 * 🟡 mai are 1 ședință / expiră în ≤7 zile
 * 🔴 expirat sau 0 ședințe
 */
export function trafficLight(
  sub: SubscriptionWithUsage,
  today: string,
): TrafficLight {
  if (!isCurrentlyValid(sub, today) || sub.remaining <= 0) return "red";
  const daysLeft = daysBetween(today, sub.end_date);
  if (sub.remaining === 1 || daysLeft <= 7) return "yellow";
  return "green";
}

/** Dintre abonamentele valide ale unui copil la un atelier, cel mai urgent
 * (expiră cel mai curând) — cel din care se scade la bifarea prezenței. */
export function pickCurrentSubscription(
  subs: SubscriptionWithUsage[],
  workshopId: string,
  today: string,
): SubscriptionWithUsage | null {
  const valid = subs.filter(
    (s) =>
      s.workshop_id === workshopId &&
      isCurrentlyValid(s, today) &&
      s.remaining > 0,
  );
  if (valid.length === 0) return null;
  return valid.sort((a, b) => a.end_date.localeCompare(b.end_date))[0];
}

/** Abonamentele unui set de copii, cu ședințe folosite/rămase calculate
 * din attendance -- niciodată dintr-un contor stocat. */
export async function fetchSubscriptionsWithUsage(
  supabase: SupabaseClient,
  childIds: string[],
): Promise<Map<string, SubscriptionWithUsage[]>> {
  const byChild = new Map<string, SubscriptionWithUsage[]>();
  if (childIds.length === 0) return byChild;

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .in("child_id", childIds)
    .returns<SubscriptionRow[]>();

  const subscriptions = subs ?? [];
  const subIds = subscriptions.map((s) => s.id);

  const usedBySubscription = new Map<string, number>();
  if (subIds.length > 0) {
    const { data: attendanceRows } = await supabase
      .from("attendance")
      .select("subscription_id, sessions_used")
      .in("subscription_id", subIds);

    for (const row of attendanceRows ?? []) {
      if (!row.subscription_id) continue;
      usedBySubscription.set(
        row.subscription_id,
        (usedBySubscription.get(row.subscription_id) ?? 0) + Number(row.sessions_used),
      );
    }
  }

  for (const sub of subscriptions) {
    const used = usedBySubscription.get(sub.id) ?? 0;
    const withUsage: SubscriptionWithUsage = {
      ...sub,
      used,
      remaining: sub.total_sessions - used,
    };
    const list = byChild.get(sub.child_id) ?? [];
    list.push(withUsage);
    byChild.set(sub.child_id, list);
  }

  return byChild;
}

/** de_plată = SUM(subscriptions.price); achitat = SUM(payments.amount);
 * sold = achitat − de_plată. Niciodată un contor. */
export async function fetchChildBalances(
  supabase: SupabaseClient,
  childIds: string[],
): Promise<Map<string, { totalDatorat: number; totalAchitat: number; sold: number }>> {
  const result = new Map<
    string,
    { totalDatorat: number; totalAchitat: number; sold: number }
  >();
  if (childIds.length === 0) return result;

  const [{ data: subs }, { data: payments }] = await Promise.all([
    supabase.from("subscriptions").select("child_id, price").in("child_id", childIds),
    supabase.from("payments").select("child_id, amount").in("child_id", childIds),
  ]);

  const datoratByChild = new Map<string, number>();
  for (const row of subs ?? []) {
    datoratByChild.set(row.child_id, (datoratByChild.get(row.child_id) ?? 0) + Number(row.price));
  }

  const achitatByChild = new Map<string, number>();
  for (const row of payments ?? []) {
    achitatByChild.set(row.child_id, (achitatByChild.get(row.child_id) ?? 0) + Number(row.amount));
  }

  for (const childId of childIds) {
    const totalDatorat = datoratByChild.get(childId) ?? 0;
    const totalAchitat = achitatByChild.get(childId) ?? 0;
    result.set(childId, {
      totalDatorat,
      totalAchitat,
      sold: totalAchitat - totalDatorat,
    });
  }

  return result;
}
