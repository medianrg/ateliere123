import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { WorkshopForm } from "../workshop-form";
import { updateWorkshop, setWorkshopActive } from "../actions";

const WEEKDAY_LABEL: Record<number, string> = {
  1: "Luni",
  2: "Marți",
  3: "Miercuri",
  4: "Joi",
  5: "Vineri",
  6: "Sâmbătă",
  7: "Duminică",
};

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Săptămânal",
  biweekly: "La două săptămâni",
  monthly: "Lunar",
  none: "Fără program fix",
};

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: workshop }, { data: enrolled }] = await Promise.all([
    supabase.from("workshops").select("*").eq("id", id).single(),
    supabase
      .from("child_workshops")
      .select("is_primary, children(id, first_name, last_name, is_active)")
      .eq("workshop_id", id),
  ]);

  if (!workshop) notFound();

  const activeChildren = (enrolled ?? []).filter(
    (e) => (e.children as unknown as { is_active: boolean } | null)?.is_active,
  );

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{workshop.name}</h1>
        <form action={setWorkshopActive.bind(null, id, !workshop.is_active)}>
          <Button type="submit" variant="outline" size="sm">
            {workshop.is_active ? "Arhivează" : "Reactivează"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <div>
          <p className="text-neutral-500">Ritm</p>
          <p className="font-medium">
            {FREQUENCY_LABEL[workshop.frequency]}
            {workshop.weekday && ` · ${WEEKDAY_LABEL[workshop.weekday]}`}
            {workshop.start_time && ` ${workshop.start_time.slice(0, 5)}`}
          </p>
        </div>
        <div>
          <p className="text-neutral-500">Preț / ședință (abonament)</p>
          <p className="font-medium">{workshop.price_per_session} lei</p>
        </div>
        <div>
          <p className="text-neutral-500">Preț drop-in</p>
          <p className="font-medium">{workshop.drop_in_price} lei</p>
        </div>
        <div>
          <p className="text-neutral-500">Copii înscriși</p>
          <p className="font-medium">{activeChildren.length}</p>
        </div>
      </div>

      {activeChildren.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500">Copii înscriși</h2>
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {activeChildren.map((e) => {
              const child = e.children as unknown as {
                id: string;
                first_name: string;
                last_name: string;
              };
              return (
                <li key={child.id} className="p-3">
                  <Link href={`/dashboard/children/${child.id}`} className="hover:underline">
                    {child.first_name} {child.last_name}
                  </Link>
                  {e.is_primary && (
                    <span className="ml-2 text-xs text-neutral-400">principal</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-neutral-500">Editează atelierul</h2>
        <WorkshopForm
          action={updateWorkshop.bind(null, id)}
          initial={workshop}
          submitLabel="Salvează"
        />
      </section>
    </div>
  );
}
