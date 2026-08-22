# Ateliere123 — Plan de implementare

Aplicație de management al prezenței, abonamentelor și comunicării cu părinții
pentru un club de ateliere de dezvoltare pentru copii.

Utilizatori: **Rebecca** (admin/instructor) și **părinții** copiilor înscriși.

---

## 1. Decizii deja luate

| Subiect | Decizie |
|---|---|
| Grupe | Complet editabile de Rebecca: creare, redenumire, arhivare. Acum: 8-10, 11-12, 14-16. Anterior a existat 13-15. |
| Interval de vârstă | Doar etichetă informativă. **Nu validează nimic.** Intervalele se suprapun și se schimbă în timp. |
| Ateliere speciale | Trebuie suportate: ateliere de vacanță, ateliere extinse (4h), orice eveniment ad-hoc. Nu afectează fluxul normal. |
| Structura atelierului | Rebecca decide de fiecare dată: 4 ședințe de 2h, sau 1 ședință de 6h, sau 8h. **Introdus manual, fără automatizare.** |
| Preț abonament | Se stabilește per copil, nu pe listă de prețuri. Poate fi redus sau 0. |
| Statut plată | Bifă pe copil: `Standard` / `Parțial` / `Scutit`. Motivul nu se stochează — îl știe Rebecca. |
| Notificări | **Nimic automat în v1.** Orice mesaj către părinte pleacă doar la apăsarea unui buton de către Rebecca. |
| Gustări | Nu intră în aplicație. Se gestionează în afara ei. |
| Evidența banilor | Per copil: cât are de plătit vs. cât a plătit efectiv. Diferența = datorie. |
| Absențe | Rebecca decide de la caz la caz dacă ședința se scade sau nu. |
| Plăți | Sumă + dată, introduse manual de Rebecca. Fără plată online în v1. |
| Plată per ședință (drop-in) | Există, trebuie suportată. |
| Prețuri / politică abonamente | NU intră în aplicație. Sunt pe site-ul public. |
| GDPR | Acordul se semnează pe hârtie deocamdată, dar statusul se stochează în app. |
| Părinți ↔ copii | Relație many-to-many de la început. |

---

## 2. Principiul de design: manual peste automat

> **Aplicația nu decide nimic în locul Rebeccăi. Ține minte și adună.**

Fiecare câmp calculat automat e o **sugestie**, nu o regulă. Orice valoare poate
fi modificată, inclusiv retroactiv, fără ca altceva să se strice.

Concret, asta înseamnă:
- Nu există listă de prețuri. Rebecca tastează suma pentru fiecare abonament.
- Nu există reguli despre cât consumă un atelier. Ea introduce numărul.
- Nu există validare pe vârstă, pe capacitate sau pe durată.
- Nu există blocaje: un copil fără abonament valid poate fi bifat prezent.
- Aplicația **semnalează** anomalii (sold negativ, restanță, abonament expirat),
  dar nu împiedică niciodată o acțiune.

Excepția: datele nu se pierd niciodată. Modificările se scriu în jurnal.

---

## 3. Regula centrală de care depinde tot

> **Soldul unui abonament nu se stochează niciodată ca un contor.**
> Se calculează întotdeauna din înregistrările de prezență, în **credite**.

```
credite_rămase = abonament.total_credite
                 − SUM(prezențe.credits_used WHERE abonament_id = X)
```

Motivul pentru calcul derivat: un contor `ramase = ramase - 1` se strică la prima
corectură, la primul dublu-click, la prima ștergere. Un calcul derivat e mereu
corect, e auditabil și permite Rebeccăi să modifice orice fără efecte laterale.

Motivul pentru credite în loc de boolean: acoperă orice tip de atelier fără
schimbare de schemă.

| Situație | credits_used |
|---|---|
| Atelier normal, copil prezent | 1 |
| Absență pe care Rebecca o iartă | 0 |
| Absență nemotivată | 1 |
| Sesiune anulată de club | 0 |
| Atelier extins de 4 ore | 2 (configurabil) |
| Atelier de vacanță plătit separat | 0 + o plată înregistrată |
| Drop-in (fără abonament) | 0, `subscription_id = null` |

