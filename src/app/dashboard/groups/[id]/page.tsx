import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupForm } from "../group-form";
import { updateGroup } from "../actions";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Editează grupa</h1>
      <GroupForm
        action={updateGroup.bind(null, id)}
        initial={group}
        submitLabel="Salvează"
      />
    </div>
  );
}
