"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createSubscription(formData: FormData) {
  const supabase = await createClient();
  const childId = str(formData, "child_id");
  if (!childId) throw new Error("Alege un copil.");

  const { data: userRes } = await supabase.auth.getUser();

  const { error } = await supabase.from("subscriptions").insert({
    child_id: childId,
    workshop_id: str(formData, "workshop_id"),
    name: str(formData, "name"),
    total_sessions: str(formData, "total_sessions"),
    price_per_session: str(formData, "price_per_session") ?? "0",
    price: str(formData, "price") ?? "0",
    price_note: str(formData, "price_note"),
    start_date: str(formData, "start_date"),
    end_date: str(formData, "end_date"),
    created_by: userRes.user?.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}/financiar`);
  redirect(`/dashboard/children/${childId}/financiar`);
}

export async function updateSubscription(
  subscriptionId: string,
  childId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      workshop_id: str(formData, "workshop_id"),
      name: str(formData, "name"),
      total_sessions: str(formData, "total_sessions"),
      price_per_session: str(formData, "price_per_session") ?? "0",
      price: str(formData, "price") ?? "0",
      price_note: str(formData, "price_note"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
    })
    .eq("id", subscriptionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}/financiar`);
  redirect(`/dashboard/children/${childId}/financiar`);
}

export async function setSubscriptionStatus(
  childId: string,
  subscriptionId: string,
  status: "active" | "expired" | "cancelled",
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status })
    .eq("id", subscriptionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}/financiar`);
}