Valoarea vine implicit din tipul atelierului, dar Rebecca o poate suprascrie
pentru un copil anume, cu un tap.

### A doua regulă: banii au două laturi

Nu e suficient „a plătit / nu a plătit". Sunt două mărimi diferite:

```
de_plată  = SUM(abonamente.price WHERE child_id = X)
achitat   = SUM(plăți.amount   WHERE child_id = X)
sold      = achitat − de_plată
```

- `sold = 0` → la zi
- `sold < 0` → restanță, exact cât
- `sold > 0` → a plătit în avans

Un abonament gratuit are `price = 0` — intră în total, nu produce datorie și nu
apare ca restanță. Așa cazurile sociale funcționează fără niciun mecanism
special, iar cifrele de încasări rămân corecte.

Dacă performanța devine vreodată o problemă (nu va deveni la scara asta), se
adaugă un câmp cache actualizat de un trigger — dar sursa de adevăr rămâne
tabela de prezențe.

---

## 3. Stack recomandat

- **Next.js (App Router) + TypeScript** — un singur proiect, front + API
- **PostgreSQL prin Supabase** — bază de date + autentificare + storage pentru poze mai târziu
- **Drizzle sau Prisma** — ORM cu migrări versionate în git
- **Tailwind + shadcn/ui** — componente gata făcute, mobile-first
- **Vercel** — deploy automat din GitHub

De ce Supabase: autentificarea cu email + parolă, **resetarea parolei** și
confirmarea pe email vin gata făcute. Părinții vor uita parolele — garantat. Nu
merită scris de mână.

**Setări obligatorii:** timezone `Europe/Bucharest` peste tot, encoding UTF-8 cu
diacritice testate (Brașov, Ateliere, ședință), formatul datelor `zi.lună.an`.

---

## 4. Schema bazei de date

### `users`
Contul de autentificare. Un singur tabel pentru toată lumea.

| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| role | enum | `admin`, `instructor`, `parent` |
| full_name | text | |
| phone | text nullable | |
| is_active | boolean | dezactivare fără ștergere |
| created_at | timestamptz | |

### `groups`
Complet gestionabilă din interfață. Rebecca creează, redenumește și arhivează
grupe fără să fie nevoie de cod sau de migrare.

| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| name | text | ex. „Grupa mijlocie" — text liber |
| min_age / max_age | int nullable | **doar etichetă**, nu validează nimic |
| color | text nullable | pentru identificare vizuală rapidă în calendar |
| default_day / default_time | nullable | ajută la generarea sesiunilor recurente |
| is_active | boolean | arhivare, niciodată ștergere |
| sort_order | int | ordinea de afișare |

**Reguli:**
- Intervalele de vârstă se pot suprapune (11-12 și 11-13 pot coexista). Aplicația
  nu se opune, pentru că realitatea nu se opune.
- Atribuirea copilului la grupă e **întotdeauna manuală**. Fără sugestii
  automate pe bază de vârstă — cu intervale care se suprapun ar genera alerte
  false și Rebecca ar învăța să le ignore.
- O grupă arhivată dispare din ecranele de lucru, dar sesiunile și prezențele
  istorice rămân legate de ea. Grupa 13-15 din 2025 trebuie să existe în veci în
  istoric.
- Dacă o grupă se „împarte" în două (13-15 → 11-12 + 14-16), asta înseamnă:
  arhivezi vechea grupă, creezi două noi, muți copiii. Nu redenumești.

### `children`
| id | uuid PK |
| first_name / last_name | text |
| birth_date | date | pentru sugestia de mutare între grupe |
| group_id | uuid FK → groups |
| enrolled_at | date |
| payment_status | enum | `standard` / `partial` / `exempt` — vezi mai jos |
| payment_status_note | text nullable | opțional, strict intern, poate rămâne gol |
| is_active | boolean | copil plecat = inactiv, NU șters |
| notes | text nullable | notițe interne, vizibile doar Rebeccăi |

**Statutul de plată** e o bifă administrativă, nu o explicație.

