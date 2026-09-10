"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInBucharest } from "@/lib/date";

type NewChild = { firstName: string; lastName: string };

export async function importChildren(children: NewChild[], workshopId: string | null) {
  const clean = children
    .map((c) => ({
      first_name: c.firstName?.trim(),
      last_name: c.lastName?.trim() ?? "",
    }))
    .filter((c) => c.first_name);

  if (clean.length === 0) redirect("/dashboard/children");

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("children")
    .insert(clean.map((c) => ({ ...c, payment_status: "standard" })))
    .select("id");

  if (error) throw new Error(error.message);

  const ids = (inserted ?? []).map((c) => c.id as string);

  // Fiecare copil primește un rând de acord din prima clipă, pe varianta cea
  // mai restrictivă -- nicio poză nu pleacă până nu spune Rebecca altfel.
  const { error: consentError } = await supabase
    .from("consents")
    .insert(ids.map((id) => ({ child_id: id, photo_status: "none" })));
  if (consentError) throw new Error(consentError.message);

  if (workshopId) {
    const { error: enrollError } = await supabase.from("child_workshops").insert(
      ids.map((id) => ({
        child_id: id,
        workshop_id: workshopId,
        is_primary: true,
        joined_at: todayInBucharest(),
      })),
    );
    if (enrollError) throw new Error(enrollError.message);
  }

  revalidatePath("/dashboard/children");
  redirect("/dashboard/children");
}
