"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createPayment(formData: FormData) {
  const supabase = await createClient();
  const childId = str(formData, "child_id");
  if (!childId) throw new Error("Alege un copil.");

  const { data: userRes } = await supabase.auth.getUser();

  const { error } = await supabase.from("payments").insert({
    child_id: childId,
    subscription_id: str(formData, "subscription_id"),
    amount: str(formData, "amount"),
    paid_at: str(formData, "paid_at"),
    method: str(formData, "method"),
    note: str(formData, "note"),
    recorded_by: userRes.user?.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}/financiar`);
  redirect(`/dashboard/children/${childId}/financiar`);
}