| valoare | etichetă în interfață | comportament |
|---|---|---|
| `standard` | Standard | apare normal în restanțe și în notificări |
| `partial` | Parțial | apare în restanțe; prețul redus e deja în abonament |
| `exempt` | Scutit | **nu apare niciodată** în restanțe, nu poate primi notificare de plată |

Motivul scutirii — prieten al familiei, situație socială, copil de colaborator —
**nu se stochează ca și categorie.** Toate arată identic în aplicație. Dacă
Rebecca vrea să-și noteze ceva, are `payment_status_note`, care e opțional și
vizibil doar ei.

Blocajul pe `exempt` la notificări e intenționat și e o plasă de siguranță: e
genul de greșeală pe care nu vrei să o faci cu o familie aflată într-o situație
delicată, nici măcar din greșeală, nici măcar o dată.

### `parent_child` (tabelă de legătură)
| parent_user_id | uuid FK → users |
| child_id | uuid FK → children |
| relationship | text | „mamă", „tată", „bunică" |
| is_primary_contact | boolean |

PK compus (parent_user_id, child_id).

### `consents` — GDPR
Un rând per copil, actualizabil în timp.

| child_id | uuid FK unique |
| photo_status | enum | `full` / `masked` / `none` |
| tag_parent_social | boolean |
| gdpr_signed_at | date nullable |
| signed_by_parent_id | uuid nullable |
| paper_reference | text nullable | unde e hârtia fizică |
| updated_at / updated_by | |

`masked` = poza poate fi postată dar cu fața copilului acoperită (emoji/blur).
Cele trei stări se exclud reciproc — de aceea un singur câmp, nu trei bife.

### `session_types` — doar etichete
**Nu e un motor de reguli.** E o listă de nume pe care Rebecca o folosește ca să
poată filtra mai târziu. Nimic nu se întâmplă automat pe baza tipului.

| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| name | text | „Obișnuit", „Vacanță", „Extins", „Demonstrativ" |
| suggested_credit_cost | numeric nullable | doar se pre-completează în formular |
| counts_in_stats | boolean | singura logică reală: exclude din rata de prezență |
| is_active | boolean | |

Seed: „Obișnuit" (sugerează 1, intră în statistici) și „Special" (sugerează 0,
exclus din statistici). Restul le adaugă ea.

Tot ce ține de structura atelierului — durată, câte ședințe, cât consumă — se
introduce **pe sesiune**, manual, de fiecare dată. Dacă Rebecca vrea un atelier
de 6 ore care valorează 3 ședințe, tastează 6 ore și 3. Dacă vrea 4 întâlniri de
2 ore, creează 4 sesiuni de câte 1 ședință. Aplicația nu are opinii.

### `sessions` — atelierul programat
| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| session_type_id | uuid FK → session_types | |
| group_id | uuid FK → groups **nullable** | null = atelier cu participanți manuali |
| title | text nullable | „Atelier de vacanță — Crăciun" |
| date | date | |
| start_time / end_time | time | durata e liberă: 1h30 sau 4h |
| credit_cost | numeric | preluat din tip, **editabil per sesiune** |
| topic | text nullable | |
| instructor_id | uuid FK → users nullable | |
| status | enum | `scheduled` / `completed` / `cancelled` |
| capacity | int nullable | util la atelierele speciale |
| notes | text nullable | |

O sesiune anulată nu consumă credite nimănui, dar rămâne vizibilă în istoric.

### `session_participants` — participanți aleși manual
| session_id | uuid FK |
| child_id | uuid FK |
| added_by / added_at | |

PK compus. Pentru atelierele legate de o grupă tabela rămâne goală —
participanții se deduc din grupă. Se populează doar când `group_id` e null sau
când Rebecca adaugă manual un copil în plus: atelier de vacanță, recuperare,
frate venit o dată, copil de probă.

**De ce nu populăm tabela și pentru atelierele normale:** dacă un copil intră în
grupă la mijlocul lunii, nu vrei să-l adaugi manual la 12 sesiuni viitoare.
Grupa e sursa de adevăr pentru atelierele recurente.

