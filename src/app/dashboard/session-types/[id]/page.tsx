import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionTypeForm } from "../session-type-form";
import { updateSessionType } from "../actions";

export default async function EditSessionTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: type } = await supabase
    .from("session_types")
    .select("*")
    .eq("id", id)
    .single();

  if (!type) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Editează tipul de atelier</h1>
      <SessionTypeForm
        action={updateSessionType.bind(null, id)}
        initial={type}
        submitLabel="Salvează"
      />
    </div>
  );
}
