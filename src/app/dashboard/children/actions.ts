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
      payment_status: str(formData, "payment_status") ?? "standard",
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const workshopId = str(formData, "workshop_id");
  if (workshopId) {
    const { error: workshopError } = await supabase.from("child_workshops").insert({
      child_id: child.id,
      workshop_id: workshopId,
      is_primary: true,
      joined_at: new Date().toISOString().slice(0, 10),
    });
    if (workshopError) throw new Error(workshopError.message);
  }

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

// --- înscrieri la ateliere (child_workshops) --------------------------

export async function enrollInWorkshop(childId: string, formData: FormData) {
  const supabase = await createClient();
  const workshopId = str(formData, "workshop_id");
  if (!workshopId) return;

  const { error } = await supabase.from("child_workshops").upsert(
    {
      child_id: childId,
      workshop_id: workshopId,
      is_primary: false,
      joined_at: new Date().toISOString().slice(0, 10),
      left_at: null,
    },
    { onConflict: "child_id,workshop_id" },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}`);
}

export async function setPrimaryWorkshop(childId: string, workshopId: string) {
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from("child_workshops")
    .update({ is_primary: false })
    .eq("child_id", childId);
  if (clearError) throw new Error(clearError.message);

  const { error } = await supabase
    .from("child_workshops")
    .update({ is_primary: true })
    .eq("child_id", childId)
    .eq("workshop_id", workshopId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}`);
}

export async function leaveWorkshop(childId: string, workshopId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("child_workshops")
    .update({ left_at: new Date().toISOString().slice(0, 10) })
    .eq("child_id", childId)
    .eq("workshop_id", workshopId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/children/${childId}`);
}