### `subscriptions`
| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| child_id | uuid FK | |
| name | text | ex. „Abonament 8 ședințe" — text liber |
| total_credits | numeric | câte ședințe include |
| price | numeric(10,2) | **stabilit per copil**, poate fi 0 |
| price_note | text nullable | motivul reducerii, **strict intern** |
| start_date / end_date | date | |
| status | enum | `active` / `expired` / `cancelled` |
| created_by / created_at | | |

**Despre prețurile reduse:**
Un abonament redus sau gratuit e pur și simplu unul cu `price` mai mic, eventual
0. Nu există mecanism special. Soldul iese corect de la sine, iar copilul nu
apare ca restanțier.

`price_note` e opțional și vizibil **doar** în fișa financiară — niciodată pe
ecranul de prezență, niciodată în portalul părinților, niciodată într-un export.
Un ecran deschis la atelier e văzut de copii și de alți părinți.

Un copil poate avea mai multe abonamente în istoric. Cel „curent" = cel activ cu
`end_date >= azi` și credite rămase > 0.

### `attendance` — inima aplicației
| id | uuid PK |
| session_id | uuid FK |
| child_id | uuid FK |
| status | enum | `present` / `absent` / `late` |
| credits_used | numeric | **editabil de Rebecca**, vezi secțiunea 2 |
| subscription_id | uuid FK nullable | null = drop-in sau plătit separat |
| is_drop_in | boolean |
| marked_by / marked_at | |
| updated_by / updated_at | nullable |

UNIQUE (session_id, child_id).

**Logica implicită** (Rebecca o poate suprascrie cu un tap):
- `present` → `credits_used = sessions.credit_cost`
- `absent` → același cost, dar apare butonul „Nu scădea ședința" → 0
- sesiune anulată → toate prezențele au `credits_used = 0`
- copil fără abonament valid → `subscription_id = null`, `credits_used = 0`,
  se propune înregistrarea unei plăți drop-in

### `payments`
| id | uuid PK |
| child_id | uuid FK |
| subscription_id | uuid FK nullable | null = plată drop-in |
| amount | numeric(10,2) |
| paid_at | date |
| method | enum | `cash` / `transfer` / `card` — opțional în v1 |
| note | text nullable |
| recorded_by | uuid FK |

### `feedback`
| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| child_id | uuid FK | |
| session_id | uuid FK nullable | |
| author_id | uuid FK → users | |
| body | text | |
| status | enum | `draft` / `published` / `withdrawn` |
| published_at | timestamptz nullable | momentul apăsării „Trimite părintelui" |
| email_scheduled_for | timestamptz nullable | `published_at + 10 minute` |
| email_sent_at | timestamptz nullable | null dacă a fost retras la timp |
| withdrawn_at / withdrawn_by | nullable | |
| created_at / updated_at | | |

### `feedback_versions`
| id, feedback_id, body, edited_by, edited_at |

Se scrie la fiecare modificare după publicare. Dacă un părinte spune „ai scris
altceva prima dată", există răspunsul.

### `feedback_replies`
| id, feedback_id, author_id (părinte), body, created_at |

### `notifications_log`
Fiecare mesaj trimis către un părinte, fără excepție.

| id | uuid PK |
| child_id | uuid FK |
| recipient_parent_id | uuid FK |
| type | enum | `payment_reminder` / `expiry_reminder` / `feedback_published` / `feedback_reply` / `custom` |
| channel | enum | `email` (v1) |
| subject / body | text | textul exact trimis |
| sent_by | uuid FK → users | cine a apăsat butonul |
| sent_at | timestamptz | |
| status | enum | `sent` / `failed` |

Rolul: Rebecca vede când a trimis ultima dată și cui, ca să nu insiste de trei
ori în aceeași săptămână. Și are dovada că a trimis, dacă un părinte spune că
nu a primit nimic.

### `audit_log`
| id, actor_id, entity_type, entity_id, action, changes (jsonb), created_at |

Se scrie la: modificare prezență, ștergere prezență, modificare abonament,
înregistrare/ștergere plată, modificare acord GDPR. Când un părinte reclamă
„copilul meu nu a fost joi", ai răspunsul în 10 secunde.

---

## 5. Ecranul de bifat prezențe — cel mai important din aplicație

