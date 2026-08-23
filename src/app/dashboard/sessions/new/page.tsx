import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "../session-form";
import { createSession } from "../actions";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ workshop?: string }>;
}) {
  const { workshop } = await searchParams;
  const supabase = await createClient();
  const [{ data: workshops }, { data: sessionTypes }] = await Promise.all([
    supabase.from("workshops").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("session_types")
      .select("id, name, suggested_sessions_used")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Ședință nouă</h1>
      <SessionForm
        action={createSession}
        workshops={workshops ?? []}
        sessionTypes={sessionTypes ?? []}
        defaultWorkshopId={workshop}
      />
    </div>
  );
}
