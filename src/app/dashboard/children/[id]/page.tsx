import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ChildForm } from "../child-form";
import { ConsentForm } from "../consent-form";
import { updateChild, setChildActive, updateConsent } from "../actions";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: child }, { data: groups }, { data: consent }] = await Promise.all([
    supabase.from("children").select("*").eq("id", id).single(),
    supabase.from("groups").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("consents").select("*").eq("child_id", id).maybeSingle(),
  ]);

  if (!child) notFound();

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

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-500">Date copil</h2>
        <ChildForm
          action={updateChild.bind(null, id)}
          initial={child}
          groups={groups ?? []}
          submitLabel="Salvează"
        />
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <h2 className="text-sm font-medium text-neutral-500">Acord GDPR</h2>
        <ConsentForm action={updateConsent.bind(null, id)} initial={consent ?? undefined} />
      </section>
    </div>
  );
}