Riscul numărul unu al proiectului nu e tehnic. E ca Rebecca să renunțe la
aplicație și să revină la caiet pentru că durează prea mult. Ecranul ăsta merită
de trei ori mai multă atenție decât oricare altul.

**Cerințe:**
- Se deschide direct pe sesiunea de azi a grupei respective, fără navigare
- Toți copiii grupei, listă verticală, **un singur tap = prezent**
- Butoane mari, minim 44px înălțime — se folosește cu copiii pe cap
- Lângă fiecare nume: indicator de abonament
  - 🟢 abonament valid, N ședințe rămase
  - 🟡 mai are 1 ședință / expiră în ≤7 zile
  - 🔴 expirat sau 0 ședințe → propune automat „drop-in"
- Lângă fiecare nume: indicator foto — 🟢 `full` / 🟡 `masked` / 🔴 `none`
- Salvare automată la fiecare tap, fără buton „Salvează"
- Buton „**+ Adaugă copil**" — caută în toți copiii activi, nu doar în grupă.
  Necesar pentru recuperări, frați veniți o dată, copii noi de probă.
- Dacă atelierul are cost diferit de 1 credit, se afișează clar sus:
  „Acest atelier consumă 2 ședințe"
- Funcționează pe telefon, în picioare, cu o mână
- Ideal: funcționează și fără internet, sincronizează după (v1.5, nu blocant)

**Ecran secundar, foarte cerut:** „Cine apare în poze — grupa de marți" —
listă cu cele trei culori, ca Rebecca să verifice înainte de a posta pe Instagram.

---

## Fișa financiară a copilului — al doilea ecran ca importanță

Exact ce a cerut Rebecca: într-un singur loc, tot ce ține de un copil.

**Sus, trei numere:**
- Ședințe rămase din abonamentul curent, și data expirării
- Total de plată / total achitat
- **Sold** — verde dacă e la zi, roșu cu suma dacă are restanță

**Dedesubt, două liste:**

*Abonamente* — nume, perioadă, credite, preț, credite consumate, credite rămase.
Cele expirate rămân vizibile, estompate.

*Plăți* — dată, sumă, metodă, notă, cine a înregistrat. Buton „+ Adaugă plată"
mare, pentru că e acțiunea cea mai frecventă.

**Sub ele:** istoricul complet de prezențe, cu data, atelierul și câte credite a
consumat fiecare.

**Ecran derivat, necesar Rebeccăi:** „Cine are restanțe" — copiii cu sold
negativ, ordonați descrescător după sumă. Ăsta e răspunsul la întrebarea „cine
nu a plătit", pe care o pune de fapt lunar.

Copiii cu statut `Scutit` **nu apar aici**. Nu ca filtru pe care Rebecca îl
bifează — pur și simplu nu apar, niciodată.

Lângă fiecare rând, un buton **„Trimite notificare de plată"**:
- deschide un mesaj pre-completat, editabil, cu suma și scadența
- Rebecca îl citește, îl modifică dacă vrea, apoi apasă „Trimite"
- arată când i-a mai trimis ultima dată acelui părinte
- butonul nu există pentru copiii cu statut `Scutit`

---

## Notificări — regula pentru v1

> **Nimic nu pleacă din aplicație fără ca Rebecca să apese un buton.**

Zero mesaje automate legate de bani sau de abonamente. Nici pentru plăți, nici
pentru expirare. Aplicația **semnalează pe ecran** ce ar trebui trimis și
pregătește textul, dar trimiterea e întotdeauna o decizie umană.

Singura excepție e feedbackul, descrisă mai jos — și chiar și acolo, emailul
pleacă doar după ce Rebecca apasă un buton, cu o fereastră de anulare.

Motivul: e ușor să pornești o automatizare peste trei luni. E greu să repari
relația cu un părinte care a primit un email de restanță generat de un bug la 3
dimineața. La scara unui club de câteva zeci de copii, automatizarea nu
economisește destul timp cât să merite riscul.

Ce construim în schimb: un panou „De trimis azi" — abonamente care expiră,
restanțe, feedback nepublicat — de unde Rebecca trimite în bloc sau individual,
după ce se uită peste listă.

### Excepția: feedbackul

