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
- **Grupe** — creare, editare, arhivare (`/dashboard/groups`)
- **Tipuri de atelier** — etichete simple (`/dashboard/session-types`)
- **Copii** — listă, adăugare, editare, mutare între grupe, dezactivare,
  plus **acordul GDPR** (statut foto, tag social) per copil
  (`/dashboard/children`)
- **Ședințe** — normale (legate de o grupă) și speciale (participanți
  manuali), creare și anulare (`/dashboard/sessions`)
- **Ecranul de prezență** — cel mai important din aplicație: un tap =
  prezent, salvare automată, indicator foto (GDPR) lângă fiecare copil,
  buton „+ Adaugă copil" pentru recuperări/frați/copii de probă
  (`/dashboard/sessions/[id]/attendance`)
- Dashboard-ul de start arată direct ședințele de azi, fiecare cu un link
  spre ecranul ei de prezență — fără navigare

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
   Asta creează toate tabelele din `PLAN.md` (copii, grupe, prezențe,
   abonamente etc.), tipurile enum, politicile de securitate (RLS) și
   declanșatorul care creează automat un rând în `users` la fiecare
   înregistrare nouă.

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

Ca să ai ceva de văzut/testat imediat (mai ales pe ecranul de prezență),
rulează în Supabase Studio → **SQL Editor** conținutul fișierului
[`drizzle/seed.sql`](./drizzle/seed.sql). Adaugă 3 grupe, 10 copii, 5
ședințe (două programate azi) și 2 abonamente. Sigur de rulat de mai
multe ori.

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
