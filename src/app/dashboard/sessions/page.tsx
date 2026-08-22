import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, todayInBucharest } from "@/lib/date";
import { cancelSession, reopenSession } from "./actions";

type SessionRow = {
  id: string;
  title: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  credit_cost: string;
  groups: { name: string } | null;
  session_types: { name: string } | null;
};

export default async function SessionsPage() {
  const supabase = await createClient();
  const today = todayInBucharest();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, date, start_time, end_time, status, credit_cost, groups(name), session_types(name)")
    .gte("date", today)
    .order("date")
    .order("start_time")
    .returns<SessionRow[]>();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ședințe</h1>
        <Link href="/dashboard/sessions/new">
          <Button>+ Ședință nouă</Button>
        </Link>
      </div>

      {(!sessions || sessions.length === 0) ? (
        <p className="text-sm text-neutral-500">Nicio ședință programată de azi înainte.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {session.groups?.name ?? session.title ?? "Atelier special"}
                  {session.status === "cancelled" && (
                    <span className="ml-2 text-sm font-normal text-red-600">(anulată)</span>
                  )}
                </p>
                <p className="text-sm text-neutral-500">
                  {formatDate(session.date)} · {formatTime(session.start_time)}–
                  {formatTime(session.end_time)} · {session.session_types?.name}
                  {session.credit_cost !== "1" && ` · ${session.credit_cost} ședințe`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/dashboard/sessions/${session.id}/attendance`}>
                  <Button variant="outline" size="sm">
                    Prezență
                  </Button>
                </Link>
                {session.status === "cancelled" ? (
                  <form action={reopenSession.bind(null, session.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Redeschide
                    </Button>
                  </form>
                ) : (
                  <form action={cancelSession.bind(null, session.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Anulează
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
