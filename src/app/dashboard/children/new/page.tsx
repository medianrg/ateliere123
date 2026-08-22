import { createClient } from "@/lib/supabase/server";
import { ChildForm } from "../child-form";
import { createChild } from "../actions";

export default async function NewChildPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Copil nou</h1>
      <ChildForm action={createChild} groups={groups ?? []} submitLabel="Adaugă" />
    </div>
  );
}
