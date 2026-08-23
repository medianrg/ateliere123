"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function int(formData: FormData, key: string): number | null {
  const value = str(formData, key);
  return value === null ? null : Number.parseInt(value, 10);
}

function workshopFields(formData: FormData) {
  return {
    name: str(formData, "name"),
    min_age: int(formData, "min_age"),
    max_age: int(formData, "max_age"),
    price_per_session: str(formData, "price_per_session") ?? "0",
    drop_in_price: str(formData, "drop_in_price") ?? "0",
    color: str(formData, "color"),
    frequency: str(formData, "frequency") ?? "weekly",
    weekday: int(formData, "weekday"),
    start_time: str(formData, "start_time"),
    duration_min: int(formData, "duration_min"),
    month_week: int(formData, "month_week"),
    sessions_per_month: int(formData, "sessions_per_month"),
    sort_order: int(formData, "sort_order") ?? 0,
  };
}

export async function createWorkshop(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("workshops").insert(workshopFields(formData));

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/workshops");
  redirect("/dashboard/workshops");
}

export async function updateWorkshop(workshopId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workshops")
    .update(workshopFields(formData))
    .eq("id", workshopId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/workshops");
  redirect("/dashboard/workshops");
}

export async function setWorkshopActive(workshopId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workshops")
    .update({ is_active: isActive })
    .eq("id", workshopId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/workshops");
}
