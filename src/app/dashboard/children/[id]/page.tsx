import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ChildForm } from "../child-form";
import { ConsentForm } from "../consent-form";
import {
  updateChild,
  setChildActive,
  updateConsent,
  enrollInWorkshop,
  setPrimaryWorkshop,
  leaveWorkshop,
} from "../actions";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: child }, { data: consent }, { data: enrollments }, { data: allWorkshops }] =
    await Promise.all([
      supabase.from("children").select("*").eq("id", id).single(),
      supabase.from("consents").select("*").eq("child_id", id).maybeSingle(),
      supabase
        .from("child_workshops")
        .select("workshop_id, is_primary, joined_at, left_at, workshops(id, name)")
        .eq("child_id", id),
      supabase.from("workshops").select("id, name").eq("is_active", true).order("sort_order"),
    ]);

  if (!child) notFound();

  const current = (enrollments ?? []).filter((e) => !e.left_at);
  const enrolledWorkshopIds = new Set(current.map((e) => e.workshop_id));
  const availableToJoin = (allWorkshops ?? []).filter((w) => !enrolledWorkshopIds.has(w.id));

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {child.first_name} {child.last_name}
        </h1>
        <form action={setChildActive.bind(null, id, !child.is_active)}>
          <Button type="submit" variant="outline" size="sm">
            {child.is_active ? "Dezactivează" : "Reactivează"}
          </Button>
        </form>
      </div>

      <Link
        href={`/dashboard/children/${id}/financiar`}
        className="block rounded-lg border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
      >
        <p className="font-medium">Fișa financiară →</p>
        <p className="text-sm text-neutral-500">Abonamente, plăți, sold, istoric prezențe</p>
      </Link>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500">Ateliere</h2>

        {current.length === 0 ? (
          <p className="text-sm text-neutral-500">Neînscris la niciun atelier.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {current.map((e) => {
              const workshop = e.workshops as unknown as { id: string; name: string };
              return (
                <li key={e.workshop_id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <Link
                      href={`/dashboard/workshops/${workshop.id}`}
                      className="font-medium hover:underline"
                    >
                      {workshop.name}
                    </Link>
                    {e.is_primary && (
                      <span className="ml-2 text-xs text-neutral-400">principal</span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!e.is_primary && (
                      <form action={setPrimaryWorkshop.bind(null, id, e.workshop_id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Fă principal
                        </Button>
                      </form>
                    )}
                    <form action={leaveWorkshop.bind(null, id, e.workshop_id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Părăsește
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {availableToJoin.length > 0 && (
          <form action={enrollInWorkshop.bind(null, id)} className="flex gap-2">
            <Select name="workshop_id" defaultValue="" className="flex-1">
              <option value="" disabled>
                alege un atelier
              </option>
              {availableToJoin.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="outline">
              + Înscrie la alt atelier
            </Button>
          </form>
        )}
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-neutral-500">Date copil</h2>
        <ChildForm action={updateChild.bind(null, id)} initial={child} submitLabel="Salvează" />
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-neutral-500">Acord GDPR</h2>
        <ConsentForm action={updateConsent.bind(null, id)} initial={consent ?? undefined} />
      </section>
    </div>
  );
}
