"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createSessionType(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("session_types").insert({
    name: str(formData, "name"),
    suggested_credit_cost: str(formData, "suggested_credit_cost"),
    counts_in_stats: formData.get("counts_in_stats") === "on",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/session-types");
  redirect("/dashboard/session-types");
}

export async function updateSessionType(typeId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("session_types")
    .update({
      name: str(formData, "name"),
      suggested_credit_cost: str(formData, "suggested_credit_cost"),
      counts_in_stats: formData.get("counts_in_stats") === "on",
    })
    .eq("id", typeId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/session-types");
  redirect("/dashboard/session-types");
}

export async function setSessionTypeActive(typeId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("session_types")
    .update({ is_active: isActive })
    .eq("id", typeId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/session-types");
}
