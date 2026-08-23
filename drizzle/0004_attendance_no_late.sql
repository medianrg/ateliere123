-- Prezența are doar două stări: prezent sau absent. "Întârziat" dispare --
-- un status în plus era o decizie în plus la fiecare copil, fără să se
-- folosească informația nicăieri. Vezi PLAN.md secțiunea 9, "Alte decizii".
--
-- Postgres nu poate scoate o valoare dintr-un enum direct -- se recreează
-- tipul. Rândurile existente cu status='late' devin 'present': copilul a
-- fost la ședință, doar a venit mai târziu -- cel mai apropiat sens, și
-- oricum nu exista nicio logică (sessions_used, alerte) legată de "late".

ALTER TABLE public.attendance ALTER COLUMN status TYPE text USING status::text;

UPDATE public.attendance SET status = 'present' WHERE status = 'late';

DROP TYPE public.attendance_status;
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent');

ALTER TABLE public.attendance
  ALTER COLUMN status TYPE public.attendance_status USING status::public.attendance_status;
