# Ateliere123

Aplicație de management al prezenței, abonamentelor și comunicării cu părinții
pentru un club de ateliere de dezvoltare pentru copii.

Utilizatori: **Rebecca** (admin/instructor) și **părinții** copiilor înscriși.

## Documentație

- [`PLAN.md`](./PLAN.md) — specificația completă a proiectului: decizii de
  design, schema bazei de date, fazele de implementare, regulile de business.
- [`CLAUDE.md`](./CLAUDE.md) — instrucțiuni de lucru pentru implementare
  (stack tehnic, reguli de bază de date, mod de lucru pe faze).

## Stadiu actual — Faza 2: Abonamente și plăți

**Faza 0** (fundație): Next.js + Tailwind, autentificare Supabase, schema
completă a bazei de date cu Row Level Security pe toate tabelele.

**Faza 1** (nucleul administrativ):
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
- **Calendarul** (ecranul de start) — bandă de zile + agendă săptămânală
  (tiparul Booksy/Fresha), cu vedere lunară alternativă; secțiunea „De
  completat" arată ședințele restante, cel mai util semnal din aplicație
  (`/dashboard`)
- **Setări** — tipuri de ședință, mutate aici pentru că sunt configurare,
  nu lucru zilnic (`/dashboard/settings`)

**Faza 2** (abonamente și plăți) adaugă:
- **Abonamente** — legate de un copil și un atelier, cu prețul copiat din
  atelier la creare (dacă atelierul se scumpește mai târziu, abonamentele
  deja vândute rămân la prețul vechi) (`/dashboard/subscriptions/new`)
- **Sold derivat** — niciodată un contor: ședințele rămase se calculează
  din prezențe, soldul din abonamente minus plăți, mereu recalculat, nu
  stocat
- **Plăți** — sumă + dată + metodă, manual (`/dashboard/payments/new`)
- **Fișa financiară a copilului** — ședințe rămase, total de plată/achitat,
  sold, listă de abonamente și plăți, istoric de prezențe
  (`/dashboard/children/[id]/financiar`)
- **„Cine are restanțe"** — copiii cu sold negativ, ordonați descrescător;
  copiii `Scutit` nu apar niciodată aici, la nivel de interogare
  (`/dashboard/subscriptions`)
- **Indicator de abonament pe ecranul de prezență** — 🟢/🟡/🔴 lângă fiecare
  copil, cu buton de plată drop-in când nu are abonament valid

**Tipare UX** — corectare de design peste ce era construit deja:
- Fiecare ecran urmează un tipar consacrat (regulă permanentă, vezi
  `CLAUDE.md`); componentele de bază rămân cele proprii (`src/components/ui`),
  fără dependință de shadcn CLI (blocat de rețea în acest mediu)
- Prezența are două stări, nu trei — „Întârziat" a dispărut din interfață
  și din baza de date
- „Bifat" / „nebifat" devine **„Completat" / „De completat"** peste tot
- **„Mută ședința"** — buton cu selector de dată, nu doar anulare + ședință
  nouă (`/dashboard/sessions/[id]/move`)
- Calendarul are și o **vedere lunară**, pentru ansamblu după „Generează
  ședințe" (`/dashboard?view=month`)

Fără părinți — vin în Faza 3, după pauza obligatorie de 2 săptămâni de
folosire reală (vezi `PLAN.md` și deciziile notate în `DECISIONS.md`).

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
   înregistrare nouă. Migrările se aplică **în ordine, 0000 → 0004** — dacă
   ai rulat deja proiectul înainte de o fază anterioară, rulează și
   migrările lipsă (`0002_workshops_rename.sql`, `0003_subscriptions_workshop.sql`,
   `0004_attendance_no_late.sql`); niciuna nu șterge date existente.

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
fișierului [`drizzle/seed.sql`](./drizzle/seed.sql) — **după** ce ți-ai
creat contul de administrator (pasul de mai sus). Adaugă 3 ateliere (două
săptămânale, unul lunar, cu prețuri diferite), 10 copii (unul înscris la
două ateliere), ședințe pe ~2 luni — trecute și **nebifate** intenționat,
ca să vezi alertele roșii din calendar — și 3 abonamente, câte unul din
fiecare culoare (🟢🟡🔴), plus 2 plăți, ca să vezi „Cine are restanțe".
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
