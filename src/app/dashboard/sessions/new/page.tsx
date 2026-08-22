import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "../session-form";
import { createSession } from "../actions";

export default async function NewSessionPage() {
  const supabase = await createClient();
  const [{ data: groups }, { data: sessionTypes }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("session_types")
      .select("id, name, suggested_credit_cost")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Ședință nouă</h1>
      <SessionForm action={createSession} groups={groups ?? []} sessionTypes={sessionTypes ?? []} />
    </div>
  );
}
