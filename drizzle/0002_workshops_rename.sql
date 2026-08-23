-- Faza 1, corectare terminologie: "grupă" -> "atelier".
-- Fiecare pas de mai jos RENAME/ADD/backfill -- nimic nu se șterge fără
-- să fi fost mutat mai întâi în altă parte. Sigur de rulat pe o bază de
-- date care are deja date din drizzle/seed.sql.

-- 1. groups -> workshops, cu câmpurile noi de ritm și preț -------------------
ALTER TABLE public.groups RENAME TO workshops;

CREATE TYPE public.workshop_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'none');

ALTER TABLE public.workshops
  ADD COLUMN price_per_session numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN drop_in_price numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN frequency public.workshop_frequency NOT NULL DEFAULT 'weekly',
  ADD COLUMN weekday integer,
  ADD COLUMN start_time time,
  ADD COLUMN duration_min integer,
  ADD COLUMN month_week integer,
  ADD COLUMN sessions_per_month integer;

-- Cele mai multe ateliere existente aveau default_day ca text liber
-- ("Marți"). Mutăm ce se poate recunoaște automat în noul câmp `weekday`
-- (1=Luni ... 7=Duminică); orice altceva rămâne null și se completează
-- manual din formularul de editare -- nu blochează nimic.
UPDATE public.workshops SET weekday = CASE default_day
  WHEN 'Luni' THEN 1
  WHEN 'Marți' THEN 2
  WHEN 'Miercuri' THEN 3
  WHEN 'Joi' THEN 4
  WHEN 'Vineri' THEN 5
  WHEN 'Sâmbătă' THEN 6
  WHEN 'Duminică' THEN 7
  ELSE NULL
END
WHERE default_day IS NOT NULL;

UPDATE public.workshops SET start_time = default_time WHERE default_time IS NOT NULL;

ALTER TABLE public.workshops
  DROP COLUMN default_day,
  DROP COLUMN default_time;

-- Politicile RLS existente (groups_all_staff, groups_select_parent) rămân
-- automat valabile pe tabela redenumită -- Postgres le urmărește după oid,
-- nu după nume. Le redenumim doar pentru claritate.
ALTER POLICY groups_all_staff ON public.workshops RENAME TO workshops_all_staff;
ALTER POLICY groups_select_parent ON public.workshops RENAME TO workshops_select_parent;

--> statement-breakpoint

-- 2. child_workshops: un copil poate fi înscris la mai multe ateliere -------
CREATE TABLE public.child_workshops (
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  joined_at date,
  left_at date,
  CONSTRAINT child_workshops_child_id_workshop_id_pk PRIMARY KEY (child_id, workshop_id)
);

-- Fiecare copil care avea deja un atelier (group_id) primește un rând
-- child_workshops echivalent, marcat ca atelier principal.
INSERT INTO public.child_workshops (child_id, workshop_id, is_primary, joined_at)
SELECT id, group_id, true, enrolled_at
FROM public.children
WHERE group_id IS NOT NULL;

ALTER TABLE public.children DROP COLUMN group_id;

ALTER TABLE public.child_workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_workshops_all_staff ON public.child_workshops
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY child_workshops_select_parent ON public.child_workshops
  FOR SELECT TO authenticated USING (public.is_parent_of_child(child_id));

--> statement-breakpoint

-- 3. sessions: group_id -> workshop_id, credit_cost -> sessions_used_default
ALTER TABLE public.sessions RENAME COLUMN group_id TO workshop_id;
ALTER TABLE public.sessions RENAME COLUMN credit_cost TO sessions_used_default;
ALTER TABLE public.sessions
  RENAME CONSTRAINT sessions_group_id_groups_id_fk TO sessions_workshop_id_workshops_id_fk;

-- 4. attendance: credits_used -> sessions_used ------------------------------
ALTER TABLE public.attendance RENAME COLUMN credits_used TO sessions_used;

-- 5. session_types: suggested_credit_cost -> suggested_sessions_used -------
ALTER TABLE public.session_types RENAME COLUMN suggested_credit_cost TO suggested_sessions_used;
