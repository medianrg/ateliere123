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
