import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addParticipant } from "../actions";

export default async function AddParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id: sessionId } = await params;
  const { q } = await searchParams;

  type ChildResult = {
    id: string;
    first_name: string;
    last_name: string;
    child_workshops: { left_at: string | null; workshops: { name: string } | null }[];
  };

  const supabase = await createClient();
  let query = supabase
    .from("children")
    .select("id, first_name, last_name, child_workshops(left_at, workshops(name))")
    .eq("is_active", true)
    .order("last_name")
    .limit(30);

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const { data: children } = await query.returns<ChildResult[]>();

  async function addAndReturn(childId: string) {
    "use server";
    await addParticipant(sessionId, childId);
    redirect(`/dashboard/sessions/${sessionId}/attendance`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link
        href={`/dashboard/sessions/${sessionId}/attendance`}
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Înapoi la prezență
      </Link>
      <h1 className="text-xl font-semibold">Adaugă copil</h1>

      <form method="get" className="flex gap-2">
        <Input name="q" placeholder="Caută după nume..." defaultValue={q} />
        <Button type="submit" variant="outline">
          Caută
        </Button>
      </form>

      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {(children ?? []).map((child) => (
          <li key={child.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">
                {child.first_name} {child.last_name}
              </p>
              <p className="text-sm text-neutral-500">
                {child.child_workshops
                  .filter((cw) => !cw.left_at)
                  .map((cw) => cw.workshops?.name)
                  .filter(Boolean)
                  .join(", ") || "fără atelier"}
              </p>
            </div>
            <form action={addAndReturn.bind(null, child.id)}>
              <Button type="submit" size="sm">
                Adaugă
              </Button>
            </form>
          </li>
        ))}
        {(!children || children.length === 0) && (
          <li className="p-4 text-sm text-neutral-500">Niciun copil găsit.</li>
        )}
      </ul>
    </div>
  );
}
