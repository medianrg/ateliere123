import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Setări</h1>

      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        <li>
          <Link
            href="/dashboard/settings/session-types"
            className="block p-4 hover:bg-neutral-50"
          >
            <p className="font-medium">Tipuri de ședință</p>
            <p className="text-sm text-neutral-500">
              Etichete precum „Obișnuit” sau „Vacanță” — configurare, nu lucru zilnic.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
