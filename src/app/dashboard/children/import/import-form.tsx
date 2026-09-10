"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { importChildren } from "./actions";

type ParsedChild = {
  firstName: string;
  lastName: string;
  duplicate: boolean;
};

/** "Maria Ionescu" -> prenume "Maria", nume "Ionescu". Un singur cuvânt merge
 * și el: rămâne doar prenumele, restul se completează pe fișă. */
function parseLines(text: string, existingNames: string[]): ParsedChild[] {
  const seen = new Set(existingNames);
  const out: ParsedChild[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim().replace(/\s+/g, " ");
    if (!line) continue;
    const parts = line.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    const key = `${firstName} ${lastName}`.trim().toLocaleLowerCase("ro");
    out.push({ firstName, lastName, duplicate: seen.has(key) });
    seen.add(key);
  }

  return out;
}

export function ImportForm({
  workshops,
  existingNames,
}: {
  workshops: { id: string; name: string }[];
  existingNames: string[];
}) {
  const [text, setText] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [isPending, startTransition] = useTransition();

  const parsed = useMemo(() => parseLines(text, existingNames), [text, existingNames]);
  const toCreate = parsed.filter((c) => !c.duplicate);
  const duplicates = parsed.filter((c) => c.duplicate);

  function submit() {
    startTransition(async () => {
      await importChildren(
        toCreate.map((c) => ({ firstName: c.firstName, lastName: c.lastName })),
        workshopId || null,
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="names">Copiii</Label>
        <Textarea
          id="names"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Maria Ionescu\nAndrei Popescu\nSofia Dumitrescu"}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="workshop_id">Înscrie-i pe toți la atelierul (opțional)</Label>
        <Select
          id="workshop_id"
          value={workshopId}
          onChange={(e) => setWorkshopId(e.target.value)}
        >
          <option value="">fără atelier deocamdată</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>

      {parsed.length > 0 && (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-700">
            Se creează {toCreate.length}{" "}
            {toCreate.length === 1 ? "copil" : "copii"}
          </p>
          <ul className="space-y-1 text-sm">
            {parsed.map((c, i) => (
              <li
                key={i}
                className={c.duplicate ? "text-neutral-400 line-through" : "text-neutral-700"}
              >
                {c.firstName} {c.lastName}
                {c.duplicate && " — există deja, se sare"}
              </li>
            ))}
          </ul>
          {duplicates.length > 0 && (
            <p className="text-sm text-neutral-500">
              {duplicates.length}{" "}
              {duplicates.length === 1 ? "rând sărit" : "rânduri sărite"}, ca să
              nu ai copii dubli.
            </p>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={submit}
        disabled={isPending || toCreate.length === 0}
        className="w-full"
      >
        {isPending
          ? "Se adaugă..."
          : toCreate.length === 0
            ? "Scrie cel puțin un nume"
            : toCreate.length === 1
              ? "Adaugă un copil"
              : `Adaugă ${toCreate.length} copii`}
      </Button>

      <p className="text-sm text-neutral-500">
        Toți intră cu statutul foto pe „fără poze”, până îl schimbi tu. Nimic nu
        se șterge la import: dacă rulezi din nou aceeași listă, copiii care
        există deja sunt săriți.
      </p>
    </div>
  );
}
