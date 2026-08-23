import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { setWorkshopActive } from "./actions";

type Workshop = {
  id: string;
  name: string;
  min_age: number | null;
  max_age: number | null;
  color: string | null;
  frequency: "weekly" | "biweekly" | "monthly" | "none";
  weekday: number | null;
  start_time: string | null;
  price_per_session: string;
  is_active: boolean;
  sort_order: number;
};

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
  weekly: "săptămânal",
  biweekly: "la două săptămâni",
  monthly: "lunar",
  none: "fără program fix",
};

export default async function WorkshopsPage() {
  const supabase = await createClient();
  const { data: workshops } = await supabase
    .from("workshops")
    .select("*")
    .order("sort_order", { ascending: true })
    .returns<Workshop[]>();

  const active = (workshops ?? []).filter((w) => w.is_active);
  const archived = (workshops ?? []).filter((w) => !w.is_active);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ateliere</h1>
        <Link href="/dashboard/workshops/new">
          <Button>+ Atelier nou</Button>
        </Link>
      </div>

      <WorkshopList workshops={active} />

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Arhivate</h2>
          <WorkshopList workshops={archived} />
        </div>
      )}
    </div>
  );
}

function WorkshopList({ workshops }: { workshops: Workshop[] }) {
  if (workshops.length === 0) {
    return <p className="text-sm text-neutral-500">Niciun atelier încă.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {workshops.map((workshop) => (
        <li key={workshop.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {workshop.color && (
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: workshop.color }}
                />
              )}
              <Link href={`/dashboard/workshops/${workshop.id}`} className="font-medium hover:underline">
                {workshop.name}
              </Link>
            </div>
            <p className="text-sm text-neutral-500">
              {workshop.min_age != null || workshop.max_age != null
                ? `${workshop.min_age ?? "?"}–${workshop.max_age ?? "?"} ani · `
                : ""}
              {FREQUENCY_LABEL[workshop.frequency]}
              {workshop.weekday && `, ${WEEKDAY_LABEL[workshop.weekday]}`}
              {workshop.start_time && ` ${workshop.start_time.slice(0, 5)}`}
              {` · ${workshop.price_per_session} lei/ședință`}
            </p>
          </div>
          <form action={setWorkshopActive.bind(null, workshop.id, !workshop.is_active)}>
            <Button type="submit" variant="outline" size="sm">
              {workshop.is_active ? "Arhivează" : "Reactivează"}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
