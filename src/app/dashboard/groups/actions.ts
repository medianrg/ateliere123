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

export async function createGroup(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("groups").insert({
    name: str(formData, "name"),
    min_age: int(formData, "min_age"),
    max_age: int(formData, "max_age"),
    color: str(formData, "color"),
    default_day: str(formData, "default_day"),
    default_time: str(formData, "default_time"),
    sort_order: int(formData, "sort_order") ?? 0,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/groups");
  redirect("/dashboard/groups");
}

export async function updateGroup(groupId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("groups")
    .update({
      name: str(formData, "name"),
      min_age: int(formData, "min_age"),
      max_age: int(formData, "max_age"),
      color: str(formData, "color"),
      default_day: str(formData, "default_day"),
      default_time: str(formData, "default_time"),
      sort_order: int(formData, "sort_order") ?? 0,
    })
    .eq("id", groupId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/groups");
  redirect("/dashboard/groups");
}

export async function setGroupActive(groupId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("groups")
    .update({ is_active: isActive })
    .eq("id", groupId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/groups");
}
