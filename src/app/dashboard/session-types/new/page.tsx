import { SessionTypeForm } from "../session-type-form";
import { createSessionType } from "../actions";

export default function NewSessionTypePage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Tip de atelier nou</h1>
      <SessionTypeForm action={createSessionType} submitLabel="Creează" />
    </div>
  );
}
