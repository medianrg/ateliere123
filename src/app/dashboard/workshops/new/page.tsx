import { WorkshopForm } from "../workshop-form";
import { createWorkshop } from "../actions";

export default function NewWorkshopPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Atelier nou</h1>
      <WorkshopForm action={createWorkshop} submitLabel="Creează atelierul" />
    </div>
  );
}
