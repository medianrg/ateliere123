import { GroupForm } from "../group-form";
import { createGroup } from "../actions";

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Grupă nouă</h1>
      <GroupForm action={createGroup} submitLabel="Creează grupa" />
    </div>
  );
}