Feedbackul are notificare pe email, în ambele sensuri. Dar cu o construcție
specifică, pentru că aici greșelile sunt ireversibile.

**Cele trei stări ale unui feedback:**

| stare | vede părintele? | email trimis? |
|---|---|---|
| `draft` | nu | nu |
| `published` | da | după 10 minute |
| `withdrawn` | nu | doar dacă apucase să plece |

**Fluxul:**

1. Rebecca scrie. Se salvează automat ca **ciornă**. Poate lăsa lucrarea la
   jumătate și reveni peste trei zile.
2. Apasă **„Trimite părintelui"** — buton distinct, separat vizual de „Salvează".
   Nu se ajunge acolo din greșeală apăsând Enter.
3. Feedbackul devine vizibil imediat în aplicație. **Emailul pleacă abia peste
   10 minute.**
4. În fereastra asta, butonul **„Retrage"** anulează totul silențios: feedbackul
   dispare din contul părintelui, emailul nu mai pleacă niciodată. Părintele nu
   află că a existat ceva.
5. După ce emailul a plecat, „Retrage" tot funcționează — ascunde conținutul din
   aplicație — dar interfața trebuie să spună clar: *„Emailul a fost deja
   trimis. Părintele știe că i-ai scris ceva, dar nu va putea citi conținutul."*

> **Regula de aur: emailul nu conține niciodată textul feedbackului.**
> Doar: „Rebecca a scris ceva despre Maria" + un link către aplicație.

Trei motive: retragerea chiar funcționează, conversația se mută în aplicație
unde părintele poate răspunde și rămâne o urmă, și nu circulă prin inbox-uri
observații despre un copil.

**Editarea după publicare** nu retrimite email. Se salvează o versiune nouă în
`feedback_versions`.

**Răspunsul părintelui** notifică imediat și automat pe Rebecca. Aici nu e
niciun risc — e un mesaj către ea, nu către un client.

---

## 6. Ce vede fiecare rol

### Admin (Rebecca)
- Dashboard: ateliere azi, abonamente care expiră în 7 zile, copii cu 0 ședințe, restanțieri
- Copii: listă, adăugare, editare, mutare între grupe, dezactivare
- Părinți: creare cont, legare la copil/copii, resetare parolă
- Grupe și sesiuni: creare, programare recurentă, anulare
- Prezențe: ecranul de mai sus + editare retroactivă
- Abonamente: creare, vizualizare sold, istoric
- Plăți: înregistrare, listă, filtrare pe lună
- Acorduri GDPR: setare status foto/tag per copil
- Feedback: scriere, publicare, citire răspunsuri
- Statistici și export

### Instructor
Ca adminul, **minus** plăți, sume și statistici financiare. Chiar dacă acum e
doar Rebecca, rolul se adaugă acum în 20 de minute și mai târziu în 2 zile.

### Părinte
- Doar copiii proprii, strict izolat (Row Level Security în Supabase)
- Prezențe: listă cu date, prezent/absent
- Abonament: câte ședințe rămase, data expirării
- Plăți: ce a achitat și când
- Feedback de la Rebecca + posibilitate de răspuns
- **Nu poate** modifica nimic: nici prezențe, nici date proprii fără aprobare

---

## 7. Fazele de implementare

Se livrează în ordinea asta. Fiecare fază trebuie să fie funcțională și testată
înainte de următoarea.

### Faza 0 — Fundație
Setup Next.js + Supabase + ORM, migrări, autentificare cu email/parolă, roluri,
Row Level Security, layout de bază, deploy pe Vercel din GitHub.
**Criteriu de acceptare:** Rebecca se loghează și vede un dashboard gol.

### Faza 1 — Nucleul administrativ ⭐ prioritate maximă
Grupe (cu editare și arhivare), tipuri de atelier, copii, sesiuni normale și
speciale, **ecranul de prezență**, acorduri GDPR.
Fără abonamente, fără părinți, fără plăți.
**Criteriu de acceptare:** Rebecca bifează prezența la un atelier real, de pe
telefon, în sub 60 de secunde.

