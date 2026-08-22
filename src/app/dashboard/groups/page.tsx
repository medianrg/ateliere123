import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { setGroupActive } from "./actions";

type Group = {
  id: string;
  name: string;
  min_age: number | null;
  max_age: number | null;
  color: string | null;
  default_day: string | null;
  default_time: string | null;
  is_active: boolean;
  sort_order: number;
};

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .returns<Group[]>();

  const active = (groups ?? []).filter((g) => g.is_active);
  const archived = (groups ?? []).filter((g) => !g.is_active);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Grupe</h1>
        <Link href="/dashboard/groups/new">
          <Button>+ Grupă nouă</Button>
        </Link>
      </div>

      <GroupList groups={active} />

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Arhivate</h2>
          <GroupList groups={archived} />
        </div>
      )}
    </div>
  );
}

function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-neutral-500">Nicio grupă încă.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {groups.map((group) => (
        <li key={group.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {group.color && (
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
              )}
              <Link href={`/dashboard/groups/${group.id}`} className="font-medium hover:underline">
                {group.name}
              </Link>
            </div>
            <p className="text-sm text-neutral-500">
              {group.min_age != null || group.max_age != null
                ? `${group.min_age ?? "?"}–${group.max_age ?? "?"} ani`
                : "fără interval de vârstă"}
              {group.default_day && ` · ${group.default_day}`}
              {group.default_time && ` ${group.default_time.slice(0, 5)}`}
            </p>
          </div>
          <form action={setGroupActive.bind(null, group.id, !group.is_active)}>
            <Button type="submit" variant="outline" size="sm">
              {group.is_active ? "Arhivează" : "Reactivează"}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
