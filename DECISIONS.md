# Decizii de implementare

Decizii luate în timpul dezvoltării, acolo unde PLAN.md nu dă un răspuns
direct.

## Faza 1

**Ședințele se creează una câte una, nu recurent.**
PLAN.md secțiunea 9 pune întrebarea explicit ("sesiunile se generează
recurent... sau una câte una?") și o marchează drept ceva de rezolvat
înainte de Faza 3, nu de Faza 1. Criteriul de acceptare al Fazei 1 (bifat
prezența la un atelier real) nu are nevoie de generare recurentă — e
suficient ca Rebecca să creeze o ședință când știe că are loc.
Generarea recurentă (ex. "toate marțile din septembrie") rămâne o
îmbunătățire posibilă pentru o fază ulterioară, dacă introducerea manuală
a fiecărei ședințe devine un blocaj real în folosire.

**Ecranul de prezență nu afișează indicatorul de abonament.**
Specificația din PLAN.md secțiunea 5 cere culori 🟢🟡🔴 pentru abonament
lângă fiecare copil. Abonamentele (tabela `subscriptions`, calculul
soldului) sunt explicit parte din Faza 2, nu din Faza 1 — "Fără
abonamente" e scris direct la începutul secțiunii Faza 1. Indicatorul de
abonament se adaugă când se implementează Faza 2; până atunci rămâne doar
indicatorul de foto (GDPR), care e în scopul Fazei 1.

## Faza 1 — corectare terminologie (grupă → atelier)

**Migrarea a fost scrisă manual, nu generată automat de `drizzle-kit
generate`.** Redenumirea `groups` → `workshops` implică o coloană nouă cu
alt nume dar aceleași date — `drizzle-kit` cere confirmare interactivă
("e o redenumire sau ștergi/creezi din nou?"), iar acel prompt necesită un
terminal real (TTY), pe care nu îl am în acest mediu. Riscul unei rulări
oarbe era să genereze `DROP TABLE groups; CREATE TABLE workshops` — exact
ce interzice regula "nu șterge nimic". Am scris manual
`drizzle/0002_workshops_rename.sql` cu `ALTER TABLE ... RENAME`, care
păstrează toate rândurile, și am sincronizat manual și starea internă a
Drizzle (`meta/0002_snapshot.json`) ca viitoarele `db:generate` să vadă
schema corectă și să nu propună aceeași redenumire a doua oară.

**`weekday` la ateliere se completează automat doar din valori
recognoscibile.** Vechiul câmp `default_day` era text liber. Migrarea
mapează exact „Luni".."Duminică" (cu diacritice) la 1-7; orice altă
valoare (goală, scrisă altfel) rămâne `null` și se completează manual din
formular — nu blochează nimic.

**A rămas un punct de intrare pentru o ședință creată individual**
(`/dashboard/sessions/new`), pe lângă „Generează ședințe". PLAN.md descrie
explicit ateliere speciale/ad-hoc (ședință de vacanță, recuperare) care nu
urmează ritmul unui atelier — „Generează ședințe" nu acoperă acest caz.
Legătura e pe ecranul „Astăzi" (când nu e nimic programat) și rămâne
accesibilă la nevoie; nu apare ca buton principal pe calendar, ca să nu
concureze vizual cu „Generează ședințe".

**„Bifat" / „nebifat" pe un card de ședință înseamnă „există cel puțin o
prezență înregistrată"**, nu "toți copiii din listă sunt bifați". PLAN.md
nu detaliază definiția exactă; am ales semnalul cel mai simplu și util —
dacă Rebecca a intrat pe ecranul de prezență și a bifat pe cineva, ședința
nu mai e „uitată". O definiție mai strictă (roster complet) se poate
adăuga ulterior dacă se dovedește necesară.

**Calendarul arată câte două săptămâni deodată**, paginate din 2 în 2 cu
„Mai devreme" / „Mai târziu". PLAN.md cere doar „se poate derula înapoi în
istoric și înainte în viitor", fără un mecanism anume.

**Tabela `subscriptions` nu a fost atinsă**, deși PLAN.md (secțiunea 4) îi
adaugă acum `workshop_id` și redenumește `total_credits` în
`total_sessions`. Rămâne un subiect de Faza 2, când se construiește
efectiv ecranul de abonamente — schimbarea se face atunci, testată cu
adevărat, nu speculativ acum.
