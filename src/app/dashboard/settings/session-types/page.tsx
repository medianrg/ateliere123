import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { setSessionTypeActive } from "./actions";

type SessionType = {
  id: string;
  name: string;
  suggested_sessions_used: string | null;
  counts_in_stats: boolean;
  is_active: boolean;
};

export default async function SessionTypesPage() {
  const supabase = await createClient();
  const { data: types } = await supabase
    .from("session_types")
    .select("*")
    .order("name")
    .returns<SessionType[]>();

  const active = (types ?? []).filter((t) => t.is_active);
  const archived = (types ?? []).filter((t) => !t.is_active);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tipuri de atelier</h1>
        <Link href="/dashboard/settings/session-types/new">
          <Button>+ Tip nou</Button>
        </Link>
      </div>

      <p className="text-sm text-neutral-500">
        Doar etichete de filtrare — durata și costul în ședințe se stabilesc
        mereu individual, la fiecare sesiune.
      </p>

      <TypeList types={active} />

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Arhivate</h2>
          <TypeList types={archived} />
        </div>
      )}
    </div>
  );
}

function TypeList({ types }: { types: SessionType[] }) {
  if (types.length === 0) {
    return <p className="text-sm text-neutral-500">Niciun tip încă.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {types.map((type) => (
        <li key={type.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <Link href={`/dashboard/settings/session-types/${type.id}`} className="font-medium hover:underline">
              {type.name}
            </Link>
            <p className="text-sm text-neutral-500">
              {type.suggested_sessions_used != null
                ? `sugerează ${type.suggested_sessions_used} ședințe`
                : "fără sugestie de cost"}
              {" · "}
              {type.counts_in_stats ? "intră în statistici" : "exclus din statistici"}
            </p>
          </div>
          <form action={setSessionTypeActive.bind(null, type.id, !type.is_active)}>
            <Button type="submit" variant="outline" size="sm">
              {type.is_active ? "Arhivează" : "Reactivează"}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
