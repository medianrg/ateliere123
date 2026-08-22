"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createChild(formData: FormData) {
  const supabase = await createClient();

  const { data: child, error } = await supabase
    .from("children")
    .insert({
      first_name: str(formData, "first_name"),
      last_name: str(formData, "last_name"),
      birth_date: str(formData, "birth_date"),
      group_id: str(formData, "group_id"),
      payment_status: str(formData, "payment_status") ?? "standard",
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Every child gets a consents row from day one, defaulting to the most
  // restrictive option — nobody's photo goes out until Rebecca says so.
  const { error: consentError } = await supabase.from("consents").insert({
    child_id: child.id,
    photo_status: "none",
  });
  if (consentError) throw new Error(consentError.message);

  revalidatePath("/dashboard/children");
  redirect(`/dashboard/children/${child.id}`);
}

export async function updateChild(childId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("children")
    .update({
      first_name: str(formData, "first_name"),
      last_name: str(formData, "last_name"),
      birth_date: str(formData, "birth_date"),
      group_id: str(formData, "group_id"),
      payment_status: str(formData, "payment_status") ?? "standard",
      notes: str(formData, "notes"),
    })
    .eq("id", childId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/children");
  revalidatePath(`/dashboard/children/${childId}`);
  redirect(`/dashboard/children/${childId}`);
}

export async function setChildActive(childId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("children")
    .update({ is_active: isActive })
    .eq("id", childId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/children");
  revalidatePath(`/dashboard/children/${childId}`);
}

export async function updateConsent(childId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("consents")
    .update({
      photo_status: str(formData, "photo_status") ?? "none",
      tag_parent_social: formData.get("tag_parent_social") === "on",
      gdpr_signed_at: str(formData, "gdpr_signed_at"),
      paper_reference: str(formData, "paper_reference"),
    })
    .eq("child_id", childId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}`);
}
