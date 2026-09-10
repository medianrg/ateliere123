import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ImportForm } from "./import-form";

export default async function ImportChildrenPage() {
  const supabase = await createClient();

  const [{ data: workshops }, { data: existing }] = await Promise.all([
    supabase.from("workshops").select("id, name").eq("is_active", true).order("name"),
    supabase.from("children").select("first_name, last_name").eq("is_active", true),
  ]);

  const existingNames = (existing ?? []).map((c) =>
    `${c.first_name} ${c.last_name}`.toLocaleLowerCase("ro"),
  );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/dashboard/children" className="text-sm text-neutral-500 hover:underline">
        ← Copii
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Importă copii</h1>
        <p className="text-sm text-neutral-500">
          Scrie sau lipește câte un copil pe rând, prenumele întâi. Vezi mai jos
          ce se va crea înainte să confirmi. Poți completa data nașterii și
          restul mai târziu, pe fișa fiecăruia.
        </p>
      </div>

      <ImportForm workshops={workshops ?? []} existingNames={existingNames} />
    </div>
  );
}
