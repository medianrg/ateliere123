import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatTime } from "@/lib/date";
import { moveSession } from "../../actions";

export default async function MoveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  type SessionResult = {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    title: string | null;
    workshops: { name: string } | null;
  };

  const { data: session } = await supabase
    .from("sessions")
    .select("id, date, start_time, end_time, title, workshops(name)")
    .eq("id", sessionId)
    .returns<SessionResult[]>()
    .single();

  if (!session) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href={`/dashboard/sessions/${sessionId}/attendance`}
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Înapoi la ședință
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Mută ședința</h1>
        <p className="text-sm text-neutral-500">
          {session.workshops?.name ?? session.title ?? "Ședință specială"} —{" "}
          {formatDate(session.date)}, {formatTime(session.start_time)}–{formatTime(session.end_time)}
        </p>
      </div>

      <form action={moveSession.bind(null, sessionId)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">Data nouă</Label>
          <Input id="date" name="date" type="date" required defaultValue={session.date} />
        </div>
        <p className="text-sm text-neutral-500">
          Ora rămâne aceeași ({formatTime(session.start_time)}). Prezențele deja
          înregistrate nu se schimbă.
        </p>
        <Button type="submit" className="w-full">
          Mută ședința
        </Button>
      </form>
    </div>
  );
}
