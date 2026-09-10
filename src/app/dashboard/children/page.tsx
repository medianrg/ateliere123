import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  payment_status: "standard" | "partial" | "exempt";
  child_workshops: {
    left_at: string | null;
    workshops: { name: string } | null;
  }[];
  consents: { photo_status: "full" | "masked" | "none" }[];
};

const PHOTO_DOT: Record<string, string> = {
  full: "bg-green-500",
  masked: "bg-yellow-400",
  none: "bg-red-500",
};

const PHOTO_LABEL: Record<string, string> = {
  full: "poză completă permisă",
  masked: "poză cu fața acoperită",
  none: "fără poze",
};

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const showInactive = status === "inactive";

  const supabase = await createClient();

  let query = supabase
    .from("children")
    .select(
      "id, first_name, last_name, payment_status, child_workshops(left_at, workshops(name)), consents(photo_status)",
    )
    .eq("is_active", !showInactive)
    .order("last_name");

  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
  }

  const { data: children } = await query.returns<ChildRow[]>();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Copii</h1>
        <div className="flex shrink-0 gap-2">
          <Link href="/dashboard/children/import">
            <Button variant="outline">Importă</Button>
          </Link>
          <Link href="/dashboard/children/new">
            <Button>+ Copil nou</Button>
          </Link>
        </div>
      </div>

      <form method="get" className="flex gap-2">
        <Input name="q" placeholder="Caută după nume..." defaultValue={q} className="flex-1" />
        {showInactive && <input type="hidden" name="status" value="inactive" />}
        <Button type="submit" variant="outline">
          Caută
        </Button>
      </form>

      {(children ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center">
          <p className="text-sm text-neutral-500">
            {q
              ? `Niciun copil pe numele „${q}”.`
              : showInactive
                ? "Niciun copil plecat."
                : "Niciun copil înscris încă."}
          </p>
          {!q && !showInactive && (
            <Link href="/dashboard/children/import" className="mt-3 inline-block">
              <Button>Importă lista de copii</Button>
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {children!.map((child) => {
            const workshopNames = child.child_workshops
              .filter((cw) => !cw.left_at)
              .map((cw) => cw.workshops?.name)
              .filter(Boolean)
              .join(", ");
            const photo = child.consents[0]?.photo_status ?? "none";
            return (
              <li key={child.id} className="p-4">
                <Link href={`/dashboard/children/${child.id}`} className="block">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn("h-3 w-3 shrink-0 rounded-full", PHOTO_DOT[photo])}
                      title={PHOTO_LABEL[photo]}
                    />
                    <span className="font-medium hover:underline">
                      {child.first_name} {child.last_name}
                    </span>
                  </span>
                  <span className="mt-0.5 block pl-5 text-sm text-neutral-500">
                    {workshopNames || "fără atelier"}
                    {child.payment_status === "exempt" && " · Scutit"}
                    {child.payment_status === "partial" && " · Parțial"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-4 text-sm">
        <Link href="/dashboard/children/poze" className="text-neutral-600 underline">
          Cine apare în poze
        </Link>
        <Link
          href={showInactive ? "/dashboard/children" : "/dashboard/children?status=inactive"}
          className="text-neutral-500 underline"
        >
          {showInactive ? "Înapoi la copiii activi" : "Vezi copiii plecați"}
        </Link>
      </div>
    </div>
  );
}
