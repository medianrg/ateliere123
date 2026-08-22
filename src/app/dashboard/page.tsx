import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTime, todayInBucharest } from "@/lib/date";

type TodaySession = {
  id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  groups: { name: string } | null;
  session_types: { name: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = todayInBucharest();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, start_time, end_time, status, groups(name), session_types(name)")
    .eq("date", today)
    .neq("status", "cancelled")
    .order("start_time")
    .returns<TodaySession[]>();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Ateliere azi</h1>

      {(!sessions || sessions.length === 0) ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
          <p>Nicio ședință programată azi.</p>
          <Link href="/dashboard/sessions/new" className="text-sm underline">
            Programează o ședință
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/dashboard/sessions/${session.id}/attendance`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium">
                    {session.groups?.name ?? session.title ?? "Atelier special"}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatTime(session.start_time)}–{formatTime(session.end_time)} ·{" "}
                    {session.session_types?.name}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-neutral-400">
                  Prezență →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
