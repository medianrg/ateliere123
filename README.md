# Ateliere123

Aplicație de management al prezenței, abonamentelor și comunicării cu părinții
pentru un club de ateliere de dezvoltare pentru copii.

Utilizatori: **Rebecca** (admin/instructor) și **părinții** copiilor înscriși.

## Documentație

- [`PLAN.md`](./PLAN.md) — specificația completă a proiectului: decizii de
  design, schema bazei de date, fazele de implementare, regulile de business.
- [`CLAUDE.md`](./CLAUDE.md) — instrucțiuni de lucru pentru implementare
  (stack tehnic, reguli de bază de date, mod de lucru pe faze).

## Stadiu actual

Proiectul e la stadiul de planificare. Niciun cod de aplicație nu a fost scris
încă — următorul pas e Faza 0 (fundație: Next.js, Supabase, autentificare),
descrisă în `PLAN.md`.

## Stack tehnic (planificat)

- Next.js (App Router) + TypeScript
- PostgreSQL prin Supabase (bază de date + autentificare)
- Drizzle ORM, cu migrări versionate în git
- Tailwind + shadcn/ui
- Deploy: Vercel

Detalii complete în `CLAUDE.md` și `PLAN.md`.
