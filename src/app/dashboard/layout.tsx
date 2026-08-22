import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <span className="font-semibold">Ateliere123</span>
        <div className="flex items-center gap-3 text-sm">
          {profile && (
            <span className="text-neutral-600">
              {profile.full_name} · {roleLabel(profile.role)}
            </span>
          )}
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Ieși din cont
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "instructor":
      return "Instructor";
    case "parent":
      return "Părinte";
    default:
      return role;
  }
}
