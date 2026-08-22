# Ateliere123 — Plan de implementare

Aplicație de management al prezenței, abonamentelor și comunicării cu părinții
pentru un club de ateliere de dezvoltare pentru copii.

Utilizatori: **Rebecca** (admin/instructor) și **părinții** copiilor înscriși.

---

## 1. Decizii deja luate

| Subiect | Decizie |
|---|---|
| Ateliere | Complet editabile: creare, redenumire, arhivare. Atelierul e și program, și grupă de copii. |
| Interval de vârstă | Doar etichetă informativă. **Nu validează nimic.** Intervalele se suprapun și se schimbă în timp. |
| Ritm | Setabil per atelier: săptămânal, la două săptămâni, lunar, sau fără program fix. |
| Durata ședinței | **Irelevantă pentru orice calcul.** 1,5 ore sau 6 ore — tot o ședință e. |
| Ateliere speciale | Trebuie suportate: ateliere de vacanță, evenimente ad-hoc. Nu afectează fluxul normal. |
| Preț | Două tarife pe atelier: preț pe ședință în abonament, și preț la bucată (mai mare). Se copiază în abonament la creare. Poate fi redus sau 0. |
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
> Se calculează întotdeauna din înregistrările de prezență.

```
ședințe_rămase = abonament.total_sessions
                 − SUM(prezențe.sessions_used WHERE abonament_id = X)
```

Motivul pentru calcul derivat: un contor `ramase = ramase - 1` se strică la prima
corectură, la primul dublu-click, la prima ștergere. Un calcul derivat e mereu
corect, e auditabil și permite Rebeccăi să modifice orice fără efecte laterale.

**`sessions_used` e aproape întotdeauna 1.** Durata nu contează — o ședință de
6 ore și una de 1,5 ore consumă la fel.

| Situație | sessions_used |
|---|---|
| Copil prezent, orice durată | 1 |
| Absență pe care Rebecca o iartă | 0 |
| Absență nemotivată | 1 |
| Ședință anulată de club | 0 |
| Drop-in (fără abonament) | 0, `subscription_id = null` |

Câmpul rămâne numeric, nu boolean, ca Rebecca să poată pune 2 într-un caz
neprevăzut. Dar valoarea implicită e 1 și nu se calculează din nimic.

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

### `workshops` — atelierele (în interfață: „Ateliere")
Înlocuiește ce se numea anterior `groups`. Atelierul e și program, și grupă.

| câmp | tip | note |
|---|---|---|
| id | uuid PK | |
| name | text | „Atelier 10-12 ani", „Atelier 14-18 ani" — apare în calendar |
| min_age / max_age | int nullable | **doar etichetă**, nu validează nimic |
| **price_per_session** | numeric(10,2) | prețul unei ședințe în abonament |
| **drop_in_price** | numeric(10,2) | prețul unei ședințe plătite la bucată — mai mare |
| color | text nullable | identificare vizuală în calendar |
| frequency | enum | `weekly` / `biweekly` / `monthly` / `none` |
| weekday | int nullable | 1-7 |
| start_time | time nullable | |
| duration_min | int nullable | **informativ**, nu afectează niciun calcul |
| month_week | int nullable | doar pentru `monthly` |
| sessions_per_month | int nullable | informativ, ajută la crearea abonamentelor |
| is_active | boolean | arhivare, niciodată ștergere |
| sort_order | int | |

**Două prețuri, pentru că abonamentul e mai ieftin decât plata la bucată.**

| câmp | când se folosește | exemplu |
|---|---|---|
| `price_per_session` | la crearea unui abonament | 60 lei |
| `drop_in_price` | când un copil vine fără abonament | 80 lei |

Rebecca setează o dată „Atelier 10-12 ani = 60 lei/ședință în abonament,
80 lei la bucată". La crearea unui abonament de 4 ședințe, aplicația
completează 240 lei. Când bifează prezent un copil fără abonament valid,
propune o plată de 80 lei. Ambele sunt sugestii editabile.

Aici e singurul loc din aplicație unde prețurile chiar economisesc timp:
Rebecca nu trebuie să-și amintească tariful fiecărui atelier în momentul în
care are copiii pe cap.

**Durata nu intră în niciun calcul.** `duration_min` există doar ca să știe
Rebecca cât ține și ca să apară pe card. O ședință de 6 ore și una de 1,5 ore
consumă la fel din abonament: una.

**Mai multe ateliere pentru aceeași vârstă sunt normale.** „Atelier 10-12 Marți"
și „Atelier 10-12 Joi" pot exista simultan, cu prețuri diferite dacă e cazul.

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
| birth_date | date | informativ |
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

