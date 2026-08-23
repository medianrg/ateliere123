import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/date";

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  payment_status: "standard" | "partial" | "exempt";
  is_active: boolean;
  child_workshops: {
    workshop_id: string;
    left_at: string | null;
    workshops: { name: string } | null;
  }[];
};

const PAYMENT_LABEL: Record<string, string> = {
  standard: "Standard",
  partial: "Parțial",
  exempt: "Scutit",
};

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ workshop?: string; status?: string }>;
}) {
  const { workshop: workshopFilter, status } = await searchParams;
  const showInactive = status === "inactive";

  const supabase = await createClient();

  const [{ data: workshops }, { data: childrenData }] = await Promise.all([
    supabase.from("workshops").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("children")
      .select(
        "id, first_name, last_name, birth_date, payment_status, is_active, child_workshops(workshop_id, left_at, workshops(name))",
      )
      .eq("is_active", !showInactive)
      .order("last_name")
      .returns<ChildRow[]>(),
  ]);

  let children = childrenData ?? [];
  if (workshopFilter) {
    children = children.filter((c) =>
      c.child_workshops.some((cw) => cw.workshop_id === workshopFilter && !cw.left_at),
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Copii</h1>
        <Link href="/dashboard/children/new">
          <Button>+ Copil nou</Button>
        </Link>
      </div>

      <form method="get" className="flex gap-3">
        <Select name="workshop" defaultValue={workshopFilter ?? ""} className="max-w-xs">
          <option value="">Toate atelierele</option>
          {(workshops ?? []).map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status ?? "active"} className="max-w-xs">
          <option value="active">Activi</option>
          <option value="inactive">Plecați</option>
        </Select>
        <Button type="submit" variant="outline">
          Filtrează
        </Button>
      </form>

      {children.length === 0 ? (
        <p className="text-sm text-neutral-500">Niciun copil găsit.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {children.map((child) => {
            const workshopNames = child.child_workshops
              .filter((cw) => !cw.left_at)
              .map((cw) => cw.workshops?.name)
              .filter(Boolean)
              .join(", ");
            return (
              <li key={child.id} className="p-4">
                <Link
                  href={`/dashboard/children/${child.id}`}
                  className="font-medium hover:underline"
                >
                  {child.first_name} {child.last_name}
                </Link>
                <p className="text-sm text-neutral-500">
                  {workshopNames || "fără atelier"}
                  {child.birth_date && ` · născut ${formatDate(child.birth_date)}`}
                  {` · ${PAYMENT_LABEL[child.payment_status]}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
