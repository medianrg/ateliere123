# Ateliere123

Aplicație de management al prezenței, abonamentelor și comunicării cu părinții
pentru un club de ateliere de dezvoltare pentru copii.

Utilizatori: **Rebecca** (admin/instructor) și **părinții** copiilor înscriși.

## Documentație

- [`PLAN.md`](./PLAN.md) — specificația completă a proiectului: decizii de
  design, schema bazei de date, fazele de implementare, regulile de business.
- [`CLAUDE.md`](./CLAUDE.md) — instrucțiuni de lucru pentru implementare
  (stack tehnic, reguli de bază de date, mod de lucru pe faze).

## Stadiu actual — Faza 1: Nucleul administrativ

**Faza 0** (fundație): Next.js + Tailwind, autentificare Supabase, schema
completă a bazei de date cu Row Level Security pe toate tabelele.

**Faza 1** (nucleul administrativ) adaugă:
- **Ateliere** — programul + grupa de copii, cu ritm (săptămânal / la două
  săptămâni / lunar), preț pe ședință și preț drop-in, creare/editare/
  arhivare (`/dashboard/workshops`)
- **Copii** — listă, adăugare, editare, un copil poate fi înscris la mai
  multe ateliere simultan (`child_workshops`), dezactivare, plus
  **acordul GDPR** (statut foto, tag social) per copil (`/dashboard/children`)
- **Ședințe** — normale (legate de un atelier) și speciale (participanți
  manuali), creare individuală (`/dashboard/sessions/new`) sau în bloc cu
  **„Generează ședințe"** (`/dashboard/sessions/generate`) pe baza ritmului
  atelierului, cu previzualizare editabilă înainte de confirmare
- **Ecranul de prezență** — cel mai important din aplicație: un tap =
  prezent, salvare automată, indicator foto (GDPR) lângă fiecare copil,
  buton „+ Adaugă copil" pentru recuperări/frați/copii de probă
  (`/dashboard/sessions/[id]/attendance`)
- **Calendarul** (ecranul de start) — ședințele grupate pe săptămâni;
  ședințele trecute nebifate apar în roșu, sus — cel mai util semnal din
  aplicație (`/dashboard`)
- **Setări** — tipuri de ședință, mutate aici pentru că sunt configurare,
  nu lucru zilnic (`/dashboard/settings`)

Fără abonamente, fără părinți, fără plăți — vin în Faza 2 și Faza 3 (vezi
`PLAN.md` și deciziile notate în `DECISIONS.md`).

## Cum rulezi proiectul local

1. **Instalează dependențele:**
   ```bash
   npm install
   ```

2. **Creează-ți un proiect Supabase** (dacă nu ai deja unul) pe
   [supabase.com](https://supabase.com), apoi copiază fișierul de configurare:
   ```bash
   cp .env.local.example .env.local
   ```
   și completează valorile din Supabase → *Project Settings* → *Data API* /
   *API Keys* / *Database*. Detalii despre fiecare valoare sunt în comentariile
   din `.env.local.example`.

3. **Aplică schema bazei de date:**
   ```bash
   npm run db:migrate
   ```
   Asta creează toate tabelele din `PLAN.md` (copii, ateliere, prezențe,
   abonamente etc.), tipurile enum, politicile de securitate (RLS) și
   declanșatorul care creează automat un rând în `users` la fiecare
   înregistrare nouă. Migrările se aplică **în ordine** — dacă ai rulat deja
   proiectul înainte de redenumirea „grupă" → „atelier", rulează și
   `drizzle/0002_workshops_rename.sql`, care mută toate datele existente
   fără să șteargă nimic.

4. **Pornește serverul de dezvoltare:**
   ```bash
   npm run dev
   ```
   Aplicația rulează pe [http://localhost:3000](http://localhost:3000).

### Primul cont de administrator

Aplicația nu are încă un ecran de "creează cont" — conturile se creează din
Supabase Studio (asta e și planul pe termen lung: părinții primesc cont de la
Rebecca, nu se înregistrează singuri).

1. În Supabase Studio → **Authentication → Users → Add user**, creează un
   cont cu emailul și o parolă pentru Rebecca.
2. La crearea contului, un rând nou apare automat în tabela `users`, cu
   rolul implicit `parent`. Ridică-l la `admin` rulând în **SQL Editor**:
   ```sql
   update public.users set role = 'admin' where email = 'email-ul Rebeccăi';
   ```
3. Loghează-te în aplicație cu acel email și parolă.

### Date de test (seed)

Ca să ai ceva de văzut/testat imediat (mai ales pe ecranul de prezență și
pe calendar), rulează în Supabase Studio → **SQL Editor** conținutul
fișierului [`drizzle/seed.sql`](./drizzle/seed.sql). Adaugă 3 ateliere
(două săptămânale, unul lunar, cu prețuri diferite), 10 copii (unul
înscris la două ateliere), ședințe pe ~2 luni — trecute și **nebifate**
intenționat, ca să vezi alertele roșii din calendar — și 2 abonamente.
Sigur de rulat de mai multe ori.

## Alte comenzi utile

```bash
npm run build        # build de producție
npm run lint         # verificare cod
npm run db:generate  # generează o migrare nouă după ce modifici src/db/schema.ts
npm run db:studio    # interfață vizuală pentru baza de date (Drizzle Studio)
```

## Stack tehnic

- Next.js (App Router) + TypeScript
- PostgreSQL prin Supabase (bază de date + autentificare)
- Drizzle ORM, cu migrări versionate în git
- Tailwind CSS
- Deploy: Vercel

Detalii complete în `CLAUDE.md` și `PLAN.md`.