### `child_workshops` — un copil poate fi înscris la mai multe ateliere
| child_id | uuid FK |
| workshop_id | uuid FK |
| is_primary | boolean | atelierul principal, afișat în listă |
| joined_at / left_at | date nullable | |

PK compus (child_id, workshop_id).

**De ce nu un simplu `workshop_id` pe copil:** dacă există „Atelier 10-12 Marți"
și „Atelier 10-12 Joi", un copil poate veni la ambele. Chiar dacă azi niciunul
nu o face, relația multiplă costă o tabelă acum și o migrare peste trei luni.

Interfața rămâne simplă: la adăugarea unui copil se alege un singur atelier, iar
„+ Înscrie la alt atelier" e buton secundar.

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
| suggested_sessions_used | numeric nullable | doar se pre-completează în formular, implicit 1 |
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
| sessions_used_default | numeric | implicit 1, **editabil per ședință** |
| topic | text nullable | |
| instructor_id | uuid FK → users nullable | |
| status | enum | `scheduled` / `completed` / `cancelled` |
| capacity | int nullable | util la atelierele speciale |
| notes | text nullable | |

O ședință anulată nu consumă nimic din abonamente, dar rămâne vizibilă în istoric.

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
| workshop_id | uuid FK | la ce atelier e valabil |
| name | text | ex. „4 ședințe septembrie" — text liber |
| total_sessions | int | câte ședințe include |
| **price_per_session** | numeric(10,2) | **copiat din atelier la creare** |
| price | numeric(10,2) | implicit `total_sessions × price_per_session`, editabil |
| price_note | text nullable | motivul reducerii, **strict intern** |
| start_date / end_date | date | |
| status | enum | `active` / `expired` / `cancelled` |
| created_by / created_at | | |

**De ce se copiază prețul, nu se citește din atelier:** dacă în ianuarie Rebecca
ridică prețul de la 60 la 70 lei, abonamentele vândute în decembrie trebuie să
rămână la 60. Altfel istoricul de încasări se rescrie retroactiv și cifrele nu
mai corespund cu ce a încasat efectiv.

**Un abonament e legat de un atelier.** Un copil înscris la două ateliere cu
prețuri diferite are două abonamente separate. Asta răspunde și la întrebarea
„din care abonament se scade" la bifarea prezenței: din cel al atelierului
respectiv.

**Despre prețurile reduse:**
Un abonament redus sau gratuit e pur și simplu unul cu `price` mai mic, eventual
0. Nu există mecanism special. Soldul iese corect de la sine, iar copilul nu
apare ca restanțier.

`price_note` e opțional și vizibil **doar** în fișa financiară — niciodată pe
ecranul de prezență, niciodată în portalul părinților, niciodată într-un export.
Un ecran deschis la atelier e văzut de copii și de alți părinți.

Un copil poate avea mai multe abonamente în istoric. Cel „curent" = cel activ cu
`end_date >= azi` și ședințe rămase > 0.

### `attendance` — inima aplicației
| id | uuid PK |
| session_id | uuid FK |
| child_id | uuid FK |
| status | enum | `present` / `absent` / `late` |
| sessions_used | numeric | implicit 1, **editabil de Rebecca** |
| subscription_id | uuid FK nullable | null = drop-in sau plătit separat |
| is_drop_in | boolean |
| marked_by / marked_at | |
| updated_by / updated_at | nullable |

UNIQUE (session_id, child_id).

**Logica implicită** (Rebecca o poate suprascrie cu un tap):
- `present` → `sessions_used = 1`
- `absent` → același cost, dar apare butonul „Nu scădea ședința" → 0
- ședință anulată → toate prezențele au `sessions_used = 0`
- copil fără abonament valid → `subscription_id = null`, `sessions_used = 0`,
  se propune o plată drop-in cu suma din `workshops.drop_in_price`

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

## Terminologie — un cuvânt pentru un lucru

| cuvânt | înseamnă | exemplu |
|---|---|---|
| **Atelier** | programul + grupa de copii | „Atelier 10-12 ani" |
| **Ședință** | o întâlnire concretă, cu dată și oră | marți 26 aug, 17:00 |
| **Abonament** | un număr de ședințe cumpărate la un atelier | „8 ședințe" |

**Durata unei ședințe e irelevantă.** O întâlnire de 1,5 ore și una de 6 ore
sunt amândouă *o ședință*. Grupa 10-12 are ședințe de 2 ore (1,5 ore de lucru
plus acomodare și joacă), grupa 14-18 are ședințe de 6 ore, comasate lunar
pentru că adolescenții nu pot veni săptămânal. Pentru abonament, statistici și
plăți, ambele contează la fel: unu.

