import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type PhotoStatus = "full" | "masked" | "none";

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  child_workshops: { workshop_id: string; left_at: string | null }[];
  consents: { photo_status: PhotoStatus }[];
};

const GROUPS: { status: PhotoStatus; title: string; hint: string; classes: string }[] = [
  {
    status: "full",
    title: "🟢 Pot apărea în poze",
    hint: "acord complet — poza poate fi postată ca atare",
    classes: "border-green-200 bg-green-50",
  },
  {
    status: "masked",
    title: "🟡 Doar cu fața acoperită",
    hint: "acoperă fața cu emoji sau blur înainte de a posta",
    classes: "border-yellow-200 bg-yellow-50",
  },
  {
    status: "none",
    title: "🔴 Nu apar în poze",
    hint: "fără acord — nu posta nicio imagine cu ei",
    classes: "border-red-200 bg-red-50",
  },
];

export default async function PhotoConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ workshop?: string }>;
}) {
  const { workshop: workshopFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: workshops }, { data: childrenData }] = await Promise.all([
    supabase.from("workshops").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("children")
      .select(
        "id, first_name, last_name, child_workshops(workshop_id, left_at), consents(photo_status)",
      )
      .eq("is_active", true)
      .order("last_name")
      .returns<ChildRow[]>(),
  ]);

  let children = childrenData ?? [];
  if (workshopFilter) {
    children = children.filter((c) =>
      c.child_workshops.some((cw) => cw.workshop_id === workshopFilter && !cw.left_at),
    );
  }

  const selectedName = workshops?.find((w) => w.id === workshopFilter)?.name;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/dashboard/children" className="text-sm text-neutral-500 hover:underline">
        ← Copii
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Cine apare în poze</h1>
        <p className="text-sm text-neutral-500">
          Verifică lista înainte să postezi. Statutul se schimbă pe fișa
          fiecărui copil, la „Acord GDPR”.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <Select name="workshop" defaultValue={workshopFilter ?? ""} className="flex-1">
          <option value="">Toate atelierele</option>
          {(workshops ?? []).map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Arată
        </Button>
      </form>

      {children.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {selectedName
            ? `Niciun copil înscris la ${selectedName}.`
            : "Niciun copil activ."}
        </p>
      ) : (
        GROUPS.map((group) => {
          const inGroup = children.filter(
            (c) => (c.consents[0]?.photo_status ?? "none") === group.status,
          );
          return (
            <section key={group.status} className="space-y-2">
              <div>
                <h2 className="font-medium">
                  {group.title} · {inGroup.length}
                </h2>
                <p className="text-sm text-neutral-500">{group.hint}</p>
              </div>
              {inGroup.length === 0 ? (
                <p className="text-sm text-neutral-400">Niciunul.</p>
              ) : (
                <ul className={`divide-y rounded-lg border ${group.classes}`}>
                  {inGroup.map((c) => (
                    <li key={c.id} className="p-3">
                      <Link href={`/dashboard/children/${c.id}`} className="hover:underline">
                        {c.first_name} {c.last_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