### Faza 2 — Abonamente și plăți
Creare abonamente, calcul sold derivat, drop-in, înregistrare plăți, alerte
vizuale pentru expirare.
**Criteriu de acceptare:** soldul afișat coincide cu realitatea după 2 săptămâni
de utilizare.

### 🛑 Pauză obligatorie de 2 săptămâni
Rebecca folosește aplicația **în paralel cu metoda actuală**. Se compară.
Se repară ce se strică. Abia apoi mergi mai departe.

Motivul: din momentul în care părinții au acces, orice bug devine public și
costă credibilitate, nu doar timp.

### Faza 3 — Portalul părinților
Conturi părinți create de Rebecca, legare many-to-many, ecran read-only cu
prezențe / abonament / plăți.

### Faza 4 — Feedback
Ciorne cu salvare automată, buton distinct „Trimite părintelui", fereastră de
anulare de 10 minute, retragere, versionare, răspunsuri de la părinți.
Email fără conținut, doar cu link către aplicație.

**Necesită o coadă de joburi** (cron pe Vercel sau Supabase Edge Function
programată) pentru emailul întârziat cu 10 minute. E singura piesă de
infrastructură în plus din tot proiectul — merită, pentru că fereastra de
anulare e ce face retragerea să însemne ceva.

**Criteriu de acceptare:** Rebecca publică un feedback din greșeală, apasă
„Retrage" în 30 de secunde, iar părintele nu primește nimic și nu vede nimic.

### Faza 5 — Statistici și instrumente de comunicare
- Rata de prezență pe grupă și pe copil (doar ateliere cu `counts_in_stats`)
- Copii cu absențe repetate (semnal de abandon)
- Încasări pe lună, export CSV
- Panoul „De trimis azi" + butoanele de trimitere manuală
- Jurnalul notificărilor trimise

**Automatizarea notificărilor nu e în plan.** Se discută abia după ce Rebecca
folosește trimiterea manuală câteva luni și știe exact ce mesaje ar vrea
automate — dacă vreunul.

### Ulterior (nu acum)
Plată online, listă de așteptare, rezervare de locuri de către părinți,
notificări WhatsApp, aplicație mobilă nativă, facturare.

---

## 8. Reguli pentru implementare

1. **Niciodată DELETE.** Totul e `is_active = false`. Copiii pleacă și se întorc.
2. **Migrări versionate în git.** Fără modificări manuale în Supabase Studio.
3. **Seed data de la început** — 3 grupe, 10 copii, 5 sesiuni, 2 abonamente.
   Fără date de test nu poți evalua dacă ecranul de prezență e rapid.
4. **Import inițial.** Rebecca are datele acum într-un Excel sau caiet. Fă un
   import CSV rudimentar în Faza 1, altfel primele două zile sunt tastare
   manuală și entuziasmul moare acolo.
5. **Export complet al datelor.** E și cerință GDPR, e și plasă de siguranță.
6. **Mobile-first**, nu „responsive după". Rebecca nu deschide laptopul la atelier.
7. **Toate textele în română**, cu diacritice.
8. **Fără plată online în cod**, nici măcar pregătire. Se adaugă când e nevoie.

---

## 9. Întrebări de rezolvat înainte de Faza 3

- Cine creează conturile părinților — Rebecca manual, sau invitație pe email?
- Ce se întâmplă când un copil trece de la o grupă la alta — abonamentul rămâne?
  (Recomandarea mea: da, abonamentul aparține copilului, nu grupei.)
- Sesiunile se generează recurent (toate marțile din septembrie) sau una câte una?
- Abonamentul se măsoară în **ședințe** sau în **ore**? Dacă atelierele variază
  între 2h și 8h, „8 ședințe" devine ambiguu pentru părinte. Recomandarea mea:
  rămâne în ședințe, iar Rebecca decide manual câte ședințe valorează un atelier
  lung. Dar merită întrebată, pentru că afectează cum comunică ea cu părinții.
- Un copil poate avea două abonamente active simultan? Dacă da, la bifare trebuie
  ales din care se scade — o complicație reală a ecranului de prezență.
- Ce vede părintele despre bani? Doar plățile făcute, sau și restanța? (Aș începe
  cu plățile și soldul, fără prețul abonamentului — evită discuții inutile.)