**Nu există „grupe" ca entitate separată.** Atelierul *este* grupa. Un copil e
înscris la „Atelier 10-12 ani", nu la o grupă dintr-un atelier. Un concept mai
puțin de explicat Rebeccăi și un tabel mai puțin în bază.

Numele atelierului e text liber și e ceea ce apare în calendar. Pot exista
simultan „Atelier 10-12 Marți" și „Atelier 10-12 Joi".

## Navigația

Ordinea urmează frecvența de folosire.

```
Calendar    Copii    Ateliere    Abonamente    Setări
```

- **Calendar** — ecranul de start, ședințele pe săptămâni
- **Copii** — listă și fișe individuale
- **Ateliere** — programe, ritm, preț pe ședință, copii înscriși
- **Abonamente** — abonamente, plăți, restanțe (din Faza 2)
- **Setări** — tipuri de ședință, acorduri, cont

„Tipuri atelier" nu stă în meniul principal. E configurare, nu lucru zilnic.

## Reguli de afișare

- **Nu afișa informație implicită.** Tipul „Obișnuit" nu se scrie pe card,
  pentru că e cazul normal. Se afișează doar tipurile diferite.
- **Cardul întreg e apăsabil**, nu doar un link gri într-un colț.
- **Fiecare card de ședință arată:** ziua și data, ora, numele atelierului,
  câți copii, și starea prezenței (bifat / nebifat).
- **Scrie data explicit.** „Azi" fără „marți, 26 august" obligă utilizatorul să
  se uite la telefon ca să se orienteze.
- **Contrast real pe acțiuni.** Gri deschis pe alb citește ca „dezactivat".

## Ecranul principal — calendarul

**Corecție față de versiunea anterioară a planului:** aplicația NU se deschide
pe „atelierul de azi". Clubul are ateliere două-trei zile pe săptămână, deci în
majoritatea zilelor nu e nimic azi, iar Rebecca rămâne cu un ecran gol care nu-i
spune ce să facă.

**Ecranul de start e o listă de ateliere, grupată pe săptămâni:**

```
ASTĂZI
  (dacă nu e nimic:)
  Niciun atelier astăzi.
  Următorul: marți, 26 august, 17:00 — 10-12 Marți   [Deschide]

SĂPTĂMÂNA ACEASTA
  Marți 26 aug, 17:00   10-12 Marți     12 copii   ✓ bifat
  Joi   28 aug, 17:00   10-12 Joi        9 copii   — nebifat
  Sâm   30 aug, 10:00   14-16 lunar      7 copii   — nebifat

SĂPTĂMÂNA VIITOARE
  ...

[ + Atelier nou ]   [ Generează sesiuni ]
```

- Atelierele trecute **nebifate** apar în roșu, sus. Ăsta e cel mai util semnal
  din toată aplicația: „ai uitat să bifezi joia trecută".
- Se poate derula înapoi în istoric și înainte în viitor.
- Un tap pe un atelier deschide ecranul de prezență.

## Generarea sesiunilor recurente

Buton **„Generează sesiuni"**, nu proces automat în fundal.

1. Rebecca alege grupa și perioada („septembrie 2026")
2. Aplicația calculează din programul grupei și **arată lista propusă**
3. Rebecca șterge din listă ce nu vrea (vacanțe, sărbători) și confirmă
4. Sesiunile se creează

Regenerarea nu suprascrie și nu șterge nimic: sesiunile care există deja sunt
sărite, cele bifate rămân neatinse. Orice sesiune generată poate fi mutată,
editată sau anulată individual după aceea.

## Ecranul de bifat prezențe — al doilea ca importanță

Riscul numărul unu al proiectului nu e tehnic. E ca Rebecca să renunțe la
aplicație și să revină la caiet pentru că durează prea mult. Ecranul ăsta merită
de trei ori mai multă atenție decât oricare altul.

**Cerințe:**
- Se ajunge aici cu un tap din lista de ateliere, fără navigare suplimentară
- Sus, clar: data, ora și numele grupei — Rebecca trebuie să știe unde e
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
- Dacă ședința consumă altceva decât 1 din abonament, se afișează clar sus
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

*Abonamente* — atelier, perioadă, ședințe incluse, preț, consumate, rămase.
Cele expirate rămân vizibile, estompate.

*Plăți* — dată, sumă, metodă, notă, cine a înregistrat. Buton „+ Adaugă plată"
mare, pentru că e acțiunea cea mai frecventă.

**Sub ele:** istoricul complet de prezențe, cu data, atelierul și câte ședințe a
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
