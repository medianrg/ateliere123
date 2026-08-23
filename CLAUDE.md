# Ateliere123 — instrucțiuni de proiect

Aplicație de management al prezenței și abonamentelor pentru un club de ateliere
pentru copii. Utilizatori: un administrator (Rebecca) și părinții copiilor.

**Specificația completă e în `PLAN.md`. Citește-o înainte de orice implementare.**

---

## Regula numărul unu

Lucrăm **o fază pe rând**, în ordinea din PLAN.md secțiunea „Fazele de
implementare". Nu începe faza următoare fără să ți se ceară explicit, chiar dacă
pare evident ce urmează.

Dacă ți se cere ceva ce aparține unei faze ulterioare, semnalează asta înainte
de a implementa.

---

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage)
- Drizzle ORM cu migrări versionate în git
- Tailwind + shadcn/ui
- Deploy: Vercel

---

## Reguli de bază de date

- **Migrări versionate în git.** Niciodată modificări manuale în Supabase Studio.
  Fiecare schimbare de schemă = un fișier de migrare comis.
- **Niciodată DELETE.** Totul e `is_active = false`. Copiii pleacă și se întorc,
  atelierele se arhivează, istoricul rămâne intact.
- **Fără contoare.** Soldul abonamentului și soldul financiar se calculează
  întotdeauna prin agregare din prezențe și plăți. Vezi PLAN.md secțiunea 3.
- **Row Level Security activat pe toate tabelele.** Un părinte trebuie să nu
  poată accesa datele altui copil nici măcar prin apel direct la API.
- **Timezone `Europe/Bucharest`** peste tot. Datele se afișează `zi.lună.an`.

---

## Reguli de produs

- **Manual peste automat.** Aplicația sugerează, nu decide. Nu adăuga validări
  care blochează acțiuni: fără constrângeri pe vârstă, capacitate sau durată.
  Un copil fără abonament valid trebuie să poată fi bifat prezent.
- **Nicio notificare automată** în afara celor descrise explicit în PLAN.md
  secțiunea despre notificări. Nu adăuga „util" un email de reamintire.
- **Copiii cu `payment_status = exempt`** nu apar în lista de restanțe și nu pot
  primi notificare de plată. Asta se aplică la nivel de query, nu ca filtru din
  interfață.
- **Emailurile de feedback nu conțin niciodată textul feedbackului**, doar un
  link către aplicație.
- **Mobile-first.** Ecranul de prezență se folosește pe telefon, în picioare,
  cu o mână. Butoane de minim 44px. Fără buton „Salvează" — salvare la fiecare
  tap.

---

## Tipare UX — folosim tipare consacrate, nu inventăm

Fiecare ecran folosește un tipar existent în aplicații pe care oamenii le
folosesc zilnic. Rebecca nu trebuie să învețe o interfață nouă, trebuie să
recunoască una pe care o știe deja.

| ecran | tipar | unde se vede |
|---|---|---|
| Calendar | bandă de zile + agenda view | Booksy, Fresha, Square |
| Prezență | catalog cu toggle pe rând | Google Classroom, ClassDojo |
| Listă copii | listă căutabilă, două rânduri per element | — |
| Fișa copilului | antet de profil + secțiuni | — |
| Fișa financiară | extras de cont: sold sus, tranzacții dedesubt | — |
| Invitație | email + setare parolă la primul acces | Slack, Notion |
| Feedback | ciornă cu autosave + publicare explicită | — |
| Anulare acțiune | snackbar cu „Anulează" | Gmail Undo Send |
| Formulare | etichetă deasupra câmpului, validare la blur | — |
| Navigație mobil | bară jos, maximum 5 elemente | — |
| Ecran gol | ce lipsește + o singură acțiune | — |

Când apare un ecran care nu e în listă, caută întâi tiparul standard pentru
acel tip de problemă. Soluția inventată e ultima variantă.

Reguli:
- Folosește componentele shadcn/ui așa cum sunt. Nu construi variante
  proprii de dropdown, dialog, calendar sau tabel.
- Evită confirmările blocante. În loc de „Ești sigur?", execută acțiunea și
  oferă „Anulează" în snackbar. Excepție: acțiuni ireversibile.
- Niciun ecran gol fără text explicativ și un buton de acțiune.
- Iconițe doar din lucide-react, cu semnificațiile standard.
- Nimic ascuns sub gesturi. Swipe și long-press pot fi scurtături, dar
  fiecare acțiune are și un buton vizibil.

---

## Limbă și conținut

- Toate textele din interfață sunt **în română, cu diacritice**.
- Cod, nume de tabele, nume de variabile și commit-uri: **în engleză**.
- Testează afișarea diacriticelor: „ședință", „Brașov", „prezență".

---

## Securitate

- Cheile API nu ajung niciodată în repo. `.env.local` e în `.gitignore` din
  primul commit.
- Cheia `service_role` de Supabase se folosește **doar** pe server, niciodată
  într-o componentă client.
- Nu scrie chei sau parole în fișiere, în comentarii sau în mesaje de commit.
- Datele despre copii sunt date personale ale minorilor. Fără logare de date
  personale în consolă, fără trimitere către servicii terțe.

---

## Mod de lucru

- Branch separat per fază: `faza-0-setup`, `faza-1-nucleu`, etc.
- Commit-uri mici și dese, cu mesaj descriptiv.
- La fiecare fază, actualizează `README.md` cu ce s-a construit și cum se rulează.
- **Seed data de la prima fază:** 3 ateliere, ~10 copii, ~5 sesiuni, 2 abonamente.
  Fără date de test nu se poate evalua dacă ecranul de prezență e rapid.
- Când o decizie de implementare nu e acoperită de PLAN.md, **întreabă**, nu
  presupune. Notează întrebarea în `DECISIONS.md`.

---

## Criterii de acceptare

Fiecare fază are unul în PLAN.md. Nu considera o fază terminată până nu e
îndeplinit. Cel mai important, pentru Faza 1:

> Rebecca bifează prezența la un atelier real, de pe telefon, în sub 60 de secunde.
