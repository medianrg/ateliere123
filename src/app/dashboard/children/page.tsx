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
  groups: { id: string; name: string } | null;
};

const PAYMENT_LABEL: Record<string, string> = {
  standard: "Standard",
  partial: "Parțial",
  exempt: "Scutit",
};

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; status?: string }>;
}) {
  const { group: groupFilter, status } = await searchParams;
  const showInactive = status === "inactive";

  const supabase = await createClient();

  const [{ data: groups }, childrenQuery] = await Promise.all([
    supabase.from("groups").select("id, name").eq("is_active", true).order("sort_order"),
    (async () => {
      let query = supabase
        .from("children")
        .select("id, first_name, last_name, birth_date, payment_status, is_active, groups(id, name)")
        .eq("is_active", !showInactive)
        .order("last_name");

      if (groupFilter) query = query.eq("group_id", groupFilter);

      return query.returns<ChildRow[]>();
    })(),
  ]);

  const children = childrenQuery.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Copii</h1>
        <Link href="/dashboard/children/new">
          <Button>+ Copil nou</Button>
        </Link>
      </div>

      <form method="get" className="flex gap-3">
        <Select name="group" defaultValue={groupFilter ?? ""} className="max-w-xs">
          <option value="">Toate grupele</option>
          {(groups ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
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
          {children.map((child) => (
            <li key={child.id} className="p-4">
              <Link
                href={`/dashboard/children/${child.id}`}
                className="font-medium hover:underline"
              >
                {child.first_name} {child.last_name}
              </Link>
              <p className="text-sm text-neutral-500">
                {child.groups?.name ?? "fără grupă"}
                {child.birth_date && ` · născut ${formatDate(child.birth_date)}`}
                {` · ${PAYMENT_LABEL[child.payment_status]}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
